// Model plates as Applicative Functor

function Plates(center, up, right, down, left) {
    this.center = center;
    this.up = up || center;
    this.right = right || center;
    this.down = down || center;
    this.left = left || center;
    return this;
}

Plates.prototype.fmap = function(f) {
    return new Plates(f(this.center), f(this.up), f(this.right), f(this.down), f(this.left))
}

Plates.prototype.bind = function(a) {
    return new Plates(this.center.bind(null, a.center), this.up.bind(null, a.up), this.right.bind(null, a.right), this.down.bind(null, a.down), this.left.bind(null, a.left));
}

Plates.prototype.call = function() {
    return new Plates(this.center.call(), this.up.call(), this.right.call(), this.down.call(), this.left.call());
}

module.exports = Plates;
