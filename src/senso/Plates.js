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
    this.center = this.center.bind(null, a.center);
    this.up = this.up.bind(null, a.up);
    this.right = this.right.bind(null, a.right);
    this.down = this.down.bind(null, a.down);
    this.left = this.left.bind(null, a.left);
    return this;
}

Plates.prototype.call = function() {
    this.center = this.center.call(null);
    this.up = this.up.call(null);
    this.right = this.right.call(null)
    this.down = this.down.call(null)
    this.left = this.left.call(null)
    return this;
}

module.exports = Plates;
