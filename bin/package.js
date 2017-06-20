#! /usr/bin/env node

const electronInstaller = require('electron-winstaller')
const rcedit = require('rcedit')
const signcode = require('signcode')
const fs = require('fs')
const glob = require('glob')
const mkdirp = require('mkdirp')
const path = require('path')
const JSZip = require('jszip')
const pkg = require('../package.json')
const util = require('./util')

const distDir = 'build/dist'

async function createWindowsInstaller (arch) {
  const outputPath = `${distDir}/win32/${arch}`
  const appPath = `build/${pkg.productName}-win32-${arch}`
  const channel = util.getChannel()
  const setupExeName = `Install ${pkg.productName} v${pkg.version} (${channel}).exe`

  await signBinaries(appPath)

  console.log('Building installer for ' + platformName(arch))
  return electronInstaller.createWindowsInstaller({
    appDirectory: appPath,
    outputDirectory: outputPath,
    name: 'dividat_driver',
    copyright: `(C) ${new Date().getFullYear()} ${pkg.author}`,
    exe: `${pkg.productName}.exe`,
    iconUrl: `https://dist.dividat.ch/win32/dividat-icon.ico`,
    setupExe: setupExeName,
    noMsi: true,
    remoteReleases: `https://dist.dividat.ch/releases/driver/${channel}/win32/${arch}`
  }).then(() => {
        // Set icon on installer
        // Workaround for issue with electron-winstaller
        // https://github.com/electron/windows-installer/issues/119#issuecomment-279945093
    return util.promisify(
            rcedit,
            `${outputPath}/${setupExeName}`,
            { icon: 'src/icons/dividat-installer-icon.ico' }
        )
  }).then(
        () => signBinaries(outputPath)
    ).catch((e) => {
      console.error(`Error building ${platformName(arch)} installer: ${e.message}`)
      process.exit(1)
    })
}

async function signBinaries (dir) {
  return Promise.all(
        util.findBinaries(dir).map(binaryPath => {
          if (process.env.CODE_SIGNING_CERT == null) {
            console.warn(`No certificate given, not signing ${binaryPath}`)
            return Promise.resolve()
          }

          console.log(`Signing ${binaryPath}`)
          return util.promisify(
                signcode.sign, {
                  cert: process.env.CODE_SIGNING_CERT,
                  password: process.env.CODE_SIGNING_PW,
                  path: binaryPath,
                  hash: ['sha1', 'sha256'],
                  name: pkg.productName,
                  site: 'https://www.dividat.com/',
                  overwrite: true
                }
            )
        })
    )
}

function createMacArchive () {
  const archiveName = `${distDir}/darwin/${pkg.productName} v${pkg.version} (Mac).zip`
  const appName = `${pkg.productName}.app`
  const appFolder = `build/${pkg.productName}-darwin-x64`

  console.log('Creating archive for darwin')

  mkdirp.sync(path.dirname(archiveName))

    // Create the ZIP archive with Node for portability
  const archive = new JSZip().folder(appName)
  const contents = glob.sync(`${appName}/**/*`, { cwd: appFolder, nodir: true })
  for (let file of contents) {
    archive.file(
            file,
            fs.createReadStream(path.join(appFolder, file)),
            { type: 'nodebuffer', createFolders: true, compression: 'DEFLATE' }
        )
  }

  archive.generateNodeStream(
        { streamFiles: true }
    ).pipe(
        fs.createWriteStream(archiveName)
    )
}

function platformName (arch) {
  return 'win32 ' + arch
}

// We only maintain the installer and update channel for 32 architecture,
// having no substantial gains from using 64 bit.
createWindowsInstaller('ia32').then(createMacArchive)
