#! /usr/bin/env node
const pkg = require('../package.json')
const packager = require('electron-packager')

packager(
  {
    platform: 'darwin,win32',
    arch: 'x64,ia32',
    icon: 'src/icons/dividat-icon',
    dir: '.',
    out: 'build',
    appCopyright: `(C) ${new Date().getFullYear()} ${pkg.author}`,
    win32metadata: {
      CompanyName: pkg.author,
      ProductName: pkg.productName,
      InternalName: pkg.productName,
      FileDescription: pkg.productName,
      OriginalFilename: `${pkg.productName}.exe`
    }
  },
    (err, appPaths) => {
      if (err) {
        console.error(`Error building Electron app: ${err.message}`)
        process.exit(1)
      }
    }
)
