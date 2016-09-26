// Mapping to coordinate system

const S = require('sylvester');

const Plates = require('./plates');

module.exports = {
    origin: new Plates(
    // centegr
    $V([1.5, 1.5]),
    // up
    $V([1.5, 0.5]),
    // right
    $V([2.5, 1.5]),
    // down
    $V([1.5, 2.5]),
    // left
    $V([0.5, 1.5])),

    sensorPosition: new Plates(
    // center
    $M([
        // A
        [
            1, 1
        ],
        // B
        [
            2, 1
        ],
        // C
        [
            1, 2
        ],
        // D
        [2, 2]
    ]),
    // up
    $M([
        // A
        [
            0, 0
        ],
        // B
        [
            3, 0
        ],
        // C
        [
            1, 1
        ],
        // D
        [2, 1]
    ]),
    // right
    $M([
        // A
        [
            3, 0
        ],
        // B
        [
            3, 3
        ],
        // C
        [
            2, 1
        ],
        // D
        [2, 2]
    ]),
    // down
    $M([
        // A
        [
            3, 3
        ],
        // B
        [
            0, 3
        ],
        // C
        [
            2, 2
        ],
        // D
        [1, 2]
    ]),
    // left
    $M([
        // A
        [
            0, 3
        ],
        // B
        [
            0, 0
        ],
        // C
        [
            1, 2
        ],
        // D
        [1, 1]
    ]))

}
