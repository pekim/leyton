var async = require('async');
var format = require('util').format;
var fs = require('fs');
var path = require('path');
var request = require('request');
var spawn = require('child_process').spawn;

var domain = 'api.github.com';

module.exports = function newGithubDownloads(options) {
  var baseUrl;

  if (options.authenticate) {
    baseUrl = format('https://%s:%s@%s', options.authenticate.username, options.authenticate.password, domain);
  } else {
    baseUrl = format('https://%s', domain);
  }

  return {
    files: function(callback) {
      var url = format('%s/repos/%s/%s/downloads', baseUrl, options.user, options.repo)
      request.get(url, function (error, response, body) {
        if (!error && Math.floor(response.statusCode / 100) === 2) {
          callback(null, JSON.parse(body));
        } else {
          callback(format("Failed to get downloads : %s, %d, %s", url, response.statusCode, body));
        }
      });
    },

    download: function(file, destinationDirectory, callback) {
      var download = request.get(file.html_url, function (error, response) {
        if (!error && Math.floor(response.statusCode / 100) === 2) {
          callback();
        } else {
          callback(format("Failed to get file : %s, %d", files.html_url, response.statusCode));
        }
      });

      var destinationFile = path.join(destinationDirectory, file.name);
      download.pipe(fs.createWriteStream(destinationFile));
    },

    upload: function(file, name, callback) {
      async.waterfall(
        [
          stat,
          part1,
          part2
        ],
        callback
      );

      function stat(callback) {
        fs.stat(file, callback)
      }

      function part1(stats, callback) {
        var url = format('%s/repos/%s/%s/downloads', baseUrl, options.user, options.repo)

        request.post(
          {
            url: url,
            body: JSON.stringify({
              name: name,
              size: stats.size
            })
          },
          function (error, response, body) {
            if (!error && Math.floor(response.statusCode / 100) === 2) {
              callback(null, JSON.parse(body));
            } else {
              callback(format("Failed to upload file : %s, %s, %d, %s", file, name, response.statusCode, body));
            }
          }
        );
      }

      function part2(part1Response, callback) {
        var args = [
          '-F', 'key=' + part1Response.path,
          '-F', 'acl=' + part1Response.acl,
          '-F', 'success_action_status=201',
          '-F', 'Filename=' + part1Response.name,
          '-F', 'AWSAccessKeyId=' + part1Response.accesskeyid,
          '-F', 'Policy=' + part1Response.policy,
          '-F', 'Signature=' + part1Response.signature,
          '-F', 'Content-Type=' + part1Response.mime_type,
          '-F', 'file=@' + file,
          part1Response.s3_url
        ];
        var curl = spawn('curl', args);
        var errors = '';

        curl.stdout.on('data', function (data) {
          //console.log(data.toString());
        });

        curl.stderr.on('data', function (data) {
          errors += data;
        });

        curl.on('exit', function gitExit(code) {
          if (code !== 0) {
            util.error(errors);
            callback('curl upload to s3 for ' + file + ' failed: exit code ' + code);
          } else {
            callback(null);
          }
        });
      }
    }
  };
}

/*
var downloads = new module.exports({
  authenticate: JSON.parse(fs.readFileSync('/home/mike/.leyton/github-credentials')),
  user: 'pekim',
  repo: 'leyton'
});

downloads.files(function(err, files) {
  if (err) {
    console.log(err);
  } else {
    console.log(files);

    var file = '/tmp/node-api-docs-v0.3.2-11274-7594-1jml60n.tar.gz';

    downloads.upload(file, 'qaz4', function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('uploaded ', file);
      }
    });
  }
});
*/