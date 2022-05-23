require('dotenv').config();
const express = require('express');
const app = express();


app.use(function(req, res, next){
  //res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Server', 'Node.js/16.15.0');
  next();
})
app.use(function (req, res, next) {
  if(req.protocol == 'http' && req.hostname.search("localhost") == -1){
    return res.redirect('https://' + req.hostname + req.originalUrl);
  }
  next();
});

const createError = require('http-errors');
const path = require('path');
const logger = require('morgan');
const vhost = require('vhost');
const session = require('express-session');


const thepudomdhamtravelIndexRouter = require('./routes/thepudomdhamtravel/index');
const diamondmarriagevisaIndexRouter = require('./routes/diamondmarriagevisa/index');
const rayokDesignIndexRouter = require('./routes/rayokdesign/index');

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

app.use(vhost('thepudomdhamtravel.rayokdesign.com', thepudomdhamtravelIndexRouter));
app.use(vhost('thepudomdhamtravel.localhost', thepudomdhamtravelIndexRouter));
app.use(vhost('diamondmarriagevisa.rayokdesign.com', diamondmarriagevisaIndexRouter));
app.use(vhost('diamondmarriagevisa.localhost', diamondmarriagevisaIndexRouter));
app.use('/', rayokDesignIndexRouter);

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
