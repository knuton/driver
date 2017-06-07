const execSync = require('child_process').execSync
const fs = require('fs')
const glob = require('glob')

exports.promisify = function promisify (func, ...args) {
  return new Promise((resolve, reject) => {
    func(
            ...args,
            (err, result) => err == null ? resolve(result) : reject(err)
        )
  })
}

exports.findBinaries = function findBinaries (dir) {
    // See https://github.com/Squirrel/Squirrel.Windows/blob/8877944/src/Squirrel/Utility.cs#L501-L506
  return glob.sync(`${dir}/**/*.@(exe|dll|node)`)
}

// Determine the channel to release to
exports.getChannel = function getChannel () {
  // Prefer explicit parameters
  if (process.env.RELEASE_CHANNEL) {
    return process.env.RELEASE_CHANNEL
  }

  // Or infer from current branch
  switch (execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()) {
    case 'master':
      return 'internal'
    case 'develop':
    default:
      return 'dev'
  }
}
