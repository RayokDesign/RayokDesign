const express = require('express');
const router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
/* ----- Rayok */

router.get('/', async function(req,res){
    if (req.session.uid){
        if (req.session.admin){
            const userRef = db.doc(`users/${req.query.uid}`);
            if (req.query.uid){
                if (req.query.restaurant){
                    userRef.update({
                        restaurant: eval(req.query.restaurant)
                    })
                } else if (req.query.admin){
                    userRef.update({
                        admin: eval(req.query.admin)
                    })
                }
                res.end();
            } else {
                let data = {};
                const usersRef = db.collection('users');
                const snapshot = await usersRef.get();
                
                snapshot.forEach(user => {
                    data[user.id] = user.data();
                })
                res.render('admin', {
                    title: "Manager",
                    data: data,
                });
            }
        } else {
            res.redirect("/member/signin");
        }
    } else {
        res.redirect("/member/signin");
    }
})


module.exports = router;