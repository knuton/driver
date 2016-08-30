function driver() {
    // This is what the driver does.

    var senso = require('./devices/senso');

    senso.on('data', function(data) {
        console.log(data);
    })

    var channel = require('./devices/senso/channel');

    // send some blocks
    setTimeout(function() {

        // create a LED Block
        var led = require('./devices/senso/led');
        var ledBlock = led.block(channel.broadcast, (led.symbol.arrow + led.symbol.circle), led.mode.on, led.color(255, 255, 255), 0xFF, 0x3F);

        // send LED block
        senso.control(ledBlock);

        setTimeout(function() {

            // create a motor block
            var motor = require('./devices/senso/motor');
            var motorBlock = motor.block(channel.broadcast, motor.mode.on, 3, 10);

            // send Motor block
            senso.control(motorBlock);
        }, 100);

    }, 2000);
}

// Create some data that is sent to the data server on the driver
var counter = 0;
function spoofData() {
    var net = require('net');
    var connection = new net.Socket();
    connection.connect(55568, "127.0.0.1", function() {
        console.log("Spoofer connected to driver data server.");
    })

    function pack(sensor) {
        var header = new Buffer(16);
        header.fill(0);
        // Block Type
        header.writeUInt8(0x80, 0);

        return Buffer.concat([
            header, sensor
        ], 16 + sensor.length);
    }

    var block = new Buffer(44);
    block.fill(0);

    // time
    block.writeUInt32LE(counter, 0);
    counter = counter + 1;

    // Sensor 1A
    block.writeUInt16LE(20000, 4);
    // Sensor 1B
    block.writeUInt16LE(20000, 6);
    // Sensor 1C
    block.writeUInt16LE(20100, 8);
    // Sensor 1D
    block.writeUInt16LE(20000, 10);
    // Sensor 2A
    block.writeUInt16LE(20000, 12);
    // Sensor 2B
    block.writeUInt16LE(20000, 14);
    // Sensor 2C
    block.writeUInt16LE(20100, 16);
    // Sensor 2D
    block.writeUInt16LE(20000, 18);
    // Sensor 3A
    block.writeUInt16LE(20000, 20);
    // Sensor 3B
    block.writeUInt16LE(20300, 22);
    // Sensor 3C
    block.writeUInt16LE(20000, 24);
    // Sensor 3D
    block.writeUInt16LE(20000, 26);
    // Sensor 4A
    block.writeUInt16LE(20100, 28);
    // Sensor 4B
    block.writeUInt16LE(20000, 30);
    // Sensor 4C
    block.writeUInt16LE(20000, 32);
    // Sensor 4D
    block.writeUInt16LE(20000, 34);
    // Sensor 5A
    block.writeUInt16LE(20000, 36);
    // Sensor 5B
    block.writeUInt16LE(20040, 38);
    // Sensor 5C
    block.writeUInt16LE(20200, 40);
    // Sensor 5D
    block.writeUInt16LE(20100, 42);

    var package = pack(block);

    setInterval(function() {
        connection.write(package);
    }, 500);

}

// Emulate the control server with a echo server.
var echo = require('./echo');

// Start the driver with delay of 500ms
// setTimeout(function() {
// driver();
// }, 200);

// start spoofing data
setTimeout(spoofData, 1000);
