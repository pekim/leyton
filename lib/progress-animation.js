module.exports = function(charm, x, y) {
  var chars = '|/-\\|/-\\';
  var animationTimer;

  return {
    start: function() {
      var charsPos = 0;
      var xPos, yPos;

      charm.cursor(false);

      animationTimer = setInterval(function() {
        charm.position(x, y);
        charm.write(chars[charsPos]);

        charsPos++;
        if (charsPos >= chars.length) {
          charsPos = 0;
        }
      }, 200);
    },

    stop: function() {
      require('util').puts('');
      clearInterval(animationTimer);

      charm.cursor(true);
    }
  };
}
