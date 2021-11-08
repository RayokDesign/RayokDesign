const express = require('express');
const router = express.Router();
/* Rayok ----- */
const app = require('../connections/firebase_connect');
const { getAuth, signInWithEmailAndPassword, signOut } = require('firebase/auth');
const auth = getAuth(app);
/* ----- Rayok */

router.get('/', function (req, res) {
    if (req.session.error){
        var error = req.session.error;
        req.session.error = undefined;
    }
    res.render('signin', {
        title: '登入',
        error: error
    });
})
router.post('/', function (req, res) {
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
        res.redirect('/');
    })
    .catch((error) => {
        const errorCode = error.code;
        switch (errorCode){
            case 'auth/invalid-email':
                req.session.error = '您的信箱格式輸入錯誤';
                res.redirect('/signin');
                break;
            case 'auth/user-disabled':
                req.session.error = '您的帳號目前停用，請聯絡管理員';
                res.redirect('/signin');
                break;
            case 'auth/user-not-found':
                req.session.error = '您的信箱尚未註冊';
                res.redirect('/signin');
                break;
            case 'auth/wrong-password':
                req.session.error = '您的密碼輸入錯誤';
                res.redirect('/signin');
                break;
        }
    });
})

module.exports = router;