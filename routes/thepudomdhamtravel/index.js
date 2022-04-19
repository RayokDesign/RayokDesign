var express = require('express');
var router = express.Router();

const thepudomdhamtravelAboutRouter = require('./routes/thepudomdhamtravel/about');
const thepudomdhamtravelIndiaRouter = require('./routes/thepudomdhamtravel/india');
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('thepudomdhamtravel/index', {
    title: 'Thepudomthamtour'
  });
});

router.use('/about', thepudomdhamtravelAboutRouter);
router.use('india', thepudomdhamtravelIndiaRouter);
router.use('nepal', thepudomdhamtravelNepalRouter);
router.use('cambodia', thepudomdhamtravelCambodiaRouter);
router.use('contact', thepudomdhamtravelContactRouter);
router.use('bhutan', thepudomdhamtravelBhutanRouter);
router.use('laos', thepudomdhamtravelLaosRouter);
router.use('indonesia', thepudomdhamtravelIndonesiaRouter);
router.use('myanmar', thepudomdhamtravelMyanmarRouter);
router.use('srilanka', thepudomdhamtravelSrilankaRouter);
router.use('users', thepudomdhamtravelUsersRouter);
router.use('login', thepudomdhamtravelLoginRouter);

module.exports = router;
