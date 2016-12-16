const net = require('net');

module.exports = (host, port, onData, name) => {

    var name = name || "UNNAMED Connection";

    var log = ((msg) => {
        console.log(name + ": " + msg)
    });

    var connection = {};

    var connected = false;
    var destroyed = false;

    var socket;
    createConnection();

    function createConnection() {
        log("Attempting connection to " + host + ":" + port)
        socket = new net.createConnection(port, host, onConnect).setKeepAlive(true, 1000).setNoDelay(true);

        connected = false;

        socket.setTimeout(10000);
        socket.on('timeout', onTimeout);
        socket.on('close', onClose);
        socket.on('error', onError);
        socket.on('data', onData);
    }

    function onTimeout() {
        if (socket.connecting) {
            createConnection();
        } else {
            log("Timeout. Sending heart beat.");
            var heartBeat = (new Buffer(2)).fill(0);
            socket.write(heartBeat);
        }
    }

    function onConnect() {
        log("connected!");

        connected = true;
    }

    function onClose() {
        log("Connection closed.");

        connected = false;

        setTimeout(createConnection, 2000);
    }

    function onError(err) {
        log('Error: ', err.code);
    }

    connection.getSocket = () => {
        return socket;
    }

    return connection;

}
