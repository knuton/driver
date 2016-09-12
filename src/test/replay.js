const fs = require('fs');
const split = require('binary-split');
const net = require('net');

function replayLog(logFile, dataTimeout, connection) {

    var logStream = fs.createReadStream(logFile).pipe(split());

    logStream.on('data', (data) => {
        logStream.pause();
        var buf = new Buffer(data.toString(), 'base64')
        console.log(buf);
        connection.write(buf);
        setTimeout(() => {
            logStream.resume();
        }, dataTimeout);
    }).on('end', () => {
        // reopen the log
        replayLog(logFile, dataTimeout, connection);
    });
}

function connect(onConnect) {
    var connection = net.createConnection(55568, "127.0.0.1");
    connection.on('connect', () => {
        onConnect(connection);
    }).on('error', (err) => {
        console.log("Could not connect to data server: ", err.code);
        process.exit(1);
    }).on('close', () => {
        console.log("Connection closed. Exiting.")
        process.exit(0);
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
