# Dividat Driver

Drivers and testing suite for Senso Hardware.

## Directories

- `bin/`: tooling
- `build/`: output dir for packaged Electron Apps
- `etc/`: configurations
- `rec/`: recordings of raw Senso data
- `src/`: Driver application sources
- `src-test/`: Sources for mock Senso Servers (for testing)

## Getting started

1. Install dependencies: `npm install`
2. Start the drivers in development mode: `npm start`. The default Senso address is `192.168.1.10`. The address can be changed via a WebSocket command (via `diviapps` UI) or with command line argument: `npm start -- --address ADDRESS`.
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

## Data recording and replaying

Raw data from Senso can be logged and replayed.

### Record

To record data use the `rec` commandline argument:

```
npm start -- --rec recording.dat
```

Every incoming raw data packet will be stored as a base64 encoded line to the file.

### Replay recorded data

Logged data can be replayed for debugging purposes.

For default settings: `npm run replay`

To replay an other recording: `npm run replay -- rec/simple.dat`

To slow down the replay: `npm run replay -- -t 100`

## Starting a local DHCP server

For demonstrations the Senso is directly connected to the computer running the driver software (The Mac Mini with hostname `macademia`). A small dhcp server needs to be running.

- Install `dnsmasq` (on Mac: `brew install dnsmasq`)
- Make sure network is set to Manual configuration and the machine you are running this from has IP 192.168.1.1
- Check `etc/dnsmasq.conf`
- Run `bin/dhcp-server.sh`

## Contact

Adarsh Amirtham <adarsh@dividat.ch>, Dividat GmbH
