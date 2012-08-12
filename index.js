var async = require('async');
var charm = require('charm')(process);

var downloadedDocs = require('./lib/downloaded-docs');

// var ProgressAnimation = require('./lib/progress-animation');
// var status = require('./lib/status');

downloadedDocs.latestStableVersion(function(err, version) {
  console.log(version.name);

  // charm.reset();
  // charm.on('^C', process.exit);

  process.exit();
});

// if (!status.availableDownloadsUpdatedRecently(60 * 1000)) {

// }

// charm.write('initialising ');

// charm.position(function(x, y) {
//   var progressAnimation = new ProgressAnimation(charm, x, y)

//   progressAnimation.start();
//   gitRepo.update(function gitUpdateComplete(err) {
//     progressAnimation.stop();

//     if (err) {
//       console.log(err);
//     }
//     process.exit();
//   });
// });
