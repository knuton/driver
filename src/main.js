const electron = require('electron')
const shell = electron.shell
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray

const path = require('path')

// Run handler for Windows installer options
if (require('./installation/handle-squirrel-events')()) {
  // TODO: check if it makes sense to use process.exit() here. `return` causes a standardjs syntax error, as it can only be used in a function
  process.exit()
  // return
}

// const Config = require('electron-config')
// const config = new Config()
const constants = require('./constants')

const log = require('electron-log')
log.transports.file.level = 'info'

const pjson = require('../package.json')

let appIcon
let server

app.on('ready', () => {
  log.info('Dividat Driver starting.')
  log.info('Version: ' + pjson.version)

    // load server
  server = require('./server')()

  const logPath = log.findLogPath('Dividat Driver')

    // Create tray
  appIcon = new Tray(path.join(__dirname, '/icons/16x16.png'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Play',
      click: () => shell.openExternal(constants.PLAY_URL)
    }, {
      type: 'separator'
    }, {
      label: 'Version: ' + pjson.version,
      enabled: false
    }, {
      label: 'Log',
      click: () => {
        shell.openItem(logPath)
      }
    }, {
      type: 'separator'
    }, {
      label: 'Exit',
      role: 'quit'
    }
  ])
  appIcon.setToolTip('Dividat Driver')
  appIcon.setContextMenu(contextMenu)
})

// Handle windows ctrl-c...
if (process.platform === 'win32') {
  var rl = require('readline').createInterface({input: process.stdin, output: process.stdout})

  rl.on('SIGINT', function () {
    process.emit('SIGINT')
  })
}

process.on('SIGINT', function () {
    // graceful shutdown
  log.info('Caught SIGINT. Closing down.')
  server.close()
  process.exit()
})
