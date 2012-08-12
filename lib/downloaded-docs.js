var fs = require('fs');
var path = require('path');
var semver = require('semver');

var dataDir = require('./data-dir');
var status = require('./status');
var uploadedDocs = require('./github/uploaded-docs');

var docsDir = path.join(dataDir, 'api-docs');
var tmpDir = path.join(docsDir, 'tmp');
var availableVersionsFile = path.join(docsDir, 'available-versions');

var UPDATE_AVAILABLE_VERSIONS_PERIOD = 2 * 60 * 60 * 1000;

var availableVersions = [];

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

if (fs.existsSync(availableVersionsFile)) {
  availableVersions = JSON.parse(fs.readFileSync(availableVersionsFile));
}

function updateAvailableVersions(callback) {
  if (status.availableDownloadsUpdatedRecently(UPDATE_AVAILABLE_VERSIONS_PERIOD) && availableVersions.length !== 0) {
    callback(null, availableVersions);
  } else {
    uploadedDocs.getFiles(function uploadedDocsFiles(err, files) {
      if (err) {
        callback(err);
      } else {
        files = files.sort(function compareAvailableVersions(file1, file2) {
          return semver.compare(file1.name, file2.name);
        });

        availableVersions = files;
        fs.writeFileSync(availableVersionsFile, JSON.stringify(files));
        status.availableDownloadsUpdated();

        callback(null, availableVersions);
      }
    });
  }
}

function getAvailableVersions(callback) {
  updateAvailableVersions(callback);
}

function getLatestStableVersion(callback) {
  getAvailableVersions(callback);
}

exports.availableVersions = getAvailableVersions;
exports.latestStableVersion = getLatestStableVersion;
