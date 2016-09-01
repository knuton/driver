const BLOCK_TYPE = 0x80;

const SENSOR_BLOCKS = 1;

var sylvester = require('sylvester');
var Plates = require('./plates');

// Permutations for sensor values in order to allign all plates
var permutations = new Plates($M([
    [
        1, 0, 0, 0
    ],
    [
        0, 1, 0, 0
    ],
    [
        0, 0, 0, 1
    ],
    [0, 0, 1, 0]
]), $M([
    [
        1, 0, 0, 0
    ],
    [
        0, 1, 0, 0
    ],
    [
        0, 0, 0, 1
    ],
    [0, 0, 1, 0]
]), $M([
    [
        0, 0, 1, 0
    ],
    [
        1, 0, 0, 0
    ],
    [
        0, 1, 0, 0
    ],
    [0, 0, 0, 1]
]), $M([
    [
        0, 0, 0, 1
    ],
    [
        0, 0, 1, 0
    ],
    [
        1, 0, 0, 0
    ],
    [0, 1, 0, 0]
]), $M([
    [
        0, 1, 0, 0
    ],
    [
        0, 0, 0, 1
    ],
    [
        0, 0, 1, 0
    ],
    [1, 0, 0, 0]
]))

module.exports = function decode(buffer) {

    function decodePlate(buffer) {
        return $V([buffer.readUInt16LE(0), buffer.readUInt16LE(2), buffer.readUInt16LE(4), buffer.readUInt16LE(6)]);
    }

    // Get just the data block
    var dataBlock = buffer.slice(16, 60);

    // Split up the data block into plates
    var sensorBlocks = new Plates(dataBlock.slice(4, 12), dataBlock.slice(12, 20), dataBlock.slice(20, 28), dataBlock.slice(28, 36), dataBlock.slice(36, 44));

    // Decode values and store as vectors
    var decoded = new Plates(decodePlate).bind(sensorBlocks).call();

    // Permutes values
    // TODO: this should be done using nicer, but I can't figure out how call() works...
    var permuted = new Plates(permutations.center.multiply(decoded.center), permutations.up.multiply(decoded.up), permutations.right.multiply(decoded.right), permutations.down.multiply(decoded.down), permutations.left.multiply(decoded.left));

    return permuted;

}
