var express = require('express');
var router = express.Router();

const app = require('../connections/firebase_connect');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const auth = getAuth(app);

router.get('/', function (req, res) {
    res.render('signup', { title: '註冊'});
})

router.post('/', function (req, res) {

})
router.get('/success',function(req,res){
    res.render('success',{
        title:'註冊成功'
    });
})
module.exports = router;