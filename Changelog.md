# Change Log

## [0.3.1] - 2017-06-20

### Added

- Release channels for auto-update functionality (Windows)

## [0.3.0] - 2017-06-16

### Added

- Support for zeroconf detection of Sensos on local network

### Changed

- Rotate logs to reduce disk use
- Check for updates hourly instead of half-daily (Windows)
- Remove filtering logic and reduce driver to a TCP <-> WebSocket bridge
- Simplify persistentConnection module by making returned connection an EventEmitter

### Removed

- TCP heartbeat in persistentConnection

## [0.2.2] - 2017-03-04

### Added

- Add installer and auto-update functionality for Windows

## [0.2.1] - 2017-02-02

### Changed

- Change default address for Senso to a link-local address
- Use new Dividat icons

## [0.2.0] - 2016-12.23

### Added

- SSL encryption from driver to clients

## [v0.1.0] - 2016-12-22
