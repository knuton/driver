const BLOCK_TYPE = 0x80;

const SENSOR_BLOCKS = 1;

var sylvester = require('sylvester');
var DirectionContainer = require('./DirectionContainer');

module.exports = function decode(buffer) {

    function decodePlate(buffer) {
        return $V([buffer.readInt16LE(0), buffer.readInt16LE(2), buffer.readInt16LE(4), buffer.readInt16LE(6)]);
    }

    // Get just the data block
    var dataBlock = buffer.slice(8);

    var dataBlockLength = dataBlock.readUInt16LE(0);
    var dataType = dataBlock.readUInt8(2);
    var timeStamp = dataBlock.readUInt32LE(4);

    // Split up the data block into each direction
    var sensorData = new DirectionContainer(dataBlock.slice(8, 16), dataBlock.slice(16, 24), dataBlock.slice(24, 32), dataBlock.slice(32, 40), dataBlock.slice(40, 48));

    // Decode values and store as vectors
    var decoded = sensorData.ap(new DirectionContainer(decodePlate));

    return decoded;

}
