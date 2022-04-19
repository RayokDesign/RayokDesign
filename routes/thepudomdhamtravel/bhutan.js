var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('thepudomdhamtravel/bhutan', { title: 'ภูฏาน' });
});

module.exports = router;
