const express = require('express');
const router = express.Router();
const path = require('path');

router.use(express.static(path.join(__dirname, '../../public/diamondmarriagevisa')));

router.get('/', function(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.render('diamondmarriagevisa/index');
})

module.exports = router;