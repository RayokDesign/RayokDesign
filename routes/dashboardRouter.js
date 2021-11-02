const express = require('express');
const router = express.Router();
const striptags = require('striptags');
const moment = require('moment');
const firebaseDb = require('../connections/firebase_admin_connect');

const categoriesRef = firebaseDb.ref('categories');
const articlesRef = firebaseDb.ref('articles');

router.get('/archives', function(req, res, next) {
    const status = req.query.status || 'public';
    let categories = {};
    categoriesRef.once('value').then(function(snapshot){
        categories = snapshot.val();
        return articlesRef.orderByChild('update_time').once('value');
    }).then(function(snapshot){
        const articles = [];
        snapshot.forEach(function(snapshotChild){
            if (status == snapshotChild.val().status){
                articles.push(snapshotChild.val());
            }
            
        })
        articles.reverse();
        res.render('dashboard/archives', {
            title: 'Express',
            articles,
            categories,
            striptags,
            moment,
            status
        });
    })
});


router.get('/article/:id', function(req, res, next) {
    const id = req.params.id;
    let categories = {};
    categoriesRef.once('value').then(function (snapshot){
        categories = snapshot.val();
        return articlesRef.child(id).once('value');
    }).then(function (snapshot){
        const article = snapshot.val();
        res.render('dashboard/article', {
            title: 'Express',
            categories,
            article
        });
    });
});

router.get('/article/create', function(req, res, next) {
    categoriesRef.once('value').then(function (snapshot){
        const categories = snapshot.val();
        res.render('dashboard/article', {
            title: 'Express',
            categories
        });
    })
});

router.post('/article/create',function (req,res){
    const data = req.body;
    const articleRef = articlesRef.push();
    const id = articleRef.key;
    const updateTime = Math.floor(Date.now()/1000)
    data.id = id;
    data.update_time = updateTime;
    articleRef.set(data).then(function (){
        res.redirect(`/blog/dashboard/article/${id}`);
    })
})

router.post('/article/update/:id',function (req,res){
    const data = req.body;
    const id = req.params.id;
    articlesRef.child(id).update(data).then(function (){
        res.redirect(`/blog/dashboard/article/${id}`);
    })
})

router.post('/article/delete/:id', function(req,res){
    req.session.msgBox = '文章已刪除';
    const id = req.params.id;
    articlesRef.child(id).remove();
    res.send('文章已刪除');
    res.end();
    // res.redirect('/blog/dashboard/categories');
});

router.get('/categories', function(req, res, next) {
    categoriesRef.once('value').then(function(snapshot){
        const categories = snapshot.val();
        var msgBox = req.session.msgBox;
        req.session.msgBox = null;
        res.render('dashboard/categories', {
            title: 'Express',
            categories,
            msgBox
        });
        
    })
});

router.post('/categories/create', function(req, res, next) {
    const data = req.body;
    const categoryRef = categoriesRef.push();
    const key = categoryRef.key;
    data.id = key;
    categoriesRef.orderByChild('path').equalTo(data.path).once('value')
        .then(function (snapshot){
            if (snapshot.val()!==null){
                req.session.msgBox = '已有相同路徑';
                res.redirect('/blog/dashboard/categories');
            }else{
                categoryRef.set(data).then(function (){
                    res.redirect('/blog/dashboard/categories');
                })
            }
        })

});

router.post('/categories/delete/:id', function(req,res){
    req.session.msgBox = '欄位已刪除';
    const id = req.params.id;
    categoriesRef.child(id).remove();
    res.redirect('/blog/dashboard/categories');
});

module.exports = router;
