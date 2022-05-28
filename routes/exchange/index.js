const express = require('express');
const router = express.Router();
const path = require('path');
const request = require('request');


router.use(express.static(path.join(__dirname, '../../public/exchange')));

router.get('/', function(req, res) {
    res.header("Access-Control-Allow-Origin", "https://exchange.rayokdesign.com");
    res.render('exchange/index');
})

router.get('/fetch', (req, res) => {
    request(req.query.url, function (error, response, body) {
        if(error){
            res.status(500).send(`Something broke! Error: ${error}`);
        } else {
            res.send(body);
        }
    });
})

module.exports = router;