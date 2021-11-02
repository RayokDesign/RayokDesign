var express = require('express');
var router = express.Router();
var moment = require('moment');
var firebaseDb = require('../connections/firebase_admin_connect');

router.get('/', function (req, res, next) {
        res.redirect('/blog');
});

/* GET home page. */
module.exports = router;