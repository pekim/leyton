var dataDir = require('../data-dir');
var fs = require('fs');
var spawn = require('child_process').spawn;
var temp = require('temp');
var semver = require('semver');
var util = require('util');

var remoteRepo = 'https://github.com/joyent/node.git';
var repoDir = dataDir + '/git-repo';
var apiDocsDir = repoDir + '/doc/api';

var async = require('async');

function getVersionTags(callback) {
  async.waterfall(
    [
      getTags,
      filterVersionTags,
      processTags
    ],
    callback
  );
}

function getTags(callback) {
  var git = spawn('git', ['tag'], {cwd: repoDir});
  var tags = '';
  var errors = '';

  git.stdout.on('data', function (data) {
    tags += data;
  });

  git.stderr.on('data', function (data) {
    errors += data;
  });

  git.on('exit', function gitExit(code) {
    if (code !== 0) {
      util.error(errors);
      callback('git tag failed: exit code ' + code);
    } else {
      callback(null, tags.split('\n'));
    }
  });
}

function filterVersionTags(tags, callback) {
  var versionPattern = /^v\d+\.\d+\.\d+$/;

  var tags = tags.filter(function(tag) {
    return versionPattern.test(tag) && semver.gte(tag, 'v0.3.1');
  });

  callback(null, tags);
}

function processTags(tags, callback) {
  async.forEachSeries(tags, function(tag, callback) {
    var tagInfo = {
      tag: tag
    };

    async.waterfall(
      [
        function(callback) {
          checkoutTag(tagInfo, callback);
        },
        getApiDocsFilenames,
        zipApiDocs,
        uploadZip
      ],
      callback
    );
  }, callback);
}

function checkoutTag(tagInfo, callback) {
  var tag = tagInfo.tag;
  var git = spawn('git', ['checkout', tag], {cwd: repoDir});
  var errors = '';

  git.stdout.on('data', function (data) {
    //console.log(data);
  });

  git.stderr.on('data', function (data) {
    errors += data;
  });

  git.on('exit', function gitExit(code) {
    if (code !== 0) {
      util.error(errors);
      callback('git checkout ' + tag + ' failed: exit code ' + code);
    } else {
      console.log('checked out ', tag);
      callback(null, tagInfo);
    }
  });
}

function getApiDocsFilenames(tagInfo, callback) {
  var tag = tagInfo.tag;

  fs.exists(apiDocsDir, function(exists) {
    if (exists) {
      fs.readdir(apiDocsDir, function(err, filenames) {
        tagInfo.filenames = filenames;
        callback(err, tagInfo);
      });
    } else {
      callback(null, tagInfo);
    }
  })
}

function zipApiDocs(tagInfo, callback) {
  var tag = tagInfo.tag;

  if (!tagInfo.filenames) {
    console.log('Skipping (no api docs) for ' + tag);
    callback(null, tagInfo);
  }

  var zipFileName = temp.path({
    prefix: 'node-api-docs-' + tag + '-',
    suffix: '.tar.gz'
  });
  var tarArgs = ['czf', zipFileName].concat(tagInfo.filenames);
  var tar = spawn('tar', tarArgs, {cwd: apiDocsDir});
  var errors = '';

  tar.stdout.on('data', function (data) {
    //console.log(data);
  });

  tar.stderr.on('data', function (data) {
    errors += data;
  });

  tar.on('exit', function tarExit(code) {
    if (code !== 0) {
      util.error(errors);
      callback('tar creating ' + zipFileName + ' failed: exit code ' + code);
    } else {
      console.log('created ', zipFileName);
      callback(null, tagInfo);
    }
  });
}

function uploadZip(tagInfo, callback) {
  callback(null);
}

getVersionTags(function(err, versionTags){
  if (err) {
    console.log('Oops!: ' + err);
  }
});
