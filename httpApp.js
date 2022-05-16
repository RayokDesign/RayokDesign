const express = require('express');
const app = express();

app.use((req, res, next) => {
    if(req.protocol === 'http'){
        res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next();
})

module.exports = app;