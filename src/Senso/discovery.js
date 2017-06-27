const os = require('os')
const R = require('ramda')
const EventEmitter = require('events')
const bonjour = require('bonjour')

function findInterfaces () {
  // compute list of interfaces to use for mdns client
  var interfaces = R.filter(R.identity, R.flatten(R.values(R.map(R.map((ipInfo) => {
    if (ipInfo.internal === false && ipInfo.family === 'IPv4') {
      return ipInfo.address
    } else {
      return false
    }
  }), os.networkInterfaces()))))

  return interfaces
}

// Discover Senso via mDNS
module.exports = (log) => {
  log = log || console

  let discovery = new EventEmitter()

  // An hash map of interfaces we are listening on to the bonjour object
  discovery.bonjours = {}

  function listenOnInterfaces () {
    // Get a list of active interfaces
    const interfaces = findInterfaces()

    const newInterfaces = R.difference(interfaces, R.keys(discovery.bonjours))
    const removedInterfaces = R.difference(R.keys(discovery.bonjours), interfaces)

    // Listen on new interfaces
    for (let i = 0; i < newInterfaces.length; i++) {
      const iface = newInterfaces[i]
      log.info('mDNS: Listening on ' + iface)

      discovery.bonjours[iface] = bonjour({
        interface: iface,
        // use SO_REUSEADDR which allows reuse of address if already bound by an other server. I.e. this allows co-exitsance of certain system level mDNS services with our JS mDNS client.
        reuseAddr: true
      })

      // Handle case where binding to interface fails. NOTE: this is not standard multicast-dns API!
      discovery.bonjours[iface]._server.mdns.on('error', (error) => {
        switch (error.code) {
          case 'EADDRINUSE':
            log.warn('mDNS: Could not bind to address ' + error.address)
            break
          default:
            log.warn('mDNS: Error ' + error.code)
            break
        }
      })

      discovery.bonjours[iface].find({type: 'sensoControl'}, (service) => {
        if (service.addresses[0]) {
          // console.log(service)
          let address = service.addresses[0]
          log.info('mDNS: Found Senso at ' + address)
          discovery.emit('found', address)
        }
      })
    }

    // Remove old interfaces
    for (let i = 0; i < removedInterfaces.length; i++) {
      const iface = removedInterfaces[i]
      delete discovery.bonjours[iface]
      log.info('mNDS: Removing interface ' + iface)
    }
  }

  listenOnInterfaces()

  // Check for new interfaces every 5 seconds
  setInterval(listenOnInterfaces, 5000)

  return discovery
}
