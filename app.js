require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

/* Rayok ----- */
const session = require('express-session');
/* ----- Rayok */

var indexRouter = require('./routes/index');

/* Rayok ----- */
var signinRouter = require('./routes/signin');
var signupRouter = require('./routes/signup');
var userRouter = require('./routes/user');
var msgboxRouter = require('./routes/msgbox')
/* ----- Rayok */

var app = express();
/* Rayok ----- */
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))
/* ----- Rayok */
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

/* Rayok----- */
app.use('/signin', signinRouter);
app.use('/signup', signupRouter);
app.use('/msgbox', msgboxRouter);

//如果未登入，不允許訪問以下路由
app.use(function (req, res, next){
  if (req.session.uid){
    return next();
  } else {
    res.redirect('/');
  }
});
app.use('/user', userRouter);
/* -----Rayok */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
