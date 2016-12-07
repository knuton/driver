// Model Senso plates as Applicative Functor

const fl = require('fantasy-land');

function Plates(center, up, right, down, left) {
    this.center = center;
    this.up = up || center;
    this.right = right || center;
    this.down = down || center;
    this.left = left || center;
    return this;
}

// Functor
Plates.prototype.map = function(f) {
    return new Plates(
    // center
    f(this.center),
    // up
    f(this.up),
    //  right
    f(this.right),
    // down
    f(this.down),
    // left
    f(this.left))
}
Plates.prototype[fl.map] = Plates.prototype.map;

// Apply
Plates.prototype.ap = function(b) {
    return new Plates(
    // center
    b.center(this.center),
    // up
    b.up(this.up),
    // right
    b.right(this.right),
    // down
    b.down(this.down),
    // left
    b.left(this.left))
}
Plates.prototype[fl.ap] = Plates.prototype.ap;

// flipped AP where function is in Apply and value is argument
// flipAp :: Apply f => f (a -> b) -> f a -> f b
Plates.prototype.flipAp = function(b) {
    return new Plates(
    // center
    this.center(b.center),
    // up
    this.up(b.up),
    // right
    this.right(b.right),
    // down
    this.down(b.down),
    // left
    this.left(b.left));
}

// Applicative
Plates.prototype.of = function(b) {
    return new Plates(b);
}
Plates.prototype[fl.of] = Plates.prototype.of;

// toArray
Plates.prototype.toArray = function() {
    return [this.center, this.up, this.right, this.down, this.left];
}

module.exports = Plates;
