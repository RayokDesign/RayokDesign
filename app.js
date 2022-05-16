require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const vhost = require('vhost');

/* Rayok ----- */
const session = require('express-session');
/* ----- Rayok */

const thepudomdhamtravelIndexRouter = require('./routes/thepudomdhamtravel/index');
const rayokDesignIndexRouter = require('./routes/rayokdesign/index');

// thepudomdhamtravel -----

var app = express();
/* Rayok ----- */
app.use(session({
  secret: 'process.env.SESSION_SECRET_KEY',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
// ----- Rayok

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ----- thepudomdhamtravel
app.use(vhost('thepudomdhamtravel.rayokdesign.com', thepudomdhamtravelIndexRouter));
app.use(vhost('thepudomdhamtravel.localhost', thepudomdhamtravelIndexRouter));
// thepudomdhamtravel -----

// ----- Rayok
app.use('/', rayokDesignIndexRouter);
// Rayok ------

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
