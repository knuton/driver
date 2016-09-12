/************************************************
* This is the express server that maps hardware
* to WebSocket
************************************************/

var express = require('express');
var app = express();
var url = require('url');

// Load credentials
// var fs = require('fs');
// credentials = {
//     key: fs.readFileSync(__dirname + '/../../ssl/key.pem'),
//     cert: fs.readFileSync(__dirname + '/../../ssl/cert.pem')
// };

// Start the server
// var https = require('https');
// var server = https.createServer(credentials, app);
var http = require('http');
var server = http.createServer(app);
server.listen(8380, function() {
    console.log('SERVER: Listening on ' + server.address().port)
});

// WebSocket server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({server: server});

/************************************************
* Index Route
************************************************/
app.get('/', function(req, res, next) {
    res.send('Senso');
});


/************************************************
* Senso
************************************************/
var Senso = require('./senso');
var sensoLed = require('./senso/led');
var sensoMotor = require('./senso/motor');
Senso.handleConnection = function(ws) {
    console.log("WS: Connected.");
    function send(data) {
        ws.send(JSON.stringify(data), function(err) {
            if (err) {
                console.log("WS: Error sending data, " + err);
            }
        });
    }

    Senso.on('data', send);

    ws.on('message', function(data, flags) {
        data = JSON.parse(data);
        switch (data.type) {
            case "Led":
                var s = data.setting;
                var ledBlock = sensoLed.block(s.channel, s.symbol, s.mode, s.color, s.brightness, s.power);
                Senso.control(ledBlock);
                break;

            case "Motor":
                var s = data.setting;
                var motorBlock = sensoMotor.block(s.channel, s.mode, s.impulses, s.impulse_duration);
                Senso.control(motorBlock);
                break;

            case "Callibrate":
                // console.log("CALLIBRATE");
                // console.log("  mu: ", data.mu);
                // console.log("  sigma: ", data.sigma);
                Senso.callibrate(data.mu,data.sigma);
                break;

            default:
                console.log("CONTROL: Unkown control message type from Play: " + data.type);
                break;

        }
        // var setting = JSON.parse(data);
        // console.log('LED Setting: \n', setting);
        // led.set(setting);
    });

    // handle disconnect
    ws.on('close', function close() {
        console.log("WS: Disconnected.")
        Senso.removeListener('data', send);
    });

}

/************************************************
* Handle WebSocket connections
************************************************/
wss.on('connection', function connection(ws) {
    var location = url.parse(ws.upgradeReq.url, true);

    switch (location.pathname) {
        case "/senso":
            Senso.handleConnection(ws);
            break;
    }

});

// Handle windows ctrl-c...
if (process.platform === "win32") {

    var rl = require("readline").createInterface({input: process.stdin, output: process.stdout});

    rl.on("SIGINT", function() {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function() {
    //graceful shutdown
    console.log("Caught SIGINT. Closing down.")
    server.close();
    process.exit();
});

module.exports = server;
