var async = require('async');
var charm = require('charm')(process);
var gitRepo = require('./lib/git-repo');
var ProgressAnimation = require('./lib/progress-animation');

charm.reset();

charm.write('initialising ');
charm.on('^C', process.exit);

charm.position(function(x, y) {
  var progressAnimation = new ProgressAnimation(charm, x, y)

  progressAnimation.start();
  gitRepo.update(function gitUpdateComplete(err) {
    progressAnimation.stop();

    if (err) {
      console.log(err);
    }
    process.exit();
  });
});
