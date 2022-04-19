var express = require('express');
var router = express.Router();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = {
  "type": "service_account",
  "project_id": "thepudomdham-cb406",
  "private_key_id": "68672865b4cbef68d55be6045effcf76784dfd2b",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCnub03/EMfZ9gv\n8vHBcAsD5WdVdsjgBaRKrFScwn4mJO2VoSdZvt8Ufjb6NJyzfjTcJZJP3f5sz7/v\ni4i+RSad8xeHzpnNgYsIxlwcKINNFPULIKiqGPs9ZG7sjYqRbFiW0netFJQMEI7T\nd7Iz5MggsMrhEoIHjYIOy/c4TrXIo5S9fechWoK9UtM9nU2yh/sBUWQrpkN7rq5J\n6vGJr/DJI1L0nNXgm1jCYfGoL7DQNg7PDDqCFHGUecOOTkUt0YCbZ6NrOK/gwwL/\n0qawFAHiPRwcltUkeFQfWVKU8M3iPM53hasjJ0sik8gu6ot1v4Be0aG69Itu5MuH\nvpZHvUeRAgMBAAECggEAAjKSIsRQsiik0dFXuYvDmS7Nm8u39gzHikhCaOC40RHK\nyxsWw5Dspf1sBaXgJ7nk7L178pqbVXGjYiVsipGoCom/f9gFITGBUNbIfitJt8jT\n18F7HuoU4J5gQFkvvO1ee8YQ1gO0V4l1VZqhNcIu8mlelHRZn8pgLzFyRm/sPHoN\nZCUOJTTzCOtn26+Cdt3w9fnDP7Zh+/LNFUcIWXeGpxdTShhrbFy+llY+yE22EbzF\nYZ3m8ATfAiKp71pPe8jgPstWv8Pai/RKUBsVikPUypv3GJxxQL56ilkCFUxXRVvw\npG+VOh1m9pzMczjLFkClnxfOS0/zpzb0TwlQ8XGdAQKBgQDsQU7b8zU77bXYnegq\nPYdGJGIWtwcwtM5qWi2xxio12/5YJSIjgcJyAj7LRBUYNgXtdsIUfmqMcH3zYJWN\nFT3DHSKy8HnnDmqfWOQFaHoeldddXZwbHuO2zvaJ9KIQ+XPAviHlwcazlzMcJJpu\nwRYEqx1LhuH+NjEH+vNi7W3W/QKBgQC1vjyr5auQltX9R6XKGj+QtsGe52oYcS0T\naol8CYWxzFsgjGLKYsW8fYEHBb7bjJ7m/kRrAbus/VLZHiUwtq5dZI4FBRmGGKed\nLHp2V+NP4zpOE8msjNDaSPe5OwNwFFmM0SxrCSPZIU/bvG08yprQDYPS44CTCQSa\nAyqcROCZJQKBgQDDPQk9TRRuDPidJYlp9uTme0SwPtrrTk/SpeljIz9YuQ/Mqgs3\nSpF1BBP+iKniEyr83YpvwzSsEH6VdPjB2Y7rwhUdyQsEfe5w9tWg/oEE65FJsAVE\niFdoiEpHIWoZGvykiLucknFxkn8DP+B7rIdUnlAcTUBPg1srnCAsXcfKxQKBgDD8\nFV4/iP5vqT2bEhRm/rsChy1NMktkNcIF9Qh5iI9jhSxAql/iP2mOajh6U/bY7/tS\njR5KWUtG/A2JEn0Ov/BsKdswhLCf9I1ob5l2Fs5xcEWbD8ByM9ih0iMaxNJwqbJK\nrq4qyH69e8i+ALNh6FgrTFyK9RysUZExSUrVRbQBAoGBANzC/7p1wQY7ZkCXM4+B\n/Hsuq5lHc5oqsM6jkJAvLzmZUQjj4D/zzYHpvYAXr9Z7J55LA5Z+t1460m+Qsw20\niFZxFmHGOT03Gh5fJ3rHm+qbvCnbtuPbOX6QV+jt3AFgZnroluxatoKsoJhCYqgr\n5k3QrKTqAeI07FcaCr/IYoLZ\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-feh61@thepudomdham-cb406.iam.gserviceaccount.com",
  "client_id": "103926296641926726237",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-feh61%40thepudomdham-cb406.iam.gserviceaccount.com"
};

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
