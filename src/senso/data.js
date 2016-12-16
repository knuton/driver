// Handle data connection to Senso

const R = require('ramda');
const S = require('sylvester');

// Senso specific
var DirectionContainer = require('./DirectionContainer');
const decode = require('./decode');
const kalman = require('./kalman');
const coordinates = require('./coordinates');

const DEFAULT_DATA_PORT = 55568;

// Serialize raw sensor values, x and P
function serialize(sensors, x) {
    return {sensors: sensors.elements, x: x.elements[0], y: x.elements[1], f: x.elements[2]}
}

// Kalman Parameters
const Q = new DirectionContainer(S.Matrix.Diagonal([0.0000001, 0.0000001, 0.0005]));
const mu = new DirectionContainer($V([0, 0, 0, 0]));
const Sigma = new DirectionContainer(S.Matrix.Diagonal([100, 100, 100, 100]));

function init() {
    return {
        x: new DirectionContainer($V([1.5, 1.5, 0]), $V([1.5, 0.5, 0]), $V([2.5, 1.5, 0]), $V([1.5, 2.5, 0]), $V([0.5, 1.5, 0])),
        P: new DirectionContainer(S.Matrix.Diagonal([0, 0, 0]))
    }
}

function update(raw, state) {

    // decode sensor values
    var sensors = decode(raw);

    // Kalman filter
    var filtered = new DirectionContainer(kalman).flipAp(coordinates.sensorPosition).flipAp(Q).flipAp(mu).flipAp(Sigma).flipAp(state.x).flipAp(state.P).flipAp(sensors);

    var updatedState = {
        x: filtered.map(k => k['x']),
        P: filtered.map(k => k['P'])
    }

    // Serialize and emit
    var serialized = new DirectionContainer(R.curry(serialize)).flipAp(sensors).flipAp(updatedState.x);

    return {state: updatedState, toSend: serialized};

}

module.exports = {
    init: init,
    update: update
}
