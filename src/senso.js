var net = require('net');
const EventEmitter = require('events');

const S = require('sylvester');

// Decoder for raw sensor data
var decode = require('./senso/decode');
var kalman = require('./senso/kalman');

// var SENSO_ADDRESS = '127.0.0.1';
var SENSO_ADDRESS = '192.168.1.3';

var CONTROL_PORT = 55567;
var DATA_PORT = 55568;

function factory() {
    var senso = new EventEmitter();

    // Control connection
    var control = new net.Socket();

    // store previous data for kalman...and initalize with null!
    var initPlate = {
        x: $V([0, 0, 0]),
        P: S.Matrix.Diagonal([0, 0, 0]),
        sensors: $V([0, 0, 0, 0])
    }
    senso.data = {
        time: 0,
        center: initPlate,
        up: initPlate,
        right: initPlate,
        down: initPlate,
        left: initPlate
    };

    function handleConnection(socket) {
        console.log("DATA: Connected");
        socket.on('data', function(raw) {

            var data = kalman(senso.data, decode(raw));
            senso.data = data;

            // Acknowledge the data
            socket.write("Acknowledge");

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
        setTimeout(connectControl, 1000);
    });
    control.on('error', function(err) {
        console.log('CONTROL: Error: ', err);
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
    return senso;

}

module.exports = factory();
