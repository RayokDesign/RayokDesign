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
    // 當沒有任何紀錄時，刪除當天。
    // data = await dayRef.get();
    // let recordsEmptyCheck = Object.keys(data.data().records);
    // if (recordsEmptyCheck.length == 0){
    //     await dayRef.delete();
    // }
    res.redirect(`/restaurant?date=${deleteData[0]}-${deleteData[1]}`);
})
async function getRecords(db, year, month) {
    const daysRef = db.collection(`restaurant/${year}/months/${month}/days`);
    const snapshot = await daysRef.get();

    let data = {};
    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });
    return data;
}

router.post('/', async function(req, res) {
    await setDocument(db, req.body);
    res.redirect(`/restaurant?date=${req.query.date}`);
});

async function setDocument(db, data) {
    const date = data.date.split('-');
    const dayRef = db.doc(`restaurant/${date[0]}/months/${date[1]}/days/${date[2]}`);
    const doc = await dayRef.get();
    if (!doc.exists) {
        let record = `{
            "records": {
                "0": {
                    "category": "${data.category}",
                    "items": {
                        "0": {
                            "item": "${data.item}",
                            "amount": ${data.amount},
                            "expin": "${data.expin}"
                        }
                    }
                }
            },
            "categoryIndex": 0,
            "itemIndex": 0,
            "date": Timestamp.fromDate(new Date(data.date)),
        }`;
        await dayRef.set(eval('('+record+')'), {merge: true});
    } else {
        let docData = doc.data();
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
    console.log(index.data());
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

module.exports = router;