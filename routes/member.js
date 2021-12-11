const express = require('express');
const router = express.Router();
/* Rayok ----- */
const app = require('../connections/firebase_connect');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, deleteUser, signOut } = require('firebase/auth');
const auth = getAuth(app);
const db = require('../connections/firebase_admin_connect');
/* ----- Rayok */

router.get('/signin', function (req, res) {
    if (req.session.error){
        var error = req.session.error;
        req.session.error = undefined;
    }
    res.render('member', {
        page: 'signin',
        title: 'Signin',
        error: error
    });
})
router.post('/signin', function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        req.session.uid = user.uid;
        req.session.emailVerified = user.emailVerified;
        if (req.body.remember == 'on'){
            req.session.cookie.maxAge = 7*24*3600*1000;
        }
        signOut(auth);
        res.redirect('/restaurant');
    })
    .catch((error) => {
        const errorCode = error.code;
        switch (errorCode){
            case 'auth/invalid-email':
                req.session.error = '您的信箱格式輸入錯誤';
                res.redirect('/member/signin');
                break;
            case 'auth/user-disabled':
                req.session.error = '您的帳號目前停用，請聯絡管理員';
                res.redirect('/member/signin');
                break;
            case 'auth/user-not-found':
                req.session.error = '您的信箱尚未註冊';
                res.redirect('/member/signin');
                break;
            case 'auth/wrong-password':
                req.session.error = '您的密碼輸入錯誤';
                res.redirect('/member/signin');
                break;
        }
    });
})

router.get('/signup', function (req, res) {
    if (req.session.error){
        var error = req.session.error;
        req.session.error = undefined;
    }
    res.render('member', {
        page: 'signup',
        title: 'Signup',
        error: error
    });
})

router.post('/signup', function (req, res) {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  
  createUserWithEmailAndPassword(auth, email, password)
    .then(function(userCredential){
        const user = userCredential.user;
        const userRef = db.collection('users').doc(user.uid);
        userRef.set({
            username: username,
            email: email,
            password: password
        });
        
        res.redirect('/member/success');
    })
    .catch(function(error){
        const errorCode = error.code;
        switch (errorCode){
            case 'auth/email-already-in-use':
                req.session.error = '信箱已有人使用';
                res.redirect('/member/signup');
                break;
            case 'auth/invalid-email':
                req.session.error = '信箱格式錯誤';
                res.redirect('/member/signup');
                break;
            case 'auth/operation-not-allowed':
                req.session.error = '目前尚未開放註冊';
                res.redirect('/member/signup');
                break;
            case 'auth/weak-password':
                req.session.error = '密碼強度不足';
                res.redirect('/member/signup');
                break;
        }
    });
})

router.get('/signout', function(req, res) {
  req.session.cookie.maxAge = 0;
  res.redirect('/member/signin');
})

router.get('/user', function(req, res) {
    if (req.session.uid){
        const userRef = db.collection('users').doc(req.session.uid);
        userRef.get().then((user) => {
            res.render('member',{
                page: 'user',
                title: '會員專區',
                username: user.data().username
            });
        }).catch((error) => {
          console.log("Error getting document:", error);
        })
    } else {
        res.redirect('/member/signin');
    }
});

router.get('/success',function(req,res){
  res.render('member',{
      email: auth.currentUser.email,
      page: 'success',
      title: '註冊成功'
  });
})


module.exports = router;