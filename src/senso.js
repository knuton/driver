var net = require('net');
const EventEmitter = require('events');

const S = require('sylvester');
var curry = require('curry');

var Plates = require('./senso/plates');

const led = require('./senso/led');
const motor = require('./senso/motor');

// Decoder for raw sensor data
var decode = require('./senso/decode');
var kalman = require('./senso/kalman');
var coordinates = require('./senso/coordinates');

// var SENSO_ADDRESS = '127.0.0.1';
var SENSO_ADDRESS = '192.168.1.10';

var CONTROL_PORT = 55567;
var DATA_PORT = 55568;

// Data logging
const fs = require('fs');
const LOG = false;
if (LOG) {
    var rawLog = fs.createWriteStream("log_raw.dat");
    var decodedLog = fs.createWriteStream("log_decoded.csv");
}

// Serialize raw sensor values, x and P
function serialize(sensors, x, P) {
    return {
        sensors: sensors.elements,
        cop: [
            x.elements[0], x.elements[1]
        ],
        force: x.elements[2],
        P: P.diagonal().elements
    }
}

// Pack control Block
function packControl(block) {
    var protocol_header = new Buffer(8);
    protocol_header.fill(0);

    return Buffer.concat([
        protocol_header, block
    ], 8 + block.length)
}

function factory() {
    var senso = new EventEmitter();

    /************************************************
     * Decoding and Kalman
     ************************************************/
    // Initialize raw sensor values to 0
    senso.sensors = new Plates($V([0, 0, 0, 0]));

    // Kalman Parameters
    senso.Q = new Plates(S.Matrix.Diagonal([0.0000001, 0.0000001, 0.0005]));
    senso.mu = new Plates($V([0, 0, 0, 0]));
    senso.Sigma = new Plates(S.Matrix.Diagonal([100, 100, 100, 100]));

    senso.x = new Plates($V([1.5, 1.5, 0]), $V([1.5, 0.5, 0]), $V([2.5, 1.5, 0]), $V([1.5, 2.5, 0]), $V([0.5, 1.5, 0]));
    senso.P = new Plates(S.Matrix.Diagonal([0, 0, 0]));

    // senso.callibrate = function(mu, sigma) {
    //     console.log("CALLIBRATING");
    //     console.log("mu", mu);
    //     console.log("sigma", sigma);
    //     // this.x = new Plates($V([0, 0, 0]));
    //     // this.P = new Plates(S.Matrix.Diagonal([0, 0, 0]));
    //     this.mu = new Plates($V(mu.center), $V(mu.up), $V(mu.right), $V(mu.down), $V(mu.left));
    //     this.Sigma = new Plates(S.Matrix.Diagonal(sigma.center), S.Matrix.Diagonal(sigma.up), S.Matrix.Diagonal(sigma.right), S.Matrix.Diagonal(sigma.down), S.Matrix.Diagonal(sigma.left));
    // }

    /************************************************
     * Handle data connection
     ************************************************/
    function handleDataConnection(socket) {
        console.log("DATA: Connected");
        socket.on('data', function(raw) {

            // decode sensor values
            senso.sensors = decode(raw);

            // Log data
            if (LOG) {
                rawLog.write(raw.toString('base64'));
                rawLog.write('\n');

                var decoded = senso.sensors.map((v) => {
                    return v.elements
                }).toArray();
                var decodedCsv = [].concat.apply([], decoded).join(",");
                decodedLog.write(decodedCsv);
                decodedLog.write('\n');
            }

            // Kalman filter
            var filtered = new Plates(kalman).flipAp(coordinates.sensorPosition).flipAp(senso.Q).flipAp(senso.mu).flipAp(senso.Sigma).flipAp(senso.x).flipAp(senso.P).flipAp(senso.sensors);
            senso.x = filtered.map(k => k['x']);
            senso.P = filtered.map(k => k['P']);

            // Acknowledge the data
            socket.write("Acknowledge");

            // Serialize and emit
            var data = new Plates(curry(serialize)).flipAp(senso.sensors).flipAp(senso.x).flipAp(senso.P);
            senso.emit('data', data);

        });
        socket.on('error', function(err) {
            console.log("DATA: Error: ", err);
        });
    }

    /************************************************
     * Create and handle control connection
     ************************************************/
    function controlConnected() {
        console.log("CONTROL: Connected to ", SENSO_ADDRESS, ":", CONTROL_PORT);
        senso.control.connected = true;
    }

    function controlConnectionClose() {
        if (senso.control.connected)
            console.log("CONTROL: Connection closed.")
        senso.control.connected = false;

        setTimeout(createControlConnection, 2000);
    }

    function controlConnectionError(err) {
        if (senso.control.connected)
            console.log('CONTROL: Error: ', err.code);
        }

    function createControlConnection() {
        console.log("CONTROL: Trying to reach " + SENSO_ADDRESS + ":" + CONTROL_PORT)
        senso.control = new net.createConnection(CONTROL_PORT, SENSO_ADDRESS, controlConnected);
        senso.control.on('close', controlConnectionClose);
        senso.control.on('error', controlConnectionError);
        senso.control.connected = false;
    }

    createControlConnection();

    senso.sendControlMsg = function(block) {
        var p = packControl(block);
        console.log("CONTROL: Sending ", p);
        senso.control.write(p);
    }

    /************************************************
     * Handle WebSocket connection
     ************************************************/
    senso.handleWebSocket = function(ws) {
        console.log("WS: Connected.");

        function send(data) {
            ws.send(JSON.stringify(data), function(err) {
                if (err) {
                    console.log("WS: Error sending data, " + err);
                }
            });
        }

        senso.on('data', send);

        ws.on('message', function(data, flags) {
            data = JSON.parse(data);
            switch (data.type) {
                case "Led":
                    var s = data.setting;
                    var ledBlock = led.block(s.channel, s.symbol, s.mode, s.color, s.brightness, s.power);
                    senso.sendControlMsg(ledBlock);
                    break;

                case "Motor":
                    var s = data.setting;
                    var motorBlock = motor.block(s.channel, s.mode, s.impulses, s.impulse_duration);
                    senso.sendControlMsg(motorBlock);
                    break;

                case "Callibrate":
                    console.log("WARNING: Callibration has been disabled. Nothing changes...");
                    // console.log("  mu: ", data.mu);
                    // console.log("  sigma: ", data.sigma);
                    // Senso.callibrate(data.mu, data.sigma);
                    break;

                default:
                    console.log("CONTROL: Unkown control message type from Play: " + data.type);
                    break;

            }
        });

        // handle disconnect
        ws.on('close', function close() {
            console.log("WS: Disconnected.")
            senso.removeListener('data', send);
        });

    };

    /************************************************
     * Create data server
     ************************************************/
    console.log("DATA: Listening on " + DATA_PORT);
    var dataServer = net.createServer(handleDataConnection).listen(DATA_PORT);
    dataServer.on('error', function(err) {
        console.log('DATA: Error: ', err);
    });
    dataServer.on('close', function(err) {
        console.log('DATA: Server closed. ', err);
    });

    /************************************************
     * Ready!
     ************************************************/
    console.log("");
    console.log("###############################");
    console.log("# READY: Connect Senso now!");
    console.log("###############################");
    console.log("");

    return senso;

}

module.exports = factory();
