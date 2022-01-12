const express = require('express');
const router = express.Router();

router.get('/', async function(req, res) {
        req.session.error = 'Please Log In';
        res.redirect('/member/signin');
});
module.exports = router;