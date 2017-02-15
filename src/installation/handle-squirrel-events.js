const path = require('path');
const spawn = require('child_process').spawn;
const debug = require('debug')('handle-squirrel-events');
const electron = require('electron');
const got = require('got');
const log = require('electron-log');

const Config = require('electron-config');
const config = new Config();
const configKeys = require('../configKeys');

const shortcutLocations = ['StartMenu', 'Startup'];

function run(args, done) {
    const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
    debug('Spawning `%s` with args `%s`', updateExe, args);
    spawn(updateExe, args, { detached: true }).on('close', done);
}

function handler() {
    if (process.platform === 'win32') {
        const cmd = process.argv[1];
        debug('processing squirrel command `%s`', cmd);
        const target = path.basename(process.execPath);

        if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
            run(
                ['--createShortcut=' + target + '', '--shortcut-locations=' + shortcutLocations.join(',')],
                electron.app.quit
            );

            if (cmd === '--squirrel-install') {
                config.set(configKeys.AUTOSTART_PLAY, true);
            }

            return true;
        }
        if (cmd === '--squirrel-uninstall') {
            config.clear();
            run(
                ['--removeShortcut=' + target + '', '--shortcut-locations=' + shortcutLocations.join(',')],
                electron.app.quit
            );
            return true;
        }
        if (cmd === '--squirrel-obsolete') {
            electron.app.quit();
            return true;
        }

        scheduleUpdateCheck();
    }

    return false;
}

function scheduleUpdateCheck() {
    // Silently log failing update checks
    electron.autoUpdater.on(
        'error',
        (err) => log.error("Update check failed: " + err)
    );
    // Check for update immediately unless this is the first run
    if (process.argv[1] !== '--squirrel-firstrun') {
        checkForUpdates();
    }
    // Check for updates twice a day
    setInterval(checkForUpdates, 1000 * 60 * 60 * 12);
}

function checkForUpdates() {
    const repo = configKeys.GH_UPDATE_REPO;
    got.get(
        `https://api.github.com/repos/${repo}/releases/latest`,
        { json: true }
    ).then((response) => {
        electron.autoUpdater.setFeedURL(
            `https://github.com/${repo}/releases/download/${response.body.tag_name}`
        );
        // If an update is available, it will be downloaded, but not installed until
        // the application is quit and restarted. We don't bother the user with an
        // "update available" message but trust that the application will be restarted,
        // at the latest when issues with the product are encountered.
        electron.autoUpdater.checkForUpdates();
    });
}

module.exports = handler;
