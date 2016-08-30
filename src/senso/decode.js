const BLOCK_TYPE = 0x80;

const SENSOR_BLOCKS = 1;

require('sylvester');
var Plates = require('./plates');

module.exports = function decode(buffer) {

    function decodePlate(buffer, offset = 0, permutation = $M([
        [
            1, 0, 0, 0
        ],
        [
            0, 1, 0, 0
        ],
        [
            0, 0, 1, 0
        ],
        [0, 0, 0, 1]
    ])) {

        var rawArray = [
            buffer.readUInt16LE(offset),
            buffer.readUInt16LE(offset + 2),
            buffer.readUInt16LE(offset + 4),
            buffer.readUInt16LE(offset + 6)
        ].map(normalize);

        function normalize(e) {
            return e - 20000;
        }

        return permutation.multiply($V(rawArray));

    }

    function decodeSensorBlock(buffer, offset = 0) {
        return new Plates(decodePlate(buffer, offset + 4, $M([
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
        ])), decodePlate(buffer, offset + 12, $M([
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
        ])), decodePlate(buffer, offset + 20, $M([
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
        ])), decodePlate(buffer, offset + 28, $M([
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
        ])), decodePlate(buffer, offset + 36, $M([
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
        ])));
    }

    var block = [];
    var offset = 16; // Ignore header

    for (var i = 0; i < SENSOR_BLOCKS; i++) {
        block.push(decodeSensorBlock(buffer, offset));
        offset = offset + 44;
    }

    return block[0];
}
