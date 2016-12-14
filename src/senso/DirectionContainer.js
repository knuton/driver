// Model Senso plates as an Applicative Functor

const fl = require('fantasy-land');

function DirectionContainer(center, up, right, down, left) {
    this.center = center;
    this.up = up || center;
    this.right = right || center;
    this.down = down || center;
    this.left = left || center;
    return this;
}

// Functor
DirectionContainer.prototype.map = function(f) {
    return new DirectionContainer(
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
DirectionContainer.prototype[fl.map] = DirectionContainer.prototype.map;

// Apply
DirectionContainer.prototype.ap = function(b) {
    return new DirectionContainer(
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
DirectionContainer.prototype[fl.ap] = DirectionContainer.prototype.ap;

// flipped AP where function is in Apply and value is argument
// flipAp :: Apply f => f (a -> b) -> f a -> f b
DirectionContainer.prototype.flipAp = function(b) {
    return new DirectionContainer(
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
DirectionContainer.prototype.of = function(b) {
    return new DirectionContainer(b);
}
DirectionContainer.prototype[fl.of] = DirectionContainer.prototype.of;

// toArray
DirectionContainer.prototype.toArray = function() {
    return [this.center, this.up, this.right, this.down, this.left];
}

module.exports = DirectionContainer;
