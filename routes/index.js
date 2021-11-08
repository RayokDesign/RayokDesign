var express = require('express');
var router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
const moment = require('moment');
/* ----- Rayok */
router.get('/', function(req, res, next) {
  db.collection("msgbox")
  .orderBy("timestamp", "desc").get().then((msgboxList) => {
    let msgboxesInfo = [];
    msgboxList.forEach((msgbox) => {
      msgboxesInfo.push(msgbox.data())
    })
    //登入與驗證狀態檢查
    const uid = req.session.uid;
    const emailVerified = req.session.emailVerified;
    
    res.render('index', {
      title: '首頁',
      uid: uid,
      emailVerified: emailVerified,
      msgboxesInfo: msgboxesInfo,
      moment: moment
    })
  })
});
router.get('/signout', function(req, res, next) {
  req.session.cookie.maxAge = 0;
  res.redirect('/');
})

module.exports = router;
