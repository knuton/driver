const EventEmitter = require('events');

const Connection = require('./persistentConnection');

const DATA_PORT = 55568;
const CONTROL_PORT = 55567;
const DEFAULT_SENSO_ADDRESS = '169.254.1.10';

const log = require('electron-log');

let config;
const constants = require('./constants');
try {
    const Config = require('electron-config');
    config = new Config();
} catch (err) {
    log.warn("Could not load config file.");
    config = {
        get: function(key) {
            return;
        },
        set: function(key, value) {
            return;
        }
    }
}

// Pack control Block
function packControl(block) {
    var protocol_header = new Buffer(8);
    protocol_header.fill(0);

    return Buffer.concat([
        protocol_header, block
    ], 8 + block.length)
}

function factory(sensoAddress, recorder) {


    let dataConnection;
    const dataEmitter = new EventEmitter();

    let controlConnection;
    const controlEmitter = new EventEmitter();

    sensoAddress = sensoAddress || config.get(constants.SENSO_ADDRESS_KEY) || DEFAULT_SENSO_ADDRESS;

    connect(sensoAddress);

    function connect(address) {

        log.info("SENSO: Connecting to " + address);

        // Destroy any previous connections
        if (dataConnection) {
            dataConnection.destroy();
        }

        dataConnection = new Connection(address, DATA_PORT, (raw) => {

            // Record data
            if (recorder) {
                recorder.write(raw.toString('base64'));
                recorder.write('\n');
            }

            dataEmitter.emit('raw', raw);

        }, "DATA");

        if (controlConnection) {
            controlConnection.destroy();
        }
        controlConnection = new Connection(address, CONTROL_PORT, (raw) => {
            controlEmitter.emit('raw', raw);
        }, "CONTROL");
    }

    function connected() {
        return (controlConnection.connected && dataConnection.connected);
    }


    function handleWS(ws) {
        log.info("WS: Connected.");

        // Create a send function so that it can be cleanly removed from the dataEmitter
        function send(data) {
            ws.emit('senso_data', data);
        }
        dataEmitter.on('raw', send);
        controlEmitter.on('raw', send);

        ws.on('senso_control', (data) => {
            try {
                var socket = controlConnection.getSocket();
                if (socket) {
                    socket.write(data);
                }
            } catch (e) {
                log.error("Error on handling senso_control:", e);
            }
        })

        // TODO implement driver commands (e.g. connect with ip, status, ..)

        // handle disconnect
        ws.on('disconnect', () => {
            log.info("WS: Disconnected.");
            dataEmitter.removeListener('raw', send);
            controlEmitter.removeListener('raw', send);
        });

    }

    return handleWS;

}

module.exports = factory;
