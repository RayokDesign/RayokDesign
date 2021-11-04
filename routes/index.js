var express = require('express');
var router = express.Router();
const db = require('../connections/firebase_admin_connect');


router.get('/', function(req, res, next) {

  res.render('index', { title: 'Express AAA' });
});

module.exports = router;
