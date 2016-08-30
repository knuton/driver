const BLOCK_TYPE = 0x02;

const mode = {
    off: 0,
    on: 1
}

function block(channel, mode, impulses, impulse_duration) {
    var block = new Buffer(7);

    // size
    block.writeUInt16LE(5, 0);

    // block type
    block.writeUInt8(BLOCK_TYPE, 2);

    // channel
    block.writeUInt8(channel, 3);

    // mode
    block.writeUInt8(mode, 4);

    // impulses
    block.writeUInt8(impulses, 5);

    // duration
    block.writeUInt8(impulse_duration, 6);

    return block;

}

module.exports = {
    mode: mode,
    block: block
}
