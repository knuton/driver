const BLOCK_TYPE = 0x01;

const symbol = {
    arrow: 1,
    plus: 2,
    circle: 4
}

const mode = {
    off: 0,
    on: 1,
    blink: 2,
    pulse: 3
}

function color(red, green, blue) {
    return (red << 16) + (green << 8) + blue;
}

function block(channel, symbol, mode, color, brightness, power) {
    var block = new Buffer(12);

    // size
    block.writeUInt16LE(10, 0);

    // block type
    block.writeUInt8(BLOCK_TYPE, 2);

    // channel
    block.writeUInt8(channel, 3);

    // symbol
    block.writeUInt8(symbol, 4);

    // mode
    block.writeUInt8(mode, 5);

    // color
    block.writeUInt32LE(color, 6);

    // brightness
    block.writeUInt8(brightness, 10);

    // power
    block.writeUInt8(power, 11);

    return block;

}

module.exports = {
    symbol: symbol,
    mode: mode,
    color: color,
    block: block
}
