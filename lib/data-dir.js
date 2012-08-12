var fs = require('fs');
var path = require('path');

var dataDir = path.join(process.env.HOME, '/.leyton');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

module.exports = dataDir;
