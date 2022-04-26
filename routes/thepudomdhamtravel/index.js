const express = require('express');
const router = express.Router();
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const serviceAccount = require('../../connections/thepudomdhamtravel/thepudomdham-cb406-firebase-adminsdk-feh61-68672865b4.json');
const { getFirestore } = require('firebase-admin/firestore');

const thepudomdhamtravelApp = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(thepudomdhamtravelApp);

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
router.use(express.static(path.join(__dirname, '../../public/thepudomdhamtravel')));

/* GET home page. */
router.get('/', async function(req, res, next) {
  const indexRef = db.collection('pages').doc('index');
  const doc = await indexRef.get();

  res.render('thepudomdhamtravel/index', {
    title: 'Thepudomthamtour',
    slider: doc.data(),
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
