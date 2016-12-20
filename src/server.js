/************************************************
 * This is the express server that maps hardware
 * to WebSocket
 ************************************************/
const express = require('express');
const app = express();
const url = require('url');
const cors = require('cors');

//
const pjson = require('../package.json');

// Hardware
const DEFAULT_SENSO_ADDRESS = '192.168.1.10';

function factory(config) {

    if (config) {
        if (!config.get("senso.address")) {
            config.set("senso.address", DEFAULT_SENSO_ADDRESS);
        }
    } else {
        config = {
            get: function(key) {
                switch (key) {
                    case "senso.address":
                        return DEFAULT_SENSO_ADDRESS;
                        break;
                }
            },
            set: function(key, value) {
                return;
            }
        }
    }

    var senso = require('./senso')(config);

    // Start the server
    var http = require('http');
    var server = http.createServer(app);
    server.listen(8380, function() {
        console.log('SERVER: Listening on ' + server.address().port)
    });

    // WebSocket server
    var WebSocketServer = require('ws').Server;
    var wss = new WebSocketServer({server: server});

    app.use(cors({
        origin: [/dividat\.(com|ch)$/, "http://localhost:8080"]
    }));

    /************************************************
 * Index Route
 ************************************************/
    app.get('/', function(req, res) {
        res.json({message: "Welcome to the dividata API!", version: pjson.version});
    });

    app.use('/senso', senso.router);

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
                senso.onWS(ws);
                break;
        }

    });

    return server;

}

module.exports = factory;

if (require.main === module) {
    factory();
}
