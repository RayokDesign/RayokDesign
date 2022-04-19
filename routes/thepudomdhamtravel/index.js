var express = require('express');
var router = express.Router();

const thepudomdhamtravelAboutRouter = require('./about');
const thepudomdhamtravelIndiaRouter = require('./india');
const thepudomdhamtravelNepalRouter = require('./nepal');
const thepudomdhamtravelCambodiaRouter = require('./cambodia');
const thepudomdhamtravelContactRouter = require('./contact');
const thepudomdhamtravelBhutanRouter = require('./bhutan');
const thepudomdhamtravelLaosRouter = require('./laos');
const thepudomdhamtravelIndonesiaRouter = require('./indonesia');
const thepudomdhamtravelMyanmarRouter = require('./myanmar');
const thepudomdhamtravelSrilankaRouter = require('./srilanka');
const thepudomdhamtravelUsersRouter = require('./users');
const thepudomdhamtravelLoginRouter = require('./login');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('thepudomdhamtravel/index', {
    title: 'Thepudomthamtour'
  });
});

router.use('/about', thepudomdhamtravelAboutRouter);
router.use('/india', thepudomdhamtravelIndiaRouter);
router.use('/nepal', thepudomdhamtravelNepalRouter);
router.use('/cambodia', thepudomdhamtravelCambodiaRouter);
router.use('/contact', thepudomdhamtravelContactRouter);
router.use('/bhutan', thepudomdhamtravelBhutanRouter);
router.use('/laos', thepudomdhamtravelLaosRouter);
router.use('/indonesia', thepudomdhamtravelIndonesiaRouter);
router.use('/srilanka', thepudomdhamtravelSrilankaRouter);
router.use('/myanmar', thepudomdhamtravelMyanmarRouter);
router.use('/users', thepudomdhamtravelUsersRouter);
router.use('/login', thepudomdhamtravelLoginRouter);

module.exports = router;
