# senso

Dividat Senso drivers and testing suite

## Getting started

1. Install dependencies: `npm install`
2. Start the drivers: `npm start`
3. Navigate to <http://dev.dividat.ch/senso/senso.html> for a debug interface.

## Logging data

Data from Senso can be logged. To log data set the variable `LOG` in `src/senso.js` to `true`.

Two log files are created:

- `log_raw.dat`: A base64 encoding of the raw packets received from the hardware.
- `log_decoded.csv`: A comma-seperated-value file of the decoded sensor values.

## Replay logged data

Logged data can be replayed for debugging purposes.

For default settings: `npm run replay`

To replay an other recording: `npm run replay -- logs/bujar.dat`

To slow down the replay: `npm run replay -- -t 100`

## Starting a local DHCP server

- Install `dnsmasq` (on Mac: `brew install dnsmasq`)
- Make sure network is set to Manual configuration and the machine you are running this from has IP 192.168.1.1
- Check `etc/dnsmasq.conf`
- Run `bin/dhcp-server.sh`
