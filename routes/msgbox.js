const express = require('express');
const router = express.Router();
const db = require('../connections/firebase_admin_connect');

router.post('/', function (req, res) {
    const userRef = db.collection('users').doc(req.session.uid);
    userRef.get().then((user) => {
        var username = user.data().username;
        var msgboxRef = db.collection('msgbox');
        var msgboxInfo = {
            username: username,
            message: req.body.message,
            timestamp: new Date().getTime(),
            like: []
        }
        msgboxRef.add(msgboxInfo)
        .then(function(){
            res.redirect('/');
        })
    });
})
module.exports = router;