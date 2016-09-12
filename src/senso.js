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

function factory() {
    var senso = new EventEmitter();

    // Control connection
    var control = new net.Socket();

    // Initialize raw sensor values to 0
    senso.sensors = new Plates($V([0, 0, 0, 0]));
    senso.history = new Plates([]);

    // Kalman Parameters
    senso.Q = new Plates(S.Matrix.Diagonal([0.0001, 0.0001, 500]));
    senso.mu = new Plates($V([20000, 20000, 20000, 20000]));
    senso.Sigma = new Plates(S.Matrix.Diagonal([100, 100, 100, 100]));

    senso.x = new Plates($V([0, 0, 0]));
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
            // senso.sensors = senso.sensors.fmap(s => s.map(v => {if (v > 50000) {
            // return v - 65536;
            // } else {
            // return v;
            // }}));

            // senso.sensors = senso.sensors.fmap(s => s.add($V([20000,20000,20000,20000])));

            // Kalman filter
            var filtered = new Plates(kalman).bind(senso.Q).bind(senso.mu).bind(senso.Sigma).bind(senso.x).bind(senso.P).bind(senso.sensors).call();
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
        console.log("CONTROL: Trying to reach " + SENSO_ADDRESS + ":" + CONTROL_PORT)
        control.connect(CONTROL_PORT, SENSO_ADDRESS, function() {
            console.log("CONTROL: Connected to ", SENSO_ADDRESS, ":", CONTROL_PORT);
        })

    }

    control.on('close', function() {
        console.log("CONTROL: Connection closed.")
        // setTimeout(connectControl, 1000);
    });
    control.on('error', function(err) {
        console.log('CONTROL: Error: ', err.code);
    });

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

    function pack(block) {
        var protocol_header = new Buffer(8);
        protocol_header.fill(0);

        return Buffer.concat([
            protocol_header, block
        ], 8 + block.length)
    }

    senso.control = function(block) {
        var p = pack(block);
        console.log("CONTROL: Sending ", p);
        control.write(p);
    }

    senso.callibrate = function(mu, simga) {
        this.x = new Plates($V([0, 0, 0]));
        this.P = new Plates(S.Matrix.Diagonal([0, 0, 0]));
        this.mu = new Plates($V(mu.center), $V(mu.up), $V(mu.right), $V(mu.down), $V(mu.left));
        this.Sigma = new Plates(S.Matrix.Diagonal(mu.center), S.Matrix.Diagonal(mu.up), S.Matrix.Diagonal(mu.right), S.Matrix.Diagonal(mu.down), S.Matrix.Diagonal(mu.left));
    }
    return senso;

}

module.exports = factory();
