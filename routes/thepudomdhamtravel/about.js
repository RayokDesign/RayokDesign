var express = require('express');
var router = express.Router();
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const aboutRef = db.collection('pages').doc('about');
  const doc = await aboutRef.get();

  res.render('thepudomdhamtravel/about', {
    title: 'About',
    slider: doc.data(),
  });
});

module.exports = router;
