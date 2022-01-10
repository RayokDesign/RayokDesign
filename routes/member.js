const express = require('express');
const router = express.Router();
/* Rayok ----- */
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const app = require('../connections/firebase_connect');
const db = require('../connections/firebase_admin_connect');
const auth = getAuth(app);
/* ----- Rayok */

router.get('/members', function (req,res){
    
})
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
        
        res.redirect('/restaurant');
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


module.exports = router;