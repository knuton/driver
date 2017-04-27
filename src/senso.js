/* Senso bridge
 * Creates a TCP <-> WebSocket bridge for connecting Play to Senso via a TCP connection.
 */
const Connection = require('./persistentConnection')

const DATA_PORT = 55568
const CONTROL_PORT = 55567
const DEFAULT_SENSO_ADDRESS = '169.254.1.10'

const log = require('electron-log')

// TODO: configuration is unnecessary with zeroconf. Remove once all devices have been udated to MDNS enabled firmware
let config
const constants = require('./constants')
try {
  const Config = require('electron-config')
  config = new Config()
} catch (err) {
  log.warn('Could not load config file.')
  config = {
    get: function (key) {
      return
    },
    set: function (key, value) {
      return
    }
  }
}

// Set up MDNS client
const os = require('os')
const R = require('ramda')

// compute list of interfaces to use for mdns client
var interfaces = R.filter(R.identity, R.flatten(R.values(R.map(R.map((ipInfo) => {
  if (ipInfo.internal === false && ipInfo.family === 'IPv4') {
    return ipInfo.address
  } else {
    return false
  }
}), os.networkInterfaces()))))

const bonjour = require('bonjour')({interface: interfaces})
const bonjourOptions = {type: 'sensoControl'}

function factory (sensoAddress, recorder) {
  sensoAddress = sensoAddress || config.get(constants.SENSO_ADDRESS_KEY) || DEFAULT_SENSO_ADDRESS

  var dataConnection = new Connection(sensoAddress, DATA_PORT, 'DATA', log)
  var controlConnection = new Connection(sensoAddress, CONTROL_PORT, 'CONTROL', log)

    // set up recording
  if (recorder) {
    dataConnection.on('data', (data) => {
      recorder.write(data.toString('base64'))
      recorder.write('\n')
    })
  }

  dataConnection.on('error', (err) => {
    // console.error('Data connection error: ', err)
  })
  controlConnection.on('error', (err) => {
    // console.error(('Control connection error:, ', err))
  })

  // TODO: remove autoconnect to predefined address (trust that MDNS will work)
  // connect with predifined default
  connect(sensoAddress)

  //
  bonjour.findOne(bonjourOptions, (service) => {
    if (service.addresses[0]) {
      let address = service.addresses[0]
      log.info('MDNS: Found Senso at ' + address)
      connect(address)
    }
  })

  function connect (address) {
    log.info('SENSO: Connecting to ' + address)
    dataConnection.connect(address)
    controlConnection.connect(address)
  }

  function onPlayConnection (ws) {
        // Handle a new connection to the application (most probably Play, but could be anything else ... like Manager)
        // argument is a socket.io socket (https://socket.io/docs/server-api/)

    log.info('Play connected (session:', ws.id, ')')

    sendSensoConnection()

    function sendSensoConnection () {
      ws.emit('BridgeMessage', {
        type: 'SensoConnection',
        connected: (controlConnection.connected && dataConnection.connected),
        connection: {
          type: 'IP',
          address: dataConnection.host
        }
      })
    }

        // Create a send function so that it can be cleanly removed from the dataEmitter
    function sendData (data) {
      ws.emit('DataRaw', data)
    }

    function sendControl (data) {
      ws.emit('ControlRaw', data)
    }
    dataConnection.on('data', sendData)
    controlConnection.on('data', sendControl)

    dataConnection.on('connect', sendSensoConnection)
    dataConnection.on('close', sendSensoConnection)
    controlConnection.on('connect', sendSensoConnection)
    controlConnection.on('close', sendSensoConnection)

    // Setup forwarding of mdns discovery up
    bonjour.find(bonjourOptions, (service) => {
      if (service.addresses[0]) {
        ws.emit('BridgeMessage', {
          type: 'SensoDiscovered',
          connection: {
            type: 'IP',
            address: service.addresses[0]
          }
        })
      }
    })

    ws.on('SendControlRaw', (data) => {
      try {
        var socket = controlConnection.getSocket()
        if (socket) {
          socket.write(data)
        } else {
          log.console.warn('Can not send command to Senso, no connection.')
        }
      } catch (e) {
        log.error('Error while handling Command:', e)
      }
    })

    ws.on('BridgeCommand', (command) => {
      try {
        switch (command.type) {
          case 'SensoConnect':
            if (command.connection.type === 'IP' && command.connection.address) {
              config.set(constants.SENSO_ADDRESS_KEY, command.connection.address)
              connect(command.connection.address)
            }
            break
          case 'GetSensoConnection':
            sendSensoConnection()
            break

          default:
            break
        }
      } catch (e) {
        console.error('Error while handling BridgeCommand:', e)
      }
    })

        // handle disconnect
    ws.on('disconnect', () => {
      log.info('WS: Disconnected.')

      dataConnection.removeListener('data', sendData)
      dataConnection.removeListener('connect', sendSensoConnection)
      dataConnection.removeListener('close', sendSensoConnection)

      controlConnection.removeListener('data', sendControl)
      controlConnection.removeListener('connect', sendSensoConnection)
      controlConnection.removeListener('close', sendSensoConnection)
    })
  }

  return onPlayConnection
}

module.exports = factory
