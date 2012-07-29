var dataDir = require('./data-dir');
var fs = require('fs');
var spawn = require('child_process').spawn;
var status = require('./status');

var remoteRepo = 'https://github.com/joyent/node.git';
var repoDir = dataDir + '/git-repo';
var apiDir = repoDir + '/doc/api';

var REPO_UPDATE_PERIOD = 60 * 60 * 1000;

function update(callback) {
  fs.exists(repoDir, function repoDirExists(exists) {
    if (exists) {
      if (!status.isGitRepoUpdatedRecently(REPO_UPDATE_PERIOD)) {
        pull();
      } else {
        callback();
      }
    } else {
      clone();
    }
  });

  function pull() {
    var git = spawn('git', ['pull'], {cwd: repoDir});

    git.stdout.on('data', function (data) {
      //console.log('stdout: ' + data);
    });

    git.stderr.on('data', function (data) {
      //console.log('stderr: ' + data);
    });

    git.on('exit', function gitExit(code) {
      if (code !== 0) {
        callback('git pull failed: exit code ' + code);
      } else {
        status.gitRepoUpdated();
        callback();
      }
    });
  }

  function clone() {
    var git = spawn('git', ['clone', remoteRepo, repoDir]);

    git.stdout.on('data', function (data) {
      //console.log('stdout: ' + data);
    });

    git.stderr.on('data', function (data) {
      //console.log('stderr: ' + data);
    });

    git.on('exit', function gitExit(code) {
      if (code !== 0) {
        callback('git clone failed: exit code ' + code);
      } else {
        callback();
      }
    });
  }
}

exports.update = update;
exports.apiDir = apiDir;
