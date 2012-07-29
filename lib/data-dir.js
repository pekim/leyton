var fs = require('fs');

var dataDir = process.env.HOME + '/.leyton';

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

module.exports = dataDir;
