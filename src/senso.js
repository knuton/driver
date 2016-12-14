const led = require('./senso/led');
const motor = require('./senso/motor');

const data = require('./senso/data');
const control = require('./senso/control');

var SENSO_ADDRESS = '127.0.0.1';
// var SENSO_ADDRESS = '192.168.1.10';

// // Data logging
// const fs = require('fs');
// const LOG = false;
// if (LOG) {
//     var rawLog = fs.createWriteStream("log_raw.dat");
//     var decodedLog = fs.createWriteStream("log_decoded.csv");
// }

function factory(ws) {

    console.log("WS: Connected.");

    function send(data) {
        ws.send(JSON.stringify(data), function(err) {
            if (err) {
                console.log("WS: Error sending data, " + err);
            }
        });
    }

    var reconnect = () => {
        if (ws.readyState <= 1) {
            return true;
        } else {
            return false;
        }
    }

    var dataConnection = data(SENSO_ADDRESS, send, reconnect);
    var controlConnection = control(SENSO_ADDRESS, reconnect);

    ws.on('message', function(data, flags) {
        data = JSON.parse(data);
        console.log(data);
        switch (data.type) {
            case "Led":
                var s = data.setting;
                var ledBlock = led(s.channel, s.symbol, s.mode, s.color, s.brightness, s.power);
                if (controlConnection.send) {
                    controlConnection.send(ledBlock);
                }
                break;

            case "Motor":
                var s = data.setting;
                var motorBlock = motor(s.channel, s.mode, s.impulses, s.impulse_duration);
                if (controlConnection.send) {
                    controlConnection.send(motorBlock);
                }
                break;

            default:
                console.log("CONTROL: Unkown control message type from Play: " + data.type);
                break;

        }
    });

    // handle disconnect
    ws.on('close', function close() {
        console.log("WS: Disconnected.")
        dataConnection.end();
        delete dataConnection;
        controlConnection.end();
        delete controlConnection;
    });

}

module.exports = factory;
