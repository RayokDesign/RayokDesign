const express = require('express');
const router = express.Router();
/* Rayok ----- */
const db = require('../connections/firebase_admin_connect');
const moment = require('moment');
/* ----- Rayok */


router.get('/', async function(req, res) {
    let year = null;
    let month = null;
    let resultData = null;
    let seletedDate = null;

    if (req.query.YearMonth){
        seletedDate = req.query.YearMonth
        year = seletedDate.split('-')[0];
        month = seletedDate.split('-')[1];

        await getAll(db, year, month).then(data => {
            resultData = data;
        })
    } else {
        seletedDate = new Date();
        year = seletedDate.getFullYear().toString();
        month = (seletedDate.getMonth()+1).toString();
        seletedDate = year+'-'+month;
        await getAll(db, year, month).then(data => {
            resultData = data;
        })
    }
    let arrDay=[];
    for (var i in resultData){
        arrDay.push(i);
    }
    arrDay.sort();
    arrDay.reverse();
    const uid = req.session.uid;
    res.render('restaurant', {
        title:'restaurant',
        moment: moment,
        uid: uid,
        yearmonth: seletedDate,
        data: resultData,
        arrDay: arrDay
    });
});
async function getAll(db, year, month) {
  const recordsRef = db.collection('restaurant').doc(year).collection(month);
  const snapshot = await recordsRef.get();
  let data = {}
  snapshot.forEach(doc => {
    data[doc.id] = doc.data();
  });

  return data;
}

router.post('/', async function(req, res) {
    if (req.body.memo){
        console.log(req.body);
        await updateDocument(db, req.body);
        res.redirect('/restaurant');
    }else{
        await setDocument(db, req.body);
        res.redirect('/restaurant');
    }
});

async function setDocument(db, record) {
    const item = record.item;
    const date = record.date.split('-');
    let data = {};

    data[item] = record;
    if(data[item]['expin'] == '0'){
        data[item]['amount'] = parseInt('-' + data[item]['amount']);
    }
    delete data[item]['date'];
    delete data[item]['item'];
    delete data[item]['expin'];

    const res = await db.collection('restaurant').doc(date[0]).collection(date[1]).doc(date[2]).set(data, { merge: true });
}

async function updateDocument(db, req) {
  let memoDate = req.memoDate.split('-');
  const recordRef = db.collection('restaurant').doc(memoDate[0]).collection(memoDate[1]).doc(memoDate[2]);

  const res = await recordRef.update({memo: req.memo});
  // [END firestore_data_set_field]

  console.log('Update: ', res);
}

module.exports = router;
