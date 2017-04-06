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


function factory(sensoAddress, recorder) {

    // Load and connect Senso
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

    // socket.io
    var io = require('socket.io')(server);

    app.use(cors({
        origin: [/dividat\.(com|ch)$/, "http://localhost:8080"]
    }));

    /************************************************
     * Index Route
     ************************************************/
    app.get('/', function(req, res) {
        res.json({
            message: "Dividat Driver",
            version: pjson.version
        });
    });


    /************************************************
     * Debug Route
     ************************************************/
    // app.use('/debug', express.static('src/debug'));


    /************************************************
     * Handle WebSocket connections
     ************************************************/
    io.on('connection', senso);

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
