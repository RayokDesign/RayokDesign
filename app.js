require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

/* Rayok ----- */
const session = require('express-session');
/* ----- Rayok */

/* Rayok ----- */
var indexRouter = require('./routes/index');
var memberRouter = require('./routes/member');
var commentRouter = require('./routes/comment');
var restaurantRouter = require('./routes/restaurant');
/* ----- Rayok */

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

app.use('/', indexRouter);

/* Rayok----- */
app.use('/member', memberRouter);
app.use('/comment', commentRouter);
app.use(function(req,res,next){
  if(req.session.uid == process.env.ALLOW_UID){
    next();
  }else{
    req.session.error = 'คุณไม่ได้รับอนุญาตให้เข้าถึงเนื้อหา โปรดติดต่อผู้ดูแลระบบ';
    res.redirect('/member/signin');
  }
})
app.use('/restaurant', restaurantRouter);

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
