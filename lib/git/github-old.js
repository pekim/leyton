var GitHubApi = require('github');

var github = new GitHubApi({
    version: '3.0.0'
});

github.authenticate({
    type: "basic",
    username: 'pekim',
    password: 'a13xander'
});

//console.log(github)

/*
github.repos.getDownloads({
  user: 'pekim',
  repo: 'leyton'
}, function(err, downloads) {
  if (err) {
    console.log(err);
  } else {
    console.log(downloads);
  }
});
*/

github.repos.createDownload({
  user: 'pekim',
  repo: 'leyton',
  name: 'test',
  size: 100
}, function(err, downloads) {
  if (err) {
    console.log(err);
  } else {
    console.log(downloads);
  }
});

/*
github.repos.getDownload({
  user: 'pekim',
  repo: 'leyton',
  id: 287133
}, function(err, downloads) {
  if (err) {
    console.log(err);
  } else {
    console.log(downloads);
  }
});
*/