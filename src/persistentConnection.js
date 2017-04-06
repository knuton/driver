const net = require('net');
const EventEmitter = require('events');

module.exports = function Connection(host, port, name, log) {

    var connection = new EventEmitter();

    connection.host = host;
    connection.port = port;

    connection.name = name || "";
    log = log || require('electron-log');


    // Helpers
    function formatLog(msg) {
        return connection.name + " (" + connection.host + ":" + connection.port + ") - " + msg;
    }

    // Handle socket events
    function onConnect() {
        connection.connected = true;
        log.info(formatLog("Connected."))
        connection.emit('connect');
    }

    function onClose() {
        connection.connected = false;
        log.verbose(formatLog("Connection closed."));
        connection.emit('close');
        setTimeout(connection.connect, 5000);
    }

    function onError(err) {
        log.warn(formatLog('Error: ' + err.message));
        connection.emit('error', err)
    }

    function onData(data) {
        connection.emit('data', data);
    }
    function onTimeout() {
        if (connection.socket) {
            if (connection.socket.connecting) {
                log.verbose(formatLog("Timeout while connecting."));
                connection.connect();
            }
            // else {
            // log.verbose(this.formatLog("Sending keepalive."));
            // var heartBeat = new Buffer(0);
            // self.socket.write(heartBeat);
            // }
        }
    }


    // API
    connection.connected = false;
    connection.connect = (host, port) => {
        host = host || connection.host;
        port = port || connection.port;

        connection.host = host;
        connection.port = port;

        if (connection.socket) {
            connection.socket.removeListener('connect', onConnect);
            connection.socket.removeListener('close', onClose);
            connection.socket.removeListener('error', onError);
            connection.socket.destroy();
        }

        log.verbose(formatLog("Connecting"));

        connection.socket = new net.createConnection(connection.port, connection.host)
            .setKeepAlive(true, 1000)
            .setNoDelay(true)
            .setTimeout(1000)
            .on('connect', onConnect)
            .on('close', onClose)
            .on('data', onData)
            .on('error', onError)
    }

    connection.getSocket = () => {
        return connection.socket;
    }

    log.info(formatLog("New connection."));


    return connection;
}
