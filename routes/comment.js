const express = require('express');
const router = express.Router();
const db = require('../connections/firebase_admin_connect');

router.post('/', function (req, res) {
    const userRef = db.collection('users').doc(req.session.uid);
    userRef.get().then((user) => {
        var username = user.data().username;
        var commentsRef = db.collection('comments');
        var comment = {
            username: username,
            message: req.body.message,
            timestamp: new Date().getTime(),
            like: []
        }
        commentsRef.add(comment)
        .then(function(){
            res.redirect('/');
        })
    });
})

router.get('/like/:id', function(req, res) {
  const commentRef = db.collection('comments').doc(req.params.id);

  async function updateLike() {
    let like = await (await commentRef.get()).data().like;
    
    if (like.indexOf(req.session.uid) == -1){
      like.push(req.session.uid);
      await commentRef.update({like: like});
    } else {
      like.splice(like.indexOf(req.session.uid),1);
      await commentRef.update({like: like});
    }
    res.redirect('/');
  }
  updateLike();
});

module.exports = router;