# Dividat Driver

Drivers and testing suite for Senso Hardware.

## Getting started

1. Install dependencies: `npm install`
2. Start the drivers in development mode: `npm start`
3. Driver can now be reached at <https://localhost:8380>. Use `diviapps` for a nice interface.

## Electron

To start with Electron (as in production) run `npm run electron`.

This will start the driver as an Electron application. Note that no window will be created. The application lives in the menubar.

To build Electron releases: `npm run build`

## Log files

A log file is written to:

- on Linux: `~/.config/<app name>/log.log`
- on OS X: `~/Library/Logs/<app name>/log.log`
- on Windows: `%USERPROFILE%/AppData/Roaming/<app name>/log.log`

  See <https://www.npmjs.com/package/electron-log>.

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
