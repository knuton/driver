const fs = require('fs');
const split = require('binary-split');
const net = require('net');

const EventEmitter = require('events');

var HOST = '127.0.0.1';
var PORT = 55568;

module.exports = function(recFile, timeout) {

    var replayer = Replayer(recFile, timeout);

    var server = net.createServer(function(socket) {
        // We have a connection - a socket object is assigned to the connection automatically
        console.log('DATA - Connection: ' + socket.remoteAddress + ':' + socket.remotePort);

        function send(data) {
            socket.write(data);
        }

        replayer.on('data', send);

        socket.on('close', () => {
            replayer.removeListener('data', send);
            console.log('DATA - Closed: ' + socket.remoteAddress + ' ' + socket.remotePort);
        });

    }).listen(PORT, HOST);
    console.log('DATA listening on ' + HOST + ':' + PORT);

}

function Replayer(recFile, timeout) {
    var emitter = new EventEmitter();

    function createStream() {
        var stream = new fs.createReadStream(recFile).pipe(split());

        stream.on('data', (data) => {
            stream.pause();

            var buf = new Buffer(data.toString(), 'base64')
            emitter.emit('data', buf);

            setTimeout(() => {
                stream.resume();
            }, timeout)
        }).on('end', () => {
            createStream();
        })
    }

    createStream();

    return emitter;

}
