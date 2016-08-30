var sylvester = require('sylvester');

// state transition model
const F = sylvester.Matrix.I(3); // identity

// Process noice covariance Matrix
const Q = sylvester.Matrix.Diagonal([0.001, 0.001, 50]);

// Observation model
const H = sylvester.Matrix.I(3);

// Matrix A defines Sensor positions
const A = $M([
    // Position of Sensor A
    [
        -1, -1
    ],
    // Position of Sensor B
    [
        1, -1
    ],
    // Position of Sensor C
    [
        1, 1
    ],
    // Position of Sensor D
    [-1, 1]
]);

// Covariance matrix for sensor values
const V = sylvester.Matrix.I(4).multiply(100); // TODO: fine tune this!

const X = $M([
    [
        0.001, 0, 0
    ],
    [
        0, 0.001, 0
    ],
    [0, 0, 60]
]);

function estimate(x_hat = $V([0, 0, 0]), P = sylvester.Matrix.Diagonal([0, 0, 0]), s) {

    // Predict
    var x_hat_minus = x_hat.dup();
    var P_minus = P.add(Q);

    // Compute observation z from sensor values

    // the sum of all sensor values
    var f = $V([1, 1, 1, 1]).dot(s);
    // TODO: division by null check
    var fi;
    if (f != 0) {
        fi = 1 / f;
    } else {
        fi = 10000;
    }

    var A_prime = A.multiply(fi).augment($V([1, 1, 1, 1])).transpose();

    var z = A_prime.multiply(s);

    // Observation noise covariance matrix
    var R = A_prime.multiply(V).multiply(A_prime.transpose()).add(X);

    // measurement update
    var y = z.subtract(x_hat_minus);

    var S = H.multiply(P_minus).multiply(H.transpose()).add(R);
    var K = P_minus.multiply(H.transpose()).multiply(S.inverse());

    var x = x_hat_minus.add(K.multiply(y));
    P = sylvester.Matrix.I(3).subtract(K.multiply(H)).multiply(P_minus);

    return {x: x, P: P, sensors: s}

}

function estimatePlate(prev, observation) {
    return estimate(prev.x, prev.P, observation.sensors);
}

module.exports = function(prev, observations) {

    var data = {};
    data['time'] = observations['time'];
    data['center'] = estimatePlate(prev['center'], observations['center']);
    data['up'] = estimatePlate(prev['up'], observations['up']);
    data['right'] = estimatePlate(prev['right'], observations['right']);
    // NOTE: This is where you disable the down plate
    data['down'] = prev['down'];
    // data['down'] = estimatePlate(prev['down'], observations['down']);
    data['left'] = estimatePlate(prev['left'], observations['left']);

    return data;

}
