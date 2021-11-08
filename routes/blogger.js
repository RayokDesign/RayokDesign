const express = require('express');
const router = express.Router();
const striptags = require('striptags');
const moment = require('moment');
const firebaseDb = require('../connections/firebase_admin_connect');
const firebase = require('../connections/firebase_connect');
const fireAuth = firebase.auth();
const categoriesRef = firebaseDb.ref('categories');
const articlesRef = firebaseDb.ref('articles');
const convertPagination = require('../modules/convertPagination')

/* GET home page. */
router.get('/', function(req, res, next) {
    //登入狀態確認
    if (req.session.uid){
        var auth = req.session.uid;
    }
    const pathname = req['_parsedUrl'].pathname;
    const currentPage = req.query.page || 1;
    const status = req.query.status || 'public';
    let categories = {};
    categoriesRef.once('value').then(function(snapshot){
      categories = snapshot.val();
      return articlesRef.orderByChild('update_time').once('value');
  }).then(function(snapshot){
      const articles = [];
      snapshot.forEach(function(snapshotChild){
          if ('public' == snapshotChild.val().status){
              articles.push(snapshotChild.val());
          }
      })
      articles.reverse();
      const data = convertPagination(articles,currentPage);
    
      res.render('./blog/blog', {
        auth,
        articles: data.data,
        categories,
        striptags,
        moment,
        status,
        page:data.page,
        pathname
    });
  })
});

router.get('/post/:id',function(req,res){
    if (req.session.uid){
        var auth = req.session.uid;
    }
    const id = req.params.id;
    const pathname = req['_parsedUrl'].pathname;
    let categories = {};
    categoriesRef.once('value').then(function (snapshot){
        categories = snapshot.val();
        return articlesRef.child(id).once('value');
    }).then(function (snapshot){
        const article = snapshot.val();
        // if (!article){
        //     return res.render('error',{
        //         title: '找不到該文章'
        //     })
        // }
        res.render('./blog/blogPost', {
            categories,
            article,
            moment,
            auth,
            pathname
        });
    });
})

router.get('/msgboard', function (req, res, next) {
    firebaseDb.ref('list').once('value',function(snapshot){
        //登入狀態確認
        if (req.session.uid){
            var auth = req.session.uid;
        }
        const pathname = req['_parsedUrl'].pathname;
        //資料倒序
        var arr = [];
        snapshot.forEach(function (item){
            arr.push(item.val());
        })
        arr.reverse();

        //渲染頁面、傳送資料到網頁上
        res.render('./blog/blogMsgboard', {
            auth: auth,
            list:arr,
            moment,
            pathname
        });
    })
});

router.post('/msgboard/add', function (req, res) {
    firebaseDb.ref('users/'+req.session.uid).once('value',function(snapshot){
        var name = snapshot.val().name;
        var listContent = {
            name:name,
            content:req.body.content,
            timestamp:new Date().getTime()
        }
        firebaseDb.ref('list').push().set(listContent)
        .then(function (){
            res.redirect('/blog/msgboard');
        })
    })
})

router.get('/login', function (req, res) {
    res.render('./blog/blogLogin');
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
                firebase.auth().currentUser.updateProfile({
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
        res.redirect('/blog');
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorCode+','+ errorMessage);
        res.redirect('/blog');
    });
})

router.get('/logout', function (req, res) {
    req.session.cookie.maxAge = -1;
    res.redirect('/blog');
})


router.get('/register', function (req, res) {
    res.render('./blog/blogRegister', { title: '註冊'});
})

router.post('/register', function (req, res) {
    var emailReg = /^[a-z0-9]{1}(\.?[a-z0-9])+@[a-z0-9]+\.[a-z0-9]+(\.[a-z0-9]+)?$/;
    var passReg = /^\S{1}[\w\d\x21-\x2F\x3A-\x40\x5B-\x60\x7B\x7D\x7E]{6,}\S{1}$/;
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;

    if(emailReg.test(email)&&passReg.test(password)){
        fireAuth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
        // Signed in 
            var user = userCredential.user;
            var saveUser = {
                'email':email,
                'password':password,
                'name':name
            }
            
            firebaseDb.ref('/users/'+user.uid).set(saveUser);
            res.redirect('/blog');
          })
          .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
    
            res.redirect('./blog/blogRegister');
        });
    }
})
router.get('/register/success',function(req,res){
    res.render('./blog/blogSuccess',{
        title:'註冊成功'
    });
})

router.get('/forgot',function(req,res){
    res.render('./blog/blogForgot');
})

router.post('/forgot/reset',function(req,res){
    var email = req.body.email;
    firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
        // Password reset email sent!
        // ..
        console.log('sentEmail');
        res.redirect('/blog');
    })
    .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        // ..
    });
})

router.get('/user',function(req,res){
    const user = firebase.auth().currentUser;
    if (user !== null){
        firebaseDb.ref('/users/'+user.uid).once("value", function(snapshot){
            console.log(snapshot.val());
        })
        const userProfile = {
            displayName: user.displayName,
            email: user.email,
        }
        res.render('./blog/blogUser',{
            userProfile
        })
    }
})

module.exports = router;