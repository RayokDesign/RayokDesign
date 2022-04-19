var express = require('express');
var router = express.Router();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../../connect/thepudomdham-cb406-firebase-adminsdk-feh61-68672865b4.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Thepudomthamtour'
    });
});

router.get('/india', function(req, res, next) {
  res.render('india', {title: 'อินเดีย'});
});

router.get('/india/:slug', async function(req, res, next) {
  console.log(req);
  const articleRef = db.collection('article');
  const snapshot = await articleRef.where('pathname', '==', `${req.originalUrl}`).get();
  if (snapshot.empty) {
    let data = {
      content: '',
      headline: req.url.split('/')[1],
      metaDescription: '',
      openGraphImageURL: '',
      pathname: req.originalUrl,
      slug: req.url.split('/')[1],
      titleTag: ''
    }

    await db.collection('article').add(data);
    res.render('article', {
      titleTag: '',
      metaDescription: '',
      openGraphImageURL: ''
    });
  }  

  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
    let article = doc.data();
    res.render('article', {
      titleTag: article.titleTag,
      metaDescription: article.metaDescription,
      openGraphImageURL: article.openGraphImageURL
    });
  });
});

router.get('/nepal', function(req, res, next) {
    res.render('india', {title: 'อินเดีย'});
  });
  
  router.get('/nepal/:slug', async function(req, res, next) {
    console.log(req);
    const articleRef = db.collection('article');
    const snapshot = await articleRef.where('pathname', '==', `${req.originalUrl}`).get();
    if (snapshot.empty) {
      let data = {
        content: '',
        headline: req.url.split('/')[1],
        metaDescription: '',
        openGraphImageURL: '',
        pathname: req.originalUrl,
        slug: req.url.split('/')[1],
        titleTag: ''
      }
  
      await db.collection('article').add(data);
      res.render('article', {
        titleTag: '',
        metaDescription: '',
        openGraphImageURL: ''
      });
    }  
  
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
      let article = doc.data();
      res.render('article', {
        titleTag: article.titleTag,
        metaDescription: article.metaDescription,
        openGraphImageURL: article.openGraphImageURL
      });
    });
  });




module.exports = router;
