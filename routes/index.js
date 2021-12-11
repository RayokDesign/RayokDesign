const express = require('express');
const router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
const moment = require('moment');
/* ----- Rayok */


router.get('/', function(req, res) {
  res.redirect('/member/signin');
  // async function getMultiple(){
  //   //獲取所有留言
  //   const commentsRef = db.collection('comments');
  //   const snapshot = await commentsRef.orderBy("timestamp", "desc").get();
  //   let commentsInfo = [];
  //   snapshot.forEach((doc) => {
  //     let data = doc.data();
  //     data.id = doc.id;
  //     commentsInfo.push(data);
  //   });
  //   //登入與驗證狀態檢查
  //   const uid = req.session.uid;
  //   const emailVerified = req.session.emailVerified;
  //   res.render('index', {
  //     title: '首頁',
  //     uid: uid,
  //     emailVerified: emailVerified,
  //     commentsInfo: commentsInfo,
  //     moment: moment,
  //   });
  // }
  // getMultiple();
});

module.exports = router;
