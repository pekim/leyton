var async = require('async');
var format = require('util').format;
var fs = require('fs');
var path = require('path');
var request = require('request');
var semver = require('semver');
var tar = require('tar');
var zlib = require('zlib');

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

/*
  Provides the available versions as an array of objects,
  as provided from github api.

  The array is sorted by semantic version.
 */
function getAvailableVersions(callback) {
  updateAvailableVersions(callback);
}

/*
  The latest stable version is the one with the greatest semantic version
  that has an even numbered minor part.
 */
function getLatestStableVersion(callback) {
  var versionPattern = /^v\d+\.(\d+)\.\d+$/;


  async.waterfall([
    function(callback) {
      getAvailableVersions(callback);
    },
    function(files, callback) {
      var latestStableVersion = files.reduce(function determineLatestStableVersion(previous, current) {
        var minor = parseInt(versionPattern.exec(current.name)[1], 10);

        if (minor % 2 === 0) {
          return current;
        } else {
          return previous;
        }
      }, null);

      callback(null, latestStableVersion);
    }
  ], callback);
}

function downloadVersion(version, targetDir, callback) {
  var get = request.get(version.html_url);

  get.on('response', function(response) {
    if (Math.floor(response.statusCode / 100) === 2) {
      var tarExtract = tar.Extract({path: targetDir});

      tarExtract.on('end', function(err) {
        callback(err);
      });

      tarExtract.on('error', function(err) {
        callback(err);
      });

      get.
        pipe(zlib.createGunzip()).
        pipe(tarExtract);
    } else {
      callback(format("Failed to get %s : %s", version.html_url, response.statusCode));
    }
  });
}

function getVersion(version, callback) {
  var versionDir = path.join(docsDir, version.name);

  async.waterfall([
    downloadIfRequired,
    readFiles
  ], callback);

  function downloadIfRequired(callback) {
    fs.exists(versionDir, function exists(exists) {
      if (exists) {
        callback();
      } else {
        fs.mkdir(versionDir, function(err) {
          if (err) {
            callback(err);
          } else {
            downloadVersion(version, versionDir, callback);
          }
        });
      }
    });
  }

  function readFiles(callback) {
    console.log('readfiles');
    callback(null);
  }
}

exports.availableVersions = getAvailableVersions;
exports.latestStableVersion = getLatestStableVersion;
exports.version = getVersion;
