var express = require('express');
var router = express.Router();
const { getFirestore } = require('firebase-admin/firestore');
const db = getFirestore();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('thepudomdhamtravel/headline', { 
    title: 'อินโดนีเซีย',
    country: 'อินโดนีเซีย'
  });
});

router.get('/:slug', async function(req, res, next) {
  console.log('aa');
  const articleRef = db.collection('articles');
  const snapshot = await articleRef.where('slug', '==', `${req.params.slug}`).get();
  if (snapshot.empty) {
    res.status(500);
    res.render('thepudomdhamtravel/error');
  } else {
    snapshot.forEach(doc => {
      let article = doc.data();
      res.render('thepudomdhamtravel/article', {
        country: 'อินโดนีเซีย',
        pathname: req.originalUrl,
        title: article.titleTag,
        metaDescription: article.metaDescription,
        openGraphImageURL: article.openGraphImageURL
      });
    });
  }
});

module.exports = router;
