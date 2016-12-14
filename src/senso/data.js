// Handle data connection to Senso

const net = require('net');

const R = require('ramda');
const S = require('sylvester');

// Senso specific
var DirectionContainer = require('./DirectionContainer');
const decode = require('./decode');
const kalman = require('./kalman');
const coordinates = require('./coordinates');

const DEFAULT_DATA_PORT = 55568;

// Serialize raw sensor values, x and P
function serialize(sensors, x) {
    return {sensors: sensors.elements, x: x.elements[0], y: x.elements[1], f: x.elements[2]}
}

// Kalman Parameters
const Q = new DirectionContainer(S.Matrix.Diagonal([0.0000001, 0.0000001, 0.0005]));
const mu = new DirectionContainer($V([0, 0, 0, 0]));
const Sigma = new DirectionContainer(S.Matrix.Diagonal([100, 100, 100, 100]));

module.exports = function factory(host, callback, reconnect, port) {

    reconnect = reconnect || R.always(true);
    port = port || DEFAULT_DATA_PORT;

    // init x and P
    var x = coordinates.origin;
    var P = new DirectionContainer(S.Matrix.Diagonal([0, 0, 0]));

    var connection;
    var connected = false;
    createConnection();

    function createConnection() {
        if (reconnect()) {
            console.log("DATA: Trying to reach " + host + ":" + port);
            connection = new net.createConnection(port, host, onConnection);
            connected = false;
            connection.on('close', onClose);
            connection.on('error', onError);
            connection.on('data', onData);
        }
    }

    function onConnection() {
        console.log("DATA: Connected to ", host, ":", port);
        connected = true;
    }

    function onClose() {
        if (connected) {
            console.log("DATA: Connection closed.");
        }
        connected = false;

        setTimeout(createConnection, 2000);
    }

    function onError(err) {
        if (connected) {
            console.log("DATA: Error: ", err.code)
        }
    }

    function onData(raw) {
        // decode sensor values
        var sensors = decode(raw);

        // // Log data
        // if (LOG) {
        //     rawLog.write(raw.toString('base64'));
        //     rawLog.write('\n');
        //
        //     var decoded = senso.sensors.map((v) => {
        //         return v.elements
        //     }).toArray();
        //     var decodedCsv = [].concat.apply([], decoded).join(",");
        //     decodedLog.write(decodedCsv);
        //     decodedLog.write('\n');
        // }

        //
        // Kalman filter
        var filtered = new DirectionContainer(kalman).flipAp(coordinates.sensorPosition).flipAp(senso.Q).flipAp(senso.mu).flipAp(senso.Sigma).flipAp(senso.x).flipAp(senso.P).flipAp(sensors);
        senso.x = filtered.map(k => k['x']);
        senso.P = filtered.map(k => k['P']);

        // Serialize and emit
        var data = new DirectionContainer(R.curry(serialize)).flipAp(senso.sensors).flipAp(senso.x);
        return callback(data);
    }

    return connection;
}
