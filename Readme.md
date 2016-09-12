# senso

Dividat Senso drivers and testing suite

## Getting started

1. Install dependencies: `npm install`
2. Start the drivers: `npm start`
3. Navigate to <http://dev.dividat.ch/senso.html> for a debug interface.

## Replay logged data

Example:

`npm run replay -- logs/bujar.dat`

## Starting a local DHCP server

- Install `dnsmasq` (on Mac: `brew install dnsmasq`)
- Make sure network is set to Manual configuration and the machine you are running this from has IP 192.168.1.1
- Check `etc/dnsmasq.conf`
- Run `bin/dhcp-server.sh`
