const fs = require('fs');

const split = require('binary-split')

function replayLog(logFile) {

    var net = require('net');
    var connection = net.createConnection(55568, "127.0.0.1");

    connection.on('connect', () => {
        console.log("Connected to Data server.");

        logStream = fs.createReadStream(logFile).pipe(split());

        logStream.on('data', (data) => {
            logStream.pause();
            var buf = new Buffer(data.toString(), 'base64')
            console.log(buf);
            connection.write(buf);
            setTimeout(() => {
                logStream.resume();
            }, 10);
        }).on('end', () => {
            console.log("Log ended. Closing connection.");
            connection.end();
        })

    });

    connection.on('close', () => {
        setTimeout(() => {
            replayLog(logFile);
        }, 1000);
    });

    connection.on('error', (err) => {
        console.log('Error while connecting to data server: ', err.code);
    })
}

// Emulate the control server with a echo server.
var echo = require('./echo');

var logFile = process.argv[2] || "logs/testing.dat";
// start replaying log
setTimeout(() => {
    replayLog(logFile);
}, 1000);
