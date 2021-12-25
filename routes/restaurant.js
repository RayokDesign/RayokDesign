const express = require('express');
const router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
const moment = require('moment');
const { getFirestore, Timestamp, FieldValue, FieldPath } = require('firebase-admin/firestore');
/* ----- Rayok */


router.get('/', async function(req, res) {
    let date = new Date();
    if (req.query.date){
        date = (req.query.date).split('-');
    } else {
        date = [date.getFullYear(), date.getMonth()+1];
    }
    const data = await getRecords(db, date[0], date[1]);
    const uid = req.session.uid;
    const categories = await getCategories(db);
    
    res.render('restaurant', {
        title:'restaurant',
        moment: moment,
        uid: uid,
        categories: categories,
        date: date,
        data: data
    });
});

async function getRecords(db, year, month) {
    const daysRef = db.collection(`restaurant/${year}/months/${month}/days`);
    const snapshot = await daysRef.orderBy("time", "desc").get();

    let data = {};
    snapshot.forEach(doc => {
        // if (Object.keys(doc.data().records).length != 0){
        //     data[record.id] = data.data();
        // }
        data[doc.id] = doc.data();
    });
    console.log(data);
    return data;
}

router.post('/', async function(req, res) {
    await setDocument(db, req.body);
    res.redirect('/restaurant');
});

async function setDocument(db, data) {
    const date = data.date.split('-');
    const dayRef = db.doc(`restaurant/${date[0]}/months/${date[1]}/days/${date[2]}`);
    const time = new Date().getTime();

    let record = `{
        "records.${data.category}.${data.item}.amount": ${data.amount},
        "records.${data.category}.${data.item}.expin": "${data.expin}"
    }`;
    console.log(record);
    await dayRef.set({
        time: new Date(date[0], date[1]-1, date[2]).getTime()
    }, { merge: true });
    await dayRef.update(eval('('+record+')'));
}

async function updateDocument(db, req) {
  let memoDate = req.memoDate.split('-');
  const recordRef = db.collection('restaurant').doc(memoDate[0]).collection(memoDate[1]).doc(memoDate[2]);

  await recordRef.update({memo: req.memo});
}

router.get('/delete/:id', async function(req, res) {
    const id = (req.params.id).split('-');
    await deleteRecord(db, id);
    res.redirect('/restaurant');
});
async function deleteRecord(db, id) {
    const recordRef = db.doc(`restaurant/${id[0]}/months/${id[1]}/days/${id[2]}`);

    let data = `{
        "records.${id[3]}" : FieldValue.delete()
    }`;

    await recordRef.update(eval('('+data+')'));
}

router.get('/categories', async function(req, res) {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.orderBy('time').get();
    let data = {}
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    res.render('categories', {
        title: 'categories',
        data: data,
    })
});
async function getCategories(db) {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.orderBy('time').get();
    let categories = {}
    snapshot.forEach(doc => {
      categories[doc.id] = doc.data();
    });
    return categories;
}

router.post('/categories', async function(req, res) {
    const categoriesRef = db.collection('categories');
    await categoriesRef.add({
        name: req.body.name,
        time: new Date()
    })
    res.redirect('/restaurant/categories');
});

router.get('/categories/delete/:id', async function(req, res) {
    const id = req.params.id;
    await db.doc(`categories/${id}`).delete();
    res.redirect('/restaurant/categories');
});

module.exports = router;