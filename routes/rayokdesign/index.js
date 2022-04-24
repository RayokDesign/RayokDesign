const express = require('express');
const router = express.Router();
const path = require('path');

router.use(express.static(path.join(__dirname, '../../public/rayokdesign')));

//const financesRouter = require('./finances');
//const memberRouter = require('./member');
//const adminRouter = require('./admin');
//const restaurantRouter = require('./restaurant');

router.get('/', function(req, res) {
    res.render('rayokdesign/index', {
        title: "Home"
    });
})
//router.use('/finances', financesRouter);
//router.use('/member', memberRouter);
//router.use('/admin', adminRouter);
//router.use('/restaurant', restaurantRouter);

module.exports = router;