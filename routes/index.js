var express = require('express');
var router = express.Router();
var firebaseDb = require('../connections/firebase_admin_connect');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express AAA' });
});

module.exports = router;
