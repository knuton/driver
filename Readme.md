# Dividat Driver

Dividat drivers and hardware test suites.

## Download

Latest stable versions of the driver software:

- [Windows 7/8/10](https://dist.dividat.ch/releases/driver/stable/win32/ia32/latest)
- [macOS](https://dist.dividat.ch/releases/driver/stable/darwin/latest)

The Windows application auto-updates to new versions on relaunch when connected to the Internet.

## Directories

- `bin/`: tooling
- `build/`: output dir for packaged Electron Apps
- `etc/`: configurations
- `rec/`: recordings of raw Senso data
- `src/`: Driver application sources
- `src-test/`: Sources for mock Senso Servers (for testing)

## Getting started

1. Install dependencies: `npm install`
2. Start the drivers in development mode: `npm start`. The default Senso address is `169.254.1.10`. The address can be changed via a WebSocket command (via `diviapps` UI) or with command line argument: `npm start -- --address ADDRESS`.
3. Driver can now be reached at <https://localhost.dividat.com:8380>. Use `diviapps` for a nice interface.

## Electron

To start with Electron (as in production) run `npm run electron`.

This will start the driver as an Electron application. Note that no window will be created. The application lives in the menubar.

## Building Releases

To build Electron executables and installers: `npm run build`

Additional dependencies are required for creating the installers. If you use a Unix system, you will need to [install Mono](http://www.mono-project.com/download/) in order to create and sign installers for Windows.

## SSL

The server encrypts traffic using a signed certificate for the host `localhost.dividat.com` (`localhost.dividat.com` resolves to `127.0.0.1`).

The driver needs to be accessed via hostname `localhost.dividat.com`. If not your browser will complain.

For machines not connected to the internet use the following `/etc/hosts` entry:

```
127.0.0.1 localhost.dividat.com
```

## Log files

A log file is written to:

- on Linux: `~/.config/Dividat Driver/log.log`
- on OS X: `~/Library/Logs/Dividat Driver/log.log`
- on Windows: `%USERPROFILE%/AppData/Roaming/Dividat Driver/log.log`

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

The Senso can be directly connected via Ethernet to a computer running the driver software. In this case, in addition to the driver a DHCP server needs to be running on the computer.

### Mac OS X

These instructions are valid for any Mac system, but are relevant especially for the demo Mac Mini (hostname `macademia`).

- Install dnsmasq: `brew install dnsmasq`
- Make sure the Ethernet adapter is set to manual configuration with a static IP. A link-local address is a good choice, `169.254.1.1`.
- Create or update `/usr/local/etc/dnsmasq.conf` to set a static IP for Sensos plugged into the computer:

  ```
  # Enable the DHCP server, setting IP range and lease time.
  dhcp-range=169.254.1.2,169.254.1.100,12h

  ## Static hosts

  # Senso Prototype
  dhcp-host=<MAC-ADDRESS>,169.254.1.10
  ```

  where `<MAC-ADDRESS>` is a MAC address with or without wildcards (`*`). `00:50:c2:3d:*:*` works for all Sensos using BDT's address space.
- Start dnsmasq as a service: `brew services start dnsmasq`
- Now (re-)plug in the Senso

Following these instructions, the Senso should have IP `169.254.1.10`.

## Releasing New Versions

The Windows version of the driver is packaged into an installer using [Squirrel](https://github.com/Squirrel/Squirrel.Windows). Drivers installed in this way will auto-update by checking `dist.dividat.ch` for new versions periodically.

To release an update run `npm run release`. Credentials need to be available for the AWS SDK to pick up.

The command will trigger a fresh build and start a release script. The release script expects to release from a clean working tree. It will ask for a version number to use for the release, cross-check it with that in `package.json` and upload the release assets to S3.

## Contact

Adarsh Amirtham <adarsh@dividat.com>, Dividat GmbH
