var express = require('express');
var router = express.Router();
var firebaseDb = require('../connections/firebase_admin_connect');

const docRef = firebaseDb.collection('users').doc('alovelace');

/* GET home page. */
router.get('/', function(req, res, next) {
  docRef.set({
    first: 'Ada',
    last: 'Lovelace',
    born: 1815
  })
  res.render('index', { title: 'Express AAA' });
});

module.exports = router;
