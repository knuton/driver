// Handle control connection to Senso

const net = require('net');

const DEFAULT_CONTROL_PORT = 55567;

// Pack control Block
function pack(block) {
    var protocol_header = new Buffer(8);
    protocol_header.fill(0);

    return Buffer.concat([
        protocol_header, block
    ], 8 + block.length)
}

module.exports = function factory(host, reconnect, port) {

    reconnect = reconnect || R.always(true);
    port = port || DEFAULT_CONTROL_PORT;

    var connection;
    var connected = false;
    createConnection();

    function createConnection() {
        if (reconnect()) {
            console.log("CONTROL: Trying to reach " + host + ":" + port)
            connection = new net.createConnection(port, host, onConnect);
            connected = false;
            connection.on('close', onClose);
            connection.on('error', onError);
        }
    }

    function onConnect() {
        console.log("CONTROL: Connected to ", host, ":", port);
        connected = true;

        connection.send = function(block) {
            var packed = pack(block);
            console.log("CONTROL: Sending ", packed);
            connection.write(packed);
        }
    }

    function onClose() {
        if (connected)
            console.log("CONTROL: Connection closed.")
        connected = false;

        setTimeout(createConnection, 2000);
    }

    function onError(err) {
        if (connected) {
            console.log('CONTROL: Error: ', err.code);
        }
    }

    return connection;
}
