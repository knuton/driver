const electron = require('electron');
const shell = electron.shell;
const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;

const Config = require('electron-config');
const config = new Config();

let appIcon;

app.on('ready', () => {
    // load server
    const server = require('./server')(config);

    // Create tray
    appIcon = new Tray(__dirname + '/images/tray-icon.png');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Play',
            click: () => {
                shell.openExternal('https://play.dividat.com/');
            }
        }, {
            type: 'separator'
        }, {
            label: 'Exit',
            click: () => {
                process.exit(0);
            }
        }
    ]);
    appIcon.setToolTip('Dividat Driver');
    appIcon.setContextMenu(contextMenu);
});

// Handle windows ctrl-c...
if (process.platform === "win32") {

    var rl = require("readline").createInterface({input: process.stdin, output: process.stdout});

    rl.on("SIGINT", function() {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function() {
    //graceful shutdown
    console.log("Caught SIGINT. Closing down.")
    server.close();
    process.exit();
});
