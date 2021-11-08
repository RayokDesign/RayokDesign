const express = require('express');
const router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
const moment = require('moment');
/* ----- Rayok */
router.get('/', function(req, res) {
  async function getMultiple(){
    //獲取所有留言
    const msgboxRef = db.collection('msgbox');
    const snapshot = await msgboxRef.orderBy("timestamp", "desc").get();
    let msgboxesInfo = [];
    snapshot.forEach((doc) => {
      let data = doc.data();
      data.id = doc.id;
      msgboxesInfo.push(data);
    });
    //登入與驗證狀態檢查
    const uid = req.session.uid;
    const emailVerified = req.session.emailVerified;
    res.render('index', {
      title: '首頁',
      uid: uid,
      emailVerified: emailVerified,
      msgboxesInfo: msgboxesInfo,
      moment: moment,
    });
  }
  getMultiple();
});
router.get('/signout', function(req, res) {
  req.session.cookie.maxAge = 0;
  res.redirect('/');
})

router.get('/like/:id', function(req, res) {
  async function updateDocument() {
    const id = req.params.id;
    const msgboxRef = db.collection('msgbox').doc(id);
    let like = await (await msgboxRef.get()).data().like;
    console.log(like.indexOf(req.session.uid));
    if (like.indexOf(req.session.uid) == -1){
      like.push(req.session.uid);
      await msgboxRef.update({
        like: like
      })
    } else {
      like.splice(like.indexOf(req.session.uid),1);
      await msgboxRef.update({
        like: like
      })
    }
    res.redirect('/');
  }
  
  updateDocument();
})

router.get("/fetch_image", (req, res) => {
  console.log("/fetch_image endpoint called");
  const url = "";
  const options = {
    "method": "GET",
  }
})

module.exports = router;
