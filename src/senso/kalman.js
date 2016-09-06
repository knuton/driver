var sylvester = require('sylvester');

// state transition model
const F = sylvester.Matrix.I(3); // identity

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


function kalman(Q, mu, Sigma, x_hat, P, s) {

    // Predict
    var x_hat_minus = x_hat.dup();
    var P_minus = P.add(Q);

    // shift s by callibration mean
    var s_prime = s.subtract(mu);

    // Compute observation z from sensor values

    // the sum of all sensor values
    var f = $V([1, 1, 1, 1]).dot(s_prime);

    var fi;
    if (f != 0) {
        fi = 1 / f;
    } else {
        fi = 10000;
    }

    var A_prime = A.multiply(fi).augment($V([1, 1, 1, 1])).transpose();

    var z = A_prime.multiply(s_prime);

    // Observation noise covariance matrix
    var R = A_prime.multiply(Sigma).multiply(A_prime.transpose());

    // measurement update
    var y = z.subtract(x_hat_minus);

    var S = F.multiply(P_minus).multiply(F.transpose()).add(R);

    var K = P_minus.multiply(S.inverse());

    var x = x_hat_minus.add(K.multiply(y));
    P = sylvester.Matrix.I(3).subtract(K).multiply(P_minus);

    return {x: x, P: P}

}

module.exports = kalman;
