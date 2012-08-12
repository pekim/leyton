var format = require('util').format;
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var temp = require('temp');
var semver = require('semver');
var util = require('util');

var dataDir = require('../data-dir');
var GithubDownloads = require('./github-downloads');

var remoteRepo = 'https://github.com/joyent/node.git';
var repoDir = dataDir + '/git-repo';
var apiDocsDir = repoDir + '/doc/api';

var async = require('async');

function getVersionTags(callback) {
  async.waterfall(
    [
      getPreviouslyUploadedFiles,
      getPreviouslyUploadedTags,
      getTags,
      filterVersionTags,
      processTags
    ],
    callback
  );
}

function getPreviouslyUploadedFiles(callback) {
  var downloads = new GithubDownloads({
    user: 'pekim',
    repo: 'leyton'
  });

  downloads.files(callback);
}

function getPreviouslyUploadedTags(previouslyUploadedFiles, callback) {
  var versionPattern = /^v\d+\.\d+\.\d+$/;

  var filteredFiles = previouslyUploadedFiles.filter(function(file) {
    return versionPattern.test(file.name);
  });

  var tags = filteredFiles.map(function(file) {
    return file.name;
  });

  callback(null, tags);
}

function getTags(previouslyUploadedTags, callback) {
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
      callback(null, previouslyUploadedTags, tags.split('\n'));
    }
  });
}

function filterVersionTags(previouslyUploadedTags, tags, callback) {
  var versionPattern = /^v\d+\.\d+\.\d+$/;

  var tags = tags.filter(function(tag) {
    return versionPattern.test(tag) &&
      semver.gte(tag, 'v0.3.1') &&
      !isPreviouslyUploaded(tag);
  });

  if (tags.length > 0) {
    console.log(format('Upload files for %s'), tags);
  } else {
    console.log('No new versions to upload');
  }

  callback(null, tags);

  function isPreviouslyUploaded(tag) {
    return previouslyUploadedTags.indexOf(tag) != -1;
  }
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
        getGithubCredentials,
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

  tagInfo.zipFileName = zipFileName;

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

function getGithubCredentials(tagInfo, callback) {
  var credentialsFile = path.join(process.env.HOME, '/.leyton/github-credentials');

  fs.readFile(credentialsFile, function(err, credentialsJson) {
    callback(null, tagInfo, JSON.parse(credentialsJson));
  });
}

function uploadZip(tagInfo, credentials, callback) {
  var downloads = new GithubDownloads({
    authenticate: credentials,
    user: 'pekim',
    repo: 'leyton'
  });

  console.log(format('Uploading %s for %s', tagInfo.zipFileName, tagInfo.tag));
  downloads.upload(tagInfo.zipFileName, tagInfo.tag, callback);
}

getVersionTags(function(err, versionTags){
  if (err) {
    console.log('Oops!', err);
  }
});
