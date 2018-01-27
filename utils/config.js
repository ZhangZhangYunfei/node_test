var path = require('path');
var fs = require('fs');
var stripJsonComments = require('strip-json-comments');

function loadJSONFile (file) {
  var json = fs.readFileSync(file).toString();
  return JSON.parse(stripJsonComments(json));
}

var config = loadJSONFile(path.resolve('../config', process.env.NODE_ENV || 'development' + '.json'));

module.exports = config;
