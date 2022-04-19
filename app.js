require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const vhost = require('vhost');

/* Rayok ----- */
const session = require('express-session');
/* ----- Rayok */

/* Rayok ----- */
var indexRouter = require('./routes/index');
var financesRouter = require('./routes/finances');
var memberRouter = require('./routes/member');
var adminRouter = require('./routes/admin');
var restaurantRouter = require('./routes/restaurant');
var friendlychatRouter = require('./routes/friendlychat');
/* ----- Rayok */

// ------ thepudomdhamtravel
const thepudomdhamtravelIndexRouter = require('./routes/thepudomdhamtravel/index');
const thepudomdhamtravelAboutRouter = require('./routes/thepudomdhamtravel/about');
//const thepudomdhamtravelIndiaRouter = require('./routes/thepudomdhamtravel/india');
const thepudomdhamtravelNepalRouter = require('./routes/thepudomdhamtravel/nepal');
const thepudomdhamtravelCambodiaRouter = require('./routes/thepudomdhamtravel/cambodia');
const thepudomdhamtravelContactRouter = require('./routes/thepudomdhamtravel/contact');
const thepudomdhamtravelBhutanRouter = require('./routes/thepudomdhamtravel/bhutan');
const thepudomdhamtravelLaosRouter = require('./routes/thepudomdhamtravel/laos');
const thepudomdhamtravelIndonesiaRouter = require('./routes/thepudomdhamtravel/indonesia');
const thepudomdhamtravelMyanmarRouter = require('./routes/thepudomdhamtravel/myanmar');
const thepudomdhamtravelSrilankaRouter = require('./routes/thepudomdhamtravel/srilanka');
const thepudomdhamtravelUsersRouter = require('./routes/thepudomdhamtravel/users');
const thepudomdhamtravelLoginRouter = require('./routes/thepudomdhamtravel/login');
// thepudomdhamtravel -----

var app = express();
/* Rayok ----- */
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
/* ----- Rayok */

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

/* Rayok----- */
// ----- thepudomdhamtravel
app.use(vhost('thepudomdhamtravel.rayok.tw', thepudomdhamtravelIndexRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/about', thepudomdhamtravelAboutRouter));
//app.use(vhost('thepudomdhamtravel.rayok.tw/india', thepudomdhamtravelIndiaRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/nepal', thepudomdhamtravelNepalRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/cambodia', thepudomdhamtravelCambodiaRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/contact', thepudomdhamtravelContactRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/bhutan', thepudomdhamtravelBhutanRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/laos', thepudomdhamtravelLaosRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/indonesia', thepudomdhamtravelIndonesiaRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/myanmar', thepudomdhamtravelMyanmarRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/srilanka', thepudomdhamtravelSrilankaRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/users', thepudomdhamtravelUsersRouter));
app.use(vhost('thepudomdhamtravel.rayok.tw/login', thepudomdhamtravelLoginRouter));
// thepudomdhamtravel -----

app.use('/', indexRouter);
app.use('/finances', financesRouter);
app.use('/member', memberRouter);
app.use('/admin', adminRouter);
app.use('/restaurant', restaurantRouter);
app.use('/friendlychat', friendlychatRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
