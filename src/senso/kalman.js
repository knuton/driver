var sylvester = require('sylvester');
var curry = require('curry');

const DEBUG = false;

// Normalize the force between 0 and 1. Sensor values are 16bit signed ints -> max 32767 and there are four of them.
const normalizationFactor = 1 / (32767 * 4);

function kalman(A, Q, mu, Sigma, x_hat, P, s) {

    if (DEBUG) {
        console.log('=====================');
        console.log("Q:", Q);
        console.log("mu:", mu);
        console.log("Sigma", Sigma);
        console.log("s:", s);
    }

    // Predict
    var x_hat_minus = x_hat.dup();
    var P_minus = P.add(Q);

    // shift s by callibration mean
    var s_prime = s.subtract(mu);

    // console.log("mu", mu);
    if (DEBUG)
        console.log("s_prime", s_prime);

    // Compute observation z from sensor values

    // the sum of all sensor values
    var f = $V([1, 1, 1, 1]).dot(s_prime);
    if (DEBUG)
        console.log('f:', f);

    var fi;
    if (f != 0) {
        fi = 1 / f;
    } else {
        fi = 0;
    }

    var A_prime = A.multiply(fi).augment($V([normalizationFactor, normalizationFactor, normalizationFactor, normalizationFactor])).transpose();

    if (DEBUG)
        console.log('A\':', A_prime);

    var z = A_prime.multiply(s_prime);

    if (DEBUG)
        console.log('z:', z);

    // Observation noise covariance matrix
    var R = A_prime.multiply(Sigma).multiply(A_prime.transpose());

    if (DEBUG)
        console.log('R:', R)

        // measurement update
    var y = z.subtract(x_hat_minus);

    var S = P_minus.add(R);

    var K = P_minus.multiply(S.inverse());

    var x = x_hat_minus.add(K.multiply(y));
    P = sylvester.Matrix.I(3).subtract(K).multiply(P_minus);

    return {x: x, P: P}

}

module.exports = curry(kalman);
