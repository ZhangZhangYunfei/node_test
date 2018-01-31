var path = require('path');
var fs = require('fs');
var stripJsonComments = require('strip-json-comments');

function loadJSONFile (file) {
  var json = fs.readFileSync(file).toString();
  return JSON.parse(stripJsonComments(json));
}

// path.resolve 在生产有bug
var config = loadJSONFile(path.join(__dirname, '../config', process.env.NODE_ENV + '.json'));

module.exports = config;
