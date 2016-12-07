/************************************************
 * This is the express server that maps hardware
 * to WebSocket
 ************************************************/
var express = require('express');
var app = express();
var url = require('url');


// Hardware
var senso = require('./senso');

// Start the server
var http = require('http');
var server = http.createServer(app);
server.listen(8380, function() {
    console.log('SERVER: Listening on ' + server.address().port)
});

// WebSocket server
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    server: server
});


/************************************************
 * Index Route
 ************************************************/
app.get('/', function(req, res, next) {
    res.send('Senso');
});


/************************************************
 * Handle WebSocket connections
 ************************************************/
wss.on('connection', function connection(ws) {
    var location = url.parse(ws.upgradeReq.url, true);

    switch (location.pathname) {
        case "/senso":
            /************************************************
             * Senso
             ************************************************/
            senso.handleWebSocket(ws);
            break;
    }

});


// Handle windows ctrl-c...
if (process.platform === "win32") {

    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

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
