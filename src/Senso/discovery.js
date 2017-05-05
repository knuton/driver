const os = require('os')
const R = require('ramda')
const EventEmitter = require('events')

// Discover Senso via mDNS

module.exports = (log) => {
  log = log || console

  let discovery = new EventEmitter()

  // compute list of interfaces to use for mdns client
  var interfaces = R.filter(R.identity, R.flatten(R.values(R.map(R.map((ipInfo) => {
    if (ipInfo.internal === false && ipInfo.family === 'IPv4') {
      return ipInfo.address
    } else {
      return false
    }
  }), os.networkInterfaces()))))

  const bonjour = require('bonjour')({
    // listen on all interfaces
    interface: interfaces,
    // use SO_REUSEADDR which allows reuse of address if already bound by an other server. I.e. this allows co-exitsance of certain system level mDNS services with our JS mDNS client.
    reuseAddr: true
  })

  // expose bonjour for more advanced usage
  discovery._bonjour = bonjour

  // Handle case where binding to interface fails. NOTE: this is not standard multicast-dns API!
  bonjour._server.mdns.on('error', (error) => {
    switch (error.code) {
      case 'EADDRINUSE':
        log.warn('mDNS: Could not bind to address ' + error.address)
        break
      default:
        log.warn('mDNS: Error ' + error.code)
        break
    }
  })

  bonjour.find({type: 'sensoControl'}, (service) => {
    if (service.addresses[0]) {
      let address = service.addresses[0]
      log.info('mDNS: Found Senso at ' + address)
      discovery.emit('found', address)
    }
  })

  return discovery
}
