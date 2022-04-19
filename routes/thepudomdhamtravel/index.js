var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('幹林老師');
  res.render('thepudomdhamtravel/index', {
    title: 'Thepudomthamtour'
  });
});

module.exports = router;
