const EventEmitter = require('events');

const Connection = require('./persistentConnection');

const led = require('./senso/led');
const motor = require('./senso/motor');

const data = require('./senso/data');

const DEFAULT_DATA_PORT = 55568;
const DEFAULT_CONTROL_PORT = 55567;

// // Data logging
// const fs = require('fs');
// const LOG = false;
// if (LOG) {
//     var rawLog = fs.createWriteStream("log_raw.dat");
//     var decodedLog = fs.createWriteStream("log_decoded.csv");
// }

// Pack control Block
function packControl(block) {
    var protocol_header = new Buffer(8);
    protocol_header.fill(0);

    return Buffer.concat([
        protocol_header, block
    ], 8 + block.length)
}

function factory(sensoAddress) {

    var dataState = data.init()
    var dataEmitter = new EventEmitter();
    var dataConnection = Connection(sensoAddress, DEFAULT_DATA_PORT, (raw) => {
        var dataReturn = data.update(raw, dataState);
        dataState = dataReturn.state;
        dataEmitter.emit('data', dataReturn.toSend);
    }, "DATA");

    var controlConnection = Connection(sensoAddress, DEFAULT_CONTROL_PORT, (data) => {}, "CONTROL");

    function sendControl(block) {
        var socket = controlConnection.getSocket();
        if (socket) {
            socket.write(packControl(block));
        }
    }

    function onWS(ws) {

        console.log("WS: Connected.");

        function send(data) {
            ws.send(JSON.stringify(data), function(err) {
                if (err) {
                    console.log("WS: Error sending data, " + err);
                }
            });
        }

        dataEmitter.on('data', send);

        // handle disconnect
        ws.on('close', function close() {
            console.log("WS: Disconnected.")
            dataEmitter.removeListener('data', send);
        });

        // Handle incomming messages
        ws.on('message', function(data, flags) {
            var msg = JSON.parse(data);
            // console.log(msg);
            switch (msg.type) {
                case "Led":
                    var s = msg.setting;
                    var ledBlock = led(s.channel, s.symbol, s.mode, s.color, s.brightness, s.power);
                    sendControl(ledBlock);
                    break;

                case "Motor":
                    var s = msg.setting;
                    var motorBlock = motor(s.channel, s.mode, s.impulses, s.impulse_duration);
                    sendControl(motorBlock);
                    break;

                default:
                    console.log("CONTROL: Unkown control message type from Play: " + msg.type);
                    break;

            }
        });

    }

    return {onWS: onWS};

}

module.exports = factory;
