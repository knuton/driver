const path = require('path');
const spawn = require('child_process').spawn;
const debug = require('debug')('handle-squirrel-events');
const electron = require('electron');
const got = require('got');
const log = require('electron-log');

const Config = require('electron-config');
const config = new Config();
const constants = require('../constants');
const env = process.env;

/** Handle installation and update lifecycle events.

Windows only.

*/

// Installation Events


function run(args, done) {
    const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
    debug('Spawning `%s` with args `%s`', updateExe, args);
    spawn(updateExe, args, { detached: true }).on('close', done);
}

const shortcutLocations = ['StartMenu', 'Startup'];

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
            createPlayShortcuts(cmd === '--squirrel-install' ? 'create' : 'replace');

            return true;
        }
        if (cmd === '--squirrel-uninstall') {
            config.clear();
            run(
                ['--removeShortcut=' + target + '', '--shortcut-locations=' + shortcutLocations.join(',')],
                electron.app.quit
            );
            removePlayShortcuts();
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

const playShortcutLocations = [
    `${env.USERPROFILE}\\Desktop\\Dividat Play.lnk`,
    `${env.USERPROFILE}\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Dividat Play.lnk`
];

// Create shortcuts to launch Play in Chrome's kiosk mode
function createPlayShortcuts(operation) {
    // Locate path to chrome.exe starting from newest to oldest Windows versions
    const chromePath = [
        `${env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`,
        `${env.ProgramW6432}\\Google\\Chrome\\Application\\chrome.exe`,
        `${env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
        `${env.LOCALAPPDATA}\\Google\\Chrome\\chrome.exe`,
        `${env.USERPROFILE}\\Local Settings\\Application Data\\Google\\Chrome\\chrome.exe`
    ].find(require('fs').existsSync);
    if (chromePath != null) {
        const options = {
            target: chromePath,
            args: `--kiosk ${constants.PLAY_URL}`,
            description: 'Dividat Play',
            icon: process.execPath,
            iconIndex: 0
        };
        playShortcutLocations.forEach(path => electron.shell.writeShortcutLink(path, operation, options));
    }
}

function removePlayShortcuts() {
    playShortcutLocations.forEach(electron.shell.moveItemToTrash);
}


// Update Checking


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
    electron.autoUpdater.setFeedURL(`https://dist.dividat.ch/releases/driver/stable/win32/ia32`);
    // If an update is available, it will be downloaded, but not installed until
    // the application is quit and restarted. We don't bother the user with an
    // "update available" message but trust that the application will be restarted,
    // at the latest when issues with the product are encountered.
    electron.autoUpdater.checkForUpdates();
}

module.exports = handler;
