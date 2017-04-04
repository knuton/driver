const fs = require('fs');
const glob = require('glob');

exports.promisify = function promisify(func, ...args) {
    return new Promise((resolve, reject) => {
        func(
            ...args,
            (err, result) => err == null ? resolve(result) : reject(err)
        );
    });
};

exports.findBinaries = function findBinaries(dir) {
    // See https://github.com/Squirrel/Squirrel.Windows/blob/8877944/src/Squirrel/Utility.cs#L501-L506
    return glob.sync(`${dir}/**/*.@(exe|dll|node)`);
};
