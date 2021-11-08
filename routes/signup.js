const express = require('express');
const router = express.Router();
/* Rayok ----- */
const app = require('../connections/firebase_connect');
const { getAuth, createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
const auth = getAuth(app);
const db = require('../connections/firebase_admin_connect');
/* ----- Rayok */

router.get('/', function (req, res) {
    if (req.session.error){
        var error = req.session.error;
        req.session.error = undefined;
    }
    res.render('signup', {
        title: '註冊',
        error: error
    });
})

router.post('/', function (req, res) {
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
        sendEmailVerification(user)
        .then(() => {
            console.log('驗證信已傳送至您的信箱');
        })
        res.redirect('/signup/success');
    })
    .catch(function(error){
        const errorCode = error.code;
        switch (errorCode){
            case 'auth/email-already-in-use':
                req.session.error = '信箱已有人使用';
                res.redirect('/signup');
                break;
            case 'auth/invalid-email':
                req.session.error = '信箱格式錯誤';
                res.redirect('/signup');
                break;
            case 'auth/operation-not-allowed':
                req.session.error = '目前尚未開放註冊';
                res.redirect('/signup');
                break;
            case 'auth/weak-password':
                req.session.error = '密碼強度不足';
                res.redirect('/signup');
                break;
        }
    });
})
router.get('/success',function(req,res){
    res.render('success',{
        title:'註冊成功'
    });
})
module.exports = router;