var express = require('express');
var router = express.Router();
var db = require('../connections/firebase_admin_connect');

const docRef = db.collection('users').doc('alovelace');
const aTuringRef = db.collection('users').doc('aturing');
/* GET home page. */
router.get('/', function(req, res, next) {
  docRef.set({
    first: 'Ada',
    last: 'Lovelace',
    born: 1815
  });
  aTuringRef.set({
    'first': 'Alan',
    'middle': 'Mathison',
    'last': 'Turing',
    'born': 1912
  })
  res.render('index', { title: 'Express AAA' });
});

module.exports = router;
