const BLOCK_TYPE = 0x80;

const SENSOR_BLOCKS = 1;

require('sylvester');

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

        var raw = permutation.multiply($V(rawArray));

        var plate = {}
        plate.sensors = raw;

        return plate;
    }

    function decodeSensorBlock(buffer, offset = 0) {
        s = {};

        // read time
        s['time'] = buffer.readUInt32LE(buffer, offset);

        s['center'] = decodePlate(buffer, offset + 4, $M([
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
        ]));
        // console.log("UP");
        s['up'] = decodePlate(buffer, offset + 12, $M([
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
        ]));
        s['right'] = decodePlate(buffer, offset + 20, $M([
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
        ]));
        s['down'] = decodePlate(buffer, offset + 28, $M([
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
        ]));

        // WARNING HACK
        // s['down'].sensors = s['down'].sensors.add($V([0,0,0,2900]));

        s['left'] = decodePlate(buffer, offset + 36, $M([
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
        ]));

        return s;
    }

    var block = [];
    var offset = 16; // Ignore header

    for (var i = 0; i < SENSOR_BLOCKS; i++) {
        block.push(decodeSensorBlock(buffer, offset));
        offset = offset + 44;
    }

    return block[0];
}
