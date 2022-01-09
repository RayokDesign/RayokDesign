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
        date = (moment(date).format('YYYY-MM')).split('-');
    }
    const data = await getRecords(db, date[0], date[1]);
    const uid = req.session.uid;
    const categories = await getCategories(db);
    const items = await getItems(db);

    res.render('restaurant', {
        title:'restaurant',
        moment: moment,
        uid: uid,
        categories: categories,
        items: items,
        date: date,
        data: data
    });
});

async function getRecords(db, year, month) {
    //檢查本月是否有資料
    const firstDayRef = db.doc(`restaurant/${year}/months/${month}/days/01`);
    const firstDayDoc = await firstDayRef.get();
    
    if (!firstDayDoc.exists){
        const daysInMonth = getDaysInMonth(year,month);
        const batch = db.batch();

        for (let day=1; day<=daysInMonth; day++){
            if(day<10){day=`0${day}`}
            batch.set(db.doc(`restaurant/${year}/months/${month}/days/${day}`), {
                records: {},
                memo: '',
                categoryIndex: 0,
                itemIndex: 0,
                timestamp: Timestamp.fromDate(new Date(`${year}-${month}-${day}`))
            })
        }
        await batch.commit();
    }
    //無資料則新增當月天數的資料夾

    const daysRef = db.collection(`restaurant/${year}/months/${month}/days`);
    const snapshot = await daysRef.orderBy('timestamp').get();

    let data = {};
    snapshot.forEach(doc => {
        data[parseInt(doc.id)] = doc.data();
    });
    return data;
}

router.post('/', async function(req, res) {
    await setDocument(db, req.body);
    await res.redirect(`/restaurant?date=${req.query.date}`)
});

async function setDocument(db, data) {
    const date = data.date.split('-');

    //新增資料到資料夾

    let dayRef = db.doc(`restaurant/${date[0]}/months/${date[1]}/days/${date[2]}`);
    let dayDoc = await dayRef.get();
    let docData = dayDoc.data();
    let haveCategory = false;
    let categoryIndex = null;

    for (index in docData.records){
        if (docData.records[index].category == data.category){
            haveCategory = true;
            categoryIndex = index;
        }
    }
    if (haveCategory != true){
        docData.categoryIndex += 1;
        categoryIndex = docData.categoryIndex;
    }
    docData.itemIndex += 1;
    let record = `{
        "records.${categoryIndex}.category": "${data.category}",
        "records.${categoryIndex}.items.${docData.itemIndex}": {
            "item": "${data.item}",
            "amount": ${data.amount},
            "expin": "${data.expin}"
        },
        "categoryIndex": ${docData.categoryIndex},
        "itemIndex": ${docData.itemIndex}
    }`;
    await dayRef.update(eval('('+record+')'));
}
router.get('/deleteitem', async function(req, res){
    let deleteData= req.query.deleteitem.split('-');
    let dayRef = db.doc(`restaurant/${deleteData[0]}/months/${deleteData[1]}/days/${deleteData[2]}`);
    let deleteItemJson = `{
        "records.${deleteData[3]}.items.${deleteData[4]}": FieldValue.delete() 
    }`
    await dayRef.update(eval('('+deleteItemJson+')'));
    
    let data = await dayRef.get();
    let itemsEmptyCheck = Object.keys(data.data().records[deleteData[3]].items);
    let deleteCategoryJson = `{
        "records.${deleteData[3]}": FieldValue.delete() 
    }`
    if (itemsEmptyCheck.length == 0){
        await dayRef.update(eval('('+deleteCategoryJson+')'));
    }

    res.redirect(`/restaurant?date=${deleteData[0]}-${deleteData[1]}`);
})
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

router.get('/manage', async function(req, res) {
    const categoriesRef = db.collection('categories');
    const itemsRef = db.collection('items');
    const categoriesSnapshot = await categoriesRef.orderBy('index').get();
    const itemsSnapshot = await itemsRef.orderBy('index').get();
    let categoriesData = {}, itemsData = {}
    categoriesSnapshot.forEach(categoryDoc => {
        categoriesData[categoryDoc.id] = categoryDoc.data();
    });
    itemsSnapshot.forEach(itemDoc => {
        itemsData[itemDoc.id] = itemDoc.data();
    });
    res.render('manage', {
        title: 'manage',
        categories: categoriesData,
        items: itemsData
    })
});
async function getCategories(db) {
    const categoriesRef = db.collection('categories');
    const snapshot = await categoriesRef.orderBy('index').get();
    let categories = {}
    snapshot.forEach(doc => {
      categories[doc.id] = doc.data();
    });
    return categories;
}
async function getItems(db) {
    const categoriesRef = db.collection('items');
    const snapshot = await categoriesRef.orderBy('index').get();
    let categories = {}
    snapshot.forEach(doc => {
      categories[doc.id] = doc.data();
    });
    return categories;
}

router.get('/addoption', async function(req, res) {
    let indexRef = db.doc(`${req.query.col}/index`);
    let index = await indexRef.get();
    await indexRef.update({
        counter: FieldValue.increment(1)
    })
    let dataRef = db.collection(`${req.query.col}`);
    let addData = `{
        index: ${index.data().counter},
        name: "${req.query.name}"
    }`
    await dataRef.add(eval('('+addData+')'));
    res.end();
})

router.get('/editoption', async function(req, res) {
    let dataRef = db.doc(`${req.query.col}/${req.query.doc}`);
    let updateData = `{
        name: "${req.query.name}"
    }`
    await dataRef.update(eval('('+updateData+')'));
    res.end();
})

router.get('/updatememo', async function(req, res) {
    let date = (moment.unix(req.query.timestamp).format('YYYY-MM-DD').split('-'));
    let dayRef = db.doc(`restaurant/${date[0]}/months/${date[1]}/days/${date[2]}`);

    await dayRef.update({
        memo: req.query.memo
    })
    res.end();
})

function getDaysInMonth (year, month){
    return new Date(year, month, 0).getDate();
}


module.exports = router;