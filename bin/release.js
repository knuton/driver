#! /usr/bin/env node

const assert = require('assert')
const prompt = require('prompt')
const semver = require('semver')
const signcode = require('signcode')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const spawnSync = require('child_process').spawnSync
const execSync = require('child_process').execSync
const mime = require('mime-types')
const aws = require('aws-sdk')
const util = require('./util')

// Setup libraries

prompt.colors = false
prompt.message = ''

// Start release

release({
  distDir: 'build/dist'
}).catch((err) => {
  console.error(err)
  process.exit(1)
})

async function release (options) {
  prompt.start()

  assert.equal(
        spawnSync('git', ['diff-files', '--quiet']).status,
        0,
        'There are uncommited changes.'
    )

  try {
    await Promise.all(util.findBinaries(options.distDir).map(binaryPath =>
            util.promisify(signcode.verify, { path: binaryPath })
        ))
  } catch (err) {
    console.error('Refusing to release unsigned binaries:', err.message)
    abort()
  }

  const branch = exec('git rev-parse --abbrev-ref HEAD')
  const channel = util.getChannel()

  const version = (await query('tag', {
    description: 'Please enter semver number for this release',
    conform: semver.valid
  }))
  const tag = 'v' + semver.clean(version)

  assert.equal(
    version,
    require('../package').version,
    'Version must match with package.json.'
  )

  if (channel !== 'dev') {
    assert.equal(
      tag,
      exec('git describe --exact-match HEAD'),
      'Version must match with Git tag of HEAD.'
    )
  }

  const commit = exec('git rev-parse HEAD')
  console.log(`\nThe latest commit on ${branch} is: \n`)
  console.log(indent(exec(`git show --quiet "${commit}"`)) + '\n')

  const assets = glob.sync('**/*', { cwd: options.distDir, nodir: true })
  console.log(`The release assets in ${options.distDir} are: \n`)
  console.log(indent(assets.join('\n')) + '\n')

  if (!await decide(`Release this on ${channel} as ${tag}?`, false)) abort()

  console.log('\nUploading assets ...')

  const s3 = new aws.S3({ region: 'eu-central-1' })
  await Promise.all(
        assets.map((assetPath) => {
          const assetName = path.basename(assetPath)
          const localAssetPath = path.join(options.distDir, assetPath)
          const remoteAssetPath = ['releases', 'driver', channel, assetPath].join('/')
          const remoteLatestPath = ['releases', 'driver', channel, path.dirname(assetPath), 'latest'].join('/')
          const size = fs.statSync(localAssetPath).size
          const mimeType = mime.lookup(assetName) || 'application/octet-stream'
          console.log(indent(assetPath), '\t', size, '\t', mimeType)
          const upload = new Promise((resolve, reject) =>
                s3.putObject(
                  {
                    Bucket: 'dist.dividat.ch',
                    Key: remoteAssetPath,
                    ACL: 'public-read',
                    Body: fs.createReadStream(localAssetPath),
                    ContentLength: size,
                    ContentType: mimeType,
                    CacheControl: cacheControl(remoteAssetPath)
                  },
                    (err, data) => err != null ? reject(err) : resolve(data)
                )
            )

          if (/Install.+\.exe$|.*Mac.*\.zip$/.test(assetPath)) {
                // Create 'latest' redirects for executables/installers
                // In order for redirects to work with CloudFront, the S3 website
                // needs to be configured as an origin, not the S3 bucket hostname
            return upload.then(() =>
                    new Promise((resolve, reject) => {
                      console.log('Creating ' + remoteLatestPath + ' -> ' + remoteAssetPath)
                      s3.putObject(
                        {
                          Bucket: 'dist.dividat.ch',
                          Key: remoteLatestPath,
                          ACL: 'public-read',
                          WebsiteRedirectLocation: '/' + remoteAssetPath,
                          CacheControl: cacheControl(remoteLatestPath)
                        },
                            (err, data) => err != null ? reject(err) : resolve(data)
                        )
                    })
                )
          } else {
            return upload
          }
        })
    )

  console.log('\nFinished.')
}

// Helpers

function abort (message) {
  console.log(message || 'Aborting.')
  process.exit(1)
}

function exec (cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function indent (block) {
  return block.replace(/^(?!\s*$)/mg, '    ')
}

function cacheControl (path) {
  return /latest$|RELEASES$/.test(path) ? 'max-age=0' : 'max-age=3600'
}

// A slim promisifying wrapper around prompt
async function query (name, properties) {
  return new Promise((resolve, reject) => {
    prompt.get({ properties: { [name]: properties } }, (err, res) => {
      if (err != null) reject(err)
      else resolve(res)
    })
  }).then((res) => res[name])
}

async function decide (question, defaultDecision) {
  question += defaultDecision === true ? ' [Y/n]' : ' [y/N]'
  return query('q', {
    description: question
  }).then((input) =>
        input === '' ? Boolean(defaultDecision) : /y/i.test(input)
    )
}
