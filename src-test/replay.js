const fs = require('fs');
const split = require('binary-split');
const net = require('net');

function replayLog(logFile, dataTimeout, connection) {

    var log = new fs.createReadStream(logFile)

    var logStream = log.pipe(split());

    connection.on('close', () => {
        log.destroy();
        logStream.removeAllListeners();
    })

    logStream.on('data', (data) => {
        logStream.pause();

        var buf = new Buffer(data.toString(), 'base64')
        console.log(buf);

        connection.write(buf);

        // wait for dataTimeout and then resume the stream
        setTimeout(() => {
            logStream.resume();
        }, dataTimeout);

    }).on('end', () => {
        // reopen the log
        if (!connection.destroyed) {
            replayLog(logFile, dataTimeout, connection);
        }
    });
}

function connect(onConnect) {
    var connection = new net.createConnection(55568, "127.0.0.1");
    console.log("CONNECTION: Connecting");
    connection.on('connect', () => {
        onConnect(connection);
    }).on('error', (err) => {
        console.log("CONNECTION: Error ", err.message);
    }).on('close', () => {
        console.log("CONNECTION: Closed")
        setTimeout(() => {
            connect(onConnect);
        }, 2000);
    });
}

// Emulate the control server with a echo server.
const echo = require('./echo');

var argv = require('minimist')(process.argv.slice(2));

var logFile = argv['_'].pop() || "logs/testing.dat";
var dataTimeout = 't' in argv
    ? argv['t']
    : 10;

// start replaying log after 1s
setTimeout(() => {
    connect((connection) => {
        replayLog(logFile, dataTimeout, connection);
    })
}, 1000);
