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

const log = require('electron-log');

const fs = require('fs');

let resourcesPath;
if (process.resourcesPath) {
    resourcesPath = process.resourcesPath + "/app";
} else {
    resourcesPath = '.';
}

// Hardware

function factory(sensoAddress, recorder) {

    var senso = require('./senso')(sensoAddress, recorder);

    // Start the server
    var https = require('https');
    var server = https.createServer({
        key: fs.readFileSync(resourcesPath + "/ssl/key.pem"),
        cert: fs.readFileSync(resourcesPath + "/ssl/cert.pem")
    }, app);
    server.listen(8380, function() {
        log.info('SERVER: Listening on ' + server.address().port)
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
        res.json({message: "Dividat Driver", version: pjson.version});
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
    var argv = require('minimist')(process.argv.slice(2));

    let recorder;
    if ('rec' in argv) {
        log.info("Recording data to: " + argv['rec']);
        const fs = require('fs');
        recorder = fs.createWriteStream(argv['rec']);
    }

    let sensoAddress;
    if ('address' in argv) {
        sensoAddress = argv['address'];
    }

    factory(sensoAddress, recorder);
}
