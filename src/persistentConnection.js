const net = require('net');
const log = require('electron-log');

function Connection(host, port, onData) {
    this.host = host;
    this.port = port;
    this.onData = onData;

    this.connected = false;
    this.destroyed = false;

    this.lastErrorMessage = "";

    this.connect();

}

Connection.prototype.connect = function() {
    var self = this;
    if (!self.destroyed) {
        self.connected = false;
        self.log("Creating new connection.")
        self.socket = new net.createConnection(self.port, self.host, self.onConnect.bind(self)).setKeepAlive(true, 1000).setNoDelay(true).setTimeout(10000).on('timeout', self.onTimeout.bind(self)).on('close', self.onClose.bind(self)).on('error', self.onError.bind(self)).on('data', self.onData);
    }
}

// Basic API
Connection.prototype.getSocket = function() {
    return this.socket;
}

Connection.prototype.destroy = function() {
    this.log("Detroying connection.");
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
            self.log("Timeout while connecting.");
            self.socket.destroy();
        } else {
            self.log("Timeout. Sending heart beat.");
            var heartBeat = (new Buffer(2)).fill(0);
            self.socket.write(heartBeat);
        }
    }
}

Connection.prototype.onConnect = function() {
    var self = this;
    self.connected = true;
    self.log("Connected!");
}

Connection.prototype.onClose = function() {
    var self = this;
    self.log("Connection closed.");
    setTimeout(self.connect.bind(self), 5000);
}

Connection.prototype.onError = function(err) {
    this.lastErrorMessage = err.message;
    this.log('Error: ', err.message);
}

Connection.prototype.log = function(msg) {
    var formatted = this.host + ":" + this.port + " - " + msg;
    log.info(formatted);
}

module.exports = Connection;
