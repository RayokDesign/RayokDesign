var express = require('express');
var router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
/* ----- Rayok */

/* GET users listing. */
router.get('/', function(req, res) {
  const userRef = db.collection('users').doc(req.session.uid);
  userRef.get().then((user) => {
    res.render('user',{
      title: '會員專區',
      username: user.data().username
    });
  }).catch((error) => {
    console.log("Error getting document:", error);
  })
});

module.exports = router;
