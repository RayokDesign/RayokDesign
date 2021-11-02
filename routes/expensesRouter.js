var express = require('express');
var router = express.Router();
var moment = require('moment');
const firebaseDb = require('../connections/firebase_admin_connect');
const firebase = require('../connections/firebase_connect');
const fireAuth = firebase.auth();
router.get('/', function (req, res, next) {
    firebaseDb.ref('expenses/transactions').once('value',function(snapshot){
        //登入狀態確認
        if (req.session.uid){
            var auth = req.session.uid;
        }
        
        //資料倒序
        var arr = [];
        snapshot.forEach(function (item){
            arr.push(item.val());
        })
        arr.reverse();

        //渲染頁面、傳送資料到網頁上
        res.render('./expenses/expenses', {
            auth: auth,
            expenses:arr,
            moment
        });
    })
});

router.post('/addtransaction', function (req, res) {
    firebaseDb.ref('users/'+req.session.uid).once('value',function(snapshot){
        var transaction = {
            type:req.body.type,
            category:req.body.category,
            amount:req.body.amount,
            date:req.body.date
        }
        firebaseDb.ref('expenses/transactions').push().set(transaction)
        .then(function (){
            res.redirect('/expenses');
        })
        res.redirect('/expenses');
    })
})



router.get('/login', function (req, res) {
    res.render('./expenses/expensesLogin');
})
router.post('/login', function (req, res) {
    const email = req.body.email;
    const password = req.body.password;

    fireAuth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        if (user.displayName == null){
            firebaseDb.ref("/users/"+user.uid).once('value',function(snapshot){
                fireAuth.currentUser.updateProfile({
                    displayName: snapshot.val().name
                }).then(()=>{
                    console.log(user.displayName);
                }).catch((error)=>{

                })
            })
        }
        console.log(user.displayName);
        req.session.uid = user.uid;
        if (req.body.remember == 'on'){
            req.session.cookie.maxAge = 7*24*3600*1000;
        }
        res.redirect('/expenses');
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode+','+ errorMessage);
        res.redirect('/expenses');
    });
})

router.get('/logout', function (req, res) {
    req.session.cookie.maxAge = -1;
    res.redirect('/expenses');
})


router.get('/register', function (req, res) {
    res.render('./expenses/expensesRegister', { title: '註冊'});
})

router.post('/register', function (req, res) {
    var emailReg = /^[a-z0-9]{1}(\.?[a-z0-9])+@[a-z0-9]+\.[a-z0-9]+(\.[a-z0-9]+)?$/;
    var passReg = /^\S{1}[\w\d\x21-\x2F\x3A-\x40\x5B-\x60\x7B\x7D\x7E]{6,}\S{1}$/;
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    var timestamp = new Date().getTime();

    if(emailReg.test(email)||passReg.test(password)){
        fireAuth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
        // Signed in 
            var user = userCredential.user;
            var saveUser = {
                'email':email,
                'name':name,
                'uid':user.uid,
                'timestamp':timestamp
            }
            
            firebaseDb.ref('/users/'+user.uid).set(saveUser);
            res.redirect('/expenses/register/success');
          })
          .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
    
            res.redirect('./expenses/expensesRegister');
        });
    }
})
router.get('/expenses/register/success',function(req,res){
    res.render('./expenses/expensesSuccess',{
        title:'註冊成功'
    });
})

router.get('/forgot',function(req,res){
    res.render('./expenses/expensesForgot');
})

router.post('/forgot/reset',function(req,res){
    var email = req.body.email;
    firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
        // Password reset email sent!
        // ..
        console.log('sentEmail');
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ..
    });
})

router.get('/appdefault',function(req,res){
    firebaseDb.ref().child('appSetting/timestamp').set(firebase.database.ServerValue.TIMESTAMP);
})

/* GET home page. */
module.exports = router;