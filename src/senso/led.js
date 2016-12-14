const BLOCK_TYPE = 0x01;

module.exports = function block(channel, symbol, mode, color, brightness, power) {
    var block = new Buffer(13);

    // size
    block.writeUInt16LE(10, 0);

    // block type
    block.writeUInt16LE(BLOCK_TYPE, 2);

    // channel
    block.writeUInt8(channel, 4);

    // symbol
    block.writeUInt8(symbol, 5);

    // mode
    block.writeUInt8(mode, 6);

    // color
    block.writeUInt32LE(color, 7);

    // brightness
    block.writeUInt8(brightness, 11);

    // power
    block.writeUInt8(power, 12);

    return block;

}
