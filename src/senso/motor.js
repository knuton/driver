const BLOCK_TYPE = 0x02;

module.exports = function block(channel, mode, impulses, impulse_duration) {
    var block = new Buffer(8);

    // size
    block.writeUInt16LE(5, 0);

    // block type
    block.writeUInt16LE(BLOCK_TYPE, 2);

    // channel
    block.writeUInt8(channel, 4);

    // mode
    block.writeUInt8(mode, 5);

    // impulses
    block.writeUInt8(impulses, 6);

    // duration
    block.writeUInt8(impulse_duration, 7);

    return block;

}
