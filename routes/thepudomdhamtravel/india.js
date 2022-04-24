var express = require('express');
var router = express.Router();

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../../connections/thepudomdhamtravel/thepudomdham-cb406-firebase-adminsdk-feh61-68672865b4.json');

const thepudomdhamtravelApp = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(thepudomdhamtravelApp);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('thepudomdhamtravel/headline', {
    title: 'อินเดีย',
    country: 'อินเดีย'
  });
});

router.get('/:slug', async function(req, res, next) {
  const articleRef = db.collection('articles');
  const snapshot = await articleRef.where('slug', '==', `${req.params.slug}`).get();
  if (snapshot.empty) {
    res.status(500);
    res.render('thepudomdhamtravel/error');
  } else {
    snapshot.forEach(doc => {
      let article = doc.data();
      res.render('thepudomdhamtravel/article', {
        country: 'อินเดีย',
        pathname: req.originalUrl,
        title: article.titleTag,
        metaDescription: article.metaDescription,
        openGraphImageURL: article.openGraphImageURL
      });
    });
  }
});

module.exports = router;
