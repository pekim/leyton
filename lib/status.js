var dataDir = require('./data-dir');
var fs = require('fs');

var statusFile = dataDir + '/status';
var status = {};

if (fs.existsSync(statusFile)) {
  status = JSON.parse(fs.readFileSync(statusFile));
}

function writeFile() {
  fs.writeFileSync(statusFile, JSON.stringify(status));
}

function availableDownloadsUpdated() {
  status.availableDownloadsUpdated = new Date().getTime();
  writeFile();
}

function availableDownloadsUpdatedRecently(milliSeconds) {
  if (status.availableDownloadsUpdated) {
    return new Date().getTime() < status.availableDownloadsUpdated + milliSeconds;
  } else {
    return false;
  }
}

exports.availableDownloadsUpdated= availableDownloadsUpdated;
exports.availableDownloadsUpdatedRecently = availableDownloadsUpdatedRecently;
