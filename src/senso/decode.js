const BLOCK_TYPE = 0x80;

const SENSOR_BLOCKS = 1;

var sylvester = require('sylvester');
var Plates = require('./plates');

module.exports = function decode(buffer) {

    function decodePlate(buffer) {
        return $V([buffer.readInt16LE(0), buffer.readInt16LE(2), buffer.readInt16LE(4), buffer.readInt16LE(6)]);
    }

    // Get just the data block
    var dataBlock = buffer.slice(16, 60);

    // Split up the data block into plates
    var sensorBlocks = new Plates(dataBlock.slice(4, 12), dataBlock.slice(12, 20), dataBlock.slice(20, 28), dataBlock.slice(28, 36), dataBlock.slice(36, 44));

    // Decode values and store as vectors
    var decoded = sensorBlocks.ap(new Plates(decodePlate));

    return decoded;

}
