const WebSocket = require('ws');

const sensoHost = 'localhost.dividat.com:8380';

const ws = new WebSocket(
    `wss://${sensoHost}/senso`,
    { origin: 'https://play.dividat.ch/' }
);

ws.on('open', () => {
    console.log(`Established connection to driver on ${sensoHost}.`);
    process.exit(0);
});

ws.on('error', (err) => {
    console.error(err);
    process.exit(1);
});

setTimeout(() => {
    console.error(`Timed out trying to connect to driver on ${sensoHost}.`); process.exit(1);
}, 2000);
