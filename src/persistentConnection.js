const net = require('net');
const log = require('electron-log');

function Connection(host, port, onData) {
    this.host = host;
    this.port = port;
    this.onData = onData;

    this.connected = false;
    this.destroyed = false;

    this.lastErrorMessage = "";
    log.info(this.formatLog("New connection."));

    this.connect();

}

Connection.prototype.connect = function() {
    var self = this;
    if (!self.destroyed) {
        self.connected = false;
        log.verbose(this.formatLog("Attempting connection."))
        self.socket = new net.createConnection(self.port, self.host, self.onConnect.bind(self)).setKeepAlive(true, 1000).setNoDelay(true).setTimeout(10000).on('timeout', self.onTimeout.bind(self)).on('close', self.onClose.bind(self)).on('error', self.onError.bind(self)).on('data', self.onData);
    }
}

// Basic API
Connection.prototype.getSocket = function() {
    return this.socket;
}

Connection.prototype.destroy = function() {
    log.info(this.formatLog("Detroying connection."));
    this.destroyed = true;
    if (this.socket) {
        this.socket.destroy();
    }
}

// Socket event handlers
Connection.prototype.onTimeout = function() {
    var self = this;
    self.lastErrorMessage = "Timeout"

    if (self.socket) {
        if (self.socket.connecting) {
            log.verbose(this.formatLog("Timeout while connecting."));
            self.socket.destroy();
        } else {
            log.verbose(this.formatLog("Timeout. Sending heart beat."));
            var heartBeat = (new Buffer(2)).fill(0);
            self.socket.write(heartBeat);
        }
    }
}

Connection.prototype.onConnect = function() {
    var self = this;
    self.connected = true;
    log.info(this.formatLog("Connected!"));
}

Connection.prototype.onClose = function() {
    var self = this;
    log.verbose(this.formatLog("Connection closed."));
    setTimeout(self.connect.bind(self), 5000);
}

Connection.prototype.onError = function(err) {
    this.lastErrorMessage = err.message;
    log.warn(this.formatLog('Error: ' + err.message));
}

Connection.prototype.formatLog = function(msg) {
    return this.host + ":" + this.port + " - " + msg;
}

module.exports = Connection;
