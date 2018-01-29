var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');
var Json = require('./utils/json');

var assignment = require('./routes/assignment');
var registration = require('./routes/registration');
var subject = require('./routes/subject');
var user = require('./routes/user');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 10 * 1000
}));

// login interceptor
app.use(function (req, res, next) {
  if (req.session.name && req.session.type && req.session.userId) {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3);
    next();
  } else {
    if (req.path.match('/api/user/login')
        || req.path.match('/api/user/logout')
        || req.path.match('/api/user/register')) {
      next();
    } else {
      var err = new Error('请先登录再访问!');
      err.status = 403;
      next(err);
    }
  }
});

app.use('/api/registration', registration);
app.use('/api/assignment', assignment);
app.use('/api/subject', subject);
app.use('/api/user', user);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('URL Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  res.end(Json.toString({status: 'FAILED', message: err.message}))
});

module.exports = app;
