var apiDir = require('../lib/git-repo').apiDir;
var charm = require('charm')();
var fs = require('fs');
var marked = require('marked');

marked.setOptions({
  gfm: true,
  pedantic: false,
  sanitize: true
});

var markdownText = fs.readFileSync(apiDir + '/' + process.argv[2] + '.markdown', 'utf8');
var tokens = marked.lexer(markdownText);

charm.pipe(process.stdout);
charm.reset();

tokens.forEach(function(token) {
  //console.log(token.type);
  //console.log('  ' + token.text);
  switch (token.type) {
    case 'heading':
      switch (token.depth) {
        case 1:
          charm.foreground('red');
          charm.column(1);
          break;
        case 2:
          charm.foreground('green');
          charm.column(3);
          break;
        default:
          charm.foreground('yellow');
          charm.column(5);
      }

      charm.background('black');
      charm.write(token.text);
      charm.down(1);
      break;
    case 'paragraph':
      writeLines(token.text, 3, 'white', 'black');
      break
    case 'code':
      writeLines(token.text, 3, 'black', 'white');
      break
    default:
      charm.foreground('cyan');
      charm.background('black');
      charm.column(0);
      charm.write('!!' + token.type);
      charm.down(1);
  }
});

function writeLines(lines, indent, foreground, background) {
  charm.foreground(foreground);
  charm.background(background);

  lines.split('\n').forEach(function paragraphLine(line, index) {
    if (index !== lines.length - 1 || line.length > 0) {
      charm.column(indent);
      charm.write(line);
      charm.down(1);
    }
  });
}

charm.foreground('white');
charm.background('black');
charm.down(1);

//console.log (tokens);
