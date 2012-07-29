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

function gitRepoUpdated() {
  status.gitRepoUpdated = new Date().getTime();
  writeFile();
}

function isGitRepoUpdatedRecently(milliSeconds) {
  return new Date().getTime() < status.gitRepoUpdated + milliSeconds;
}

exports.gitRepoUpdated = gitRepoUpdated;
exports.isGitRepoUpdatedRecently = isGitRepoUpdatedRecently;
