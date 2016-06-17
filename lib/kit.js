const fs = require('fs');
const path = require('path');

var fileExists = function (path) {
    return fs.existsSync(path);
}

var checkDirectory = function (path) {
    console.log('path:', path);
    path = getDirectory(path);
    if(!fileExists(path)) {
        return fs.mkdirSync(path);
    }

    return true;
}