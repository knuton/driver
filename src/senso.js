var net = require('net');
const EventEmitter = require('events');

const S = require('sylvester');

var Plates = require('./senso/plates');

// Decoder for raw sensor data
var decode = require('./senso/decode');
var kalman = require('./senso/kalman');

// var SENSO_ADDRESS = '127.0.0.1';
var SENSO_ADDRESS = '192.168.1.10';

var CONTROL_PORT = 55567;
var DATA_PORT = 55568;

// Raw data logging
const fs = require('fs');
const LOG = false;
if (LOG) {
    var log = fs.createWriteStream("log.dat");
}

const A = new Plates(
// Center
$M([
    // Position of Sensor A
    [
        1, 1
    ],
    // Position of Sensor B
    [
        2, 1
    ],
    // Position of Sensor C
    [
        2, 2
    ],
    // Position of Sensor D
    [1, 2]
]),
// Up
$M([
    [
        0, 0
    ],
    [
        3, 0
    ],
    [
        2, 1
    ],
    [1, 1]
]),
// Right
$M([
    [
        2, 1
    ],
    [
        3, 0
    ],
    [
        3, 3
    ],
    [2, 2]
]),
// Down
$M([
    [
        1, 2
    ],
    [
        2, 2
    ],
    [
        3, 3
    ],
    [0, 3]
]),
// Left
$M([
    [
        0, 0
    ],
    [
        1, 1
    ],
    [
        1, 2
    ],
    [0, 3]
]));

function factory() {
    var senso = new EventEmitter();

    // Initialize raw sensor values to 0
    senso.sensors = new Plates($V([0, 0, 0, 0]));
    senso.history = new Plates([]);

    // Kalman Parameters
    senso.Q = new Plates(S.Matrix.Diagonal([0.0000001, 0.0000001, 100]));
    senso.mu = new Plates($V([20000, 20000, 20000, 20000]));
    senso.Sigma = new Plates(S.Matrix.Diagonal([100, 100, 100, 100]));

    senso.x = new Plates($V([1.5, 1.5, 0]), $V([1.5, 0.5, 0]), $V([2.5, 1.5, 0]), $V([1.5, 2.5, 0]), $V([0.5, 1.5, 0]));
    senso.P = new Plates(S.Matrix.Diagonal([0, 0, 0]));

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

    function handleConnection(socket) {
        console.log("DATA: Connected");
        socket.on('data', function(raw) {

            // Log data
            if (LOG) {
                log.write(raw.toString('base64'));
                log.write('\n');
            }

            // decode sensor values
            senso.sensors = decode(raw);

            // handle overflows as as negative values
            senso.sensors = senso.sensors.fmap(s => s.map(v => {
                if (v > 50000) {
                    return v - 65536;
                } else {
                    return v;
                }
            }));

            // senso.sensors = senso.sensors.fmap(s => s.add($V([20000,20000,20000,20000])));

            // Kalman filter
            var filtered = new Plates(kalman).bind(A).bind(senso.Q).bind(senso.mu).bind(senso.Sigma).bind(senso.x).bind(senso.P).bind(senso.sensors).call();
            senso.x = filtered.fmap(k => k['x']);
            senso.P = filtered.fmap(k => k['P']);

            // Acknowledge the data
            socket.write("Acknowledge");

            // Serialize and emit
            var data = new Plates(serialize).bind(senso.sensors).bind(senso.x).bind(senso.P).call();
            // console.log(data);
            senso.emit('data', data);

        });
        socket.on('error', function(err) {
            console.log("DATA: Error: ", err);
        });
    }

    function connectControl() {

        // reattempt connection if connection can not be established within 5s
        var timeout = setTimeout(connectControl, 5000);

        var control = new net.createConnection(CONTROL_PORT, SENSO_ADDRESS, () => {
            console.log("CONTROL: Connected to ", SENSO_ADDRESS, ":", CONTROL_PORT);
            clearTimeout(timeout);
            control.connected = true;
        });

        control.on('close', function() {
            if (control.connected)
                console.log("CONTROL: Connection closed.")
            clearTimeout(timeout);
            setTimeout(connectControl, 2000);
        });
        control.on('error', function(err) {
            if (control.connected)
                console.log('CONTROL: Error: ', err.code);
            }
        );

        senso.control = function(block) {
            var p = pack(block);
            console.log("CONTROL: Sending ", p);
            control.write(p);
        }

    }

    console.log("CONTROL: Trying to reach " + SENSO_ADDRESS + ":" + CONTROL_PORT)
    connectControl();

    // Create Data server
    console.log("DATA: Listening on " + DATA_PORT);
    var dataServer = net.createServer(handleConnection).listen(DATA_PORT);
    dataServer.on('error', function(err) {
        console.log('DATA: Error: ', err);
    });
    dataServer.on('close', function(err) {
        console.log('DATA: Server closed. ', err);
    });


    // Ready
    console.log("");
    console.log("###############################");
    console.log("# READY: Connect Senso now!");
    console.log("###############################");
    console.log("");

    function pack(block) {
        var protocol_header = new Buffer(8);
        protocol_header.fill(0);

        return Buffer.concat([
            protocol_header, block
        ], 8 + block.length)
    }

    senso.callibrate = function(mu, sigma) {
        console.log("CALLIBRATING");
        console.log("mu", mu);
        console.log("sigma", sigma);
        // this.x = new Plates($V([0, 0, 0]));
        // this.P = new Plates(S.Matrix.Diagonal([0, 0, 0]));
        this.mu = new Plates($V(mu.center), $V(mu.up), $V(mu.right), $V(mu.down), $V(mu.left));
        this.Sigma = new Plates(S.Matrix.Diagonal(sigma.center), S.Matrix.Diagonal(sigma.up), S.Matrix.Diagonal(sigma.right), S.Matrix.Diagonal(sigma.down), S.Matrix.Diagonal(sigma.left));
    }
    return senso;

}

module.exports = factory();
