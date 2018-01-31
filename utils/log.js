var log4js = require('log4js');
var path = require('path');

log4js.configure({
  appenders: {
    yx: {type: 'file', filename: path.join(__dirname, '../log', 'yx.log')},
    console: {type: 'console'}
  },
  categories: {default: {appenders: ['console', 'yx'], level: 'trace'}}
});

const log = log4js.getLogger();
module.exports = log;
