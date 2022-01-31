'use strict';


import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getPerformance } from 'firebase/performance';
import { getFirebaseConfig } from './firebase-config.js';
import moment from 'moment';

let categoryAmount = {}, dayAmount = {}
let items = {}, categories = {}, submitData = {}, unsubscribes = {};
let categoryMonthAmount = {}, itemMonthAmount = {};
let timer = null;

async function signIn(e) {
    // var provider = new GoogleAuthProvider();
    // await signInWithPopup(getAuth(), provider);
  e.preventDefault();
  const email = emailInputElement.value;
  const password = passwordInputElement.value;
  await signInWithEmailAndPassword(getAuth(), email, password)
  .then(async (userCredential) => {
      // Signed in
      console.log(userCredential);
      signInModalElement.querySelector('.btn-close').click();
  })
  .catch((error) => {
      const errorCode = error.code;
      switch (errorCode){
          case 'auth/invalid-email':
              req.session.error = '您的信箱格式輸入錯誤';
              res.redirect('/member/signin');
              break;
          case 'auth/user-disabled':
              req.session.error = '您的帳號目前停用，請聯絡管理員';
              res.redirect('/member/signin');
              break;
          case 'auth/user-not-found':
              req.session.error = '您的信箱尚未註冊';
              res.redirect('/member/signin');
              break;
          case 'auth/wrong-password':
              req.session.error = '您的密碼輸入錯誤';
              res.redirect('/member/signin');
              break;
      }
  });
}

// Signs-out of Friendly Chat.
function signOutUser() {
  // TODO 2: Sign out of Firebase.
  signOut(getAuth());
  document.getElementsByTagName('section')[0].textContent = '';
  for (let unsubscribe in unsubscribes){
    unsubscribes[unsubscribe]();
  }
}

// Returns the signed-in user's display name.
function getUserName() {
  // TODO 5: Return the user's display name.
  return getAuth().currentUser.displayName;
}

// Enables or disables the submit button depending on the values of the input
// fields.
function toggleButton() {
  if (messageInputElement.value) {
    submitButtonElement.removeAttribute('disabled');
  } else {
    submitButtonElement.setAttribute('disabled', 'true');
  }
}

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  SignInToastElement.children[0].innerHTML = "You must sign-in first"
  let toast = new bootstrap.Toast(SignInToastElement);
  toast.show();
  return false;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  // TODO 6: Return true if a user is signed-in.
  return !!getAuth().currentUser;
}

// Initiate firebase auth
function initFirebaseAuth() {
  // TODO 3: Subscribe to the user's signed-in status
  onAuthStateChanged(getAuth(), authStateObserver);
}
// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {
        
    loadCategoriesList();
    loadItemsList();
    monthSelector();

    signOutButtonElement.classList.remove('d-none');
    // Hide sign-in button.
    signInButtonElement.classList.add('d-none');

  } else {
    signOutButtonElement.classList.add('d-none');
    // Show sign-in button.
    signInButtonElement.classList.remove('d-none');
  }
}

// Loads chat messages history and listens for upcoming ones.
function loadRecords(year, month, day) {
  // TODO 8: Load and listen for new messages.
  const recentRecordsQuery = query(collection(getFirestore(), 'restaurant', year, 'months', month, 'days', day, 'records'), orderBy('timestamp', 'desc'));
  
  // Start listening to the query.
  unsubscribes[`${year}${month}${day}`] = onSnapshot(recentRecordsQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteRecord(change.doc.id, change.doc.data());
      } else {
        // getDetailData(`${year}-${month}-${day}`, change.doc.data());
        displayRecord(`${year}-${month}-${day}`, change.doc.data(), change.doc.id);
      }
    }, function(error){
      console.error(error);
    });
  });
}

// // Loads chat messages history and listens for upcoming ones.
// function getDetailData(date, itemData) {
//   if (itemData.expin == 'income'){
//     typeof(dayAmount[date]) == 'undefined' ? dayAmount[date] = itemData.amount : dayAmount[date] += itemData.amount;
//     typeof(categoryAmount[`${itemData.category}${date}`]) == 'undefined' ? categoryAmount[`${itemData.category}${date}`] = itemData.amount : categoryAmount[`${itemData.category}${date}`] += itemData.amount;
//   } else {
//     typeof(dayAmount[date]) == 'undefined' ? dayAmount[date] = -itemData.amount : dayAmount[date] -= itemData.amount;
//     typeof(categoryAmount[`${itemData.category}${date}`]) == 'undefined' ? categoryAmount[`${itemData.category}${date}`] = -itemData.amount : categoryAmount[`${itemData.category}${date}`] -= itemData.amount;
//   }
// }

// Template for messages.
var MESSAGE_TEMPLATE =
`<div class="mb-3">
  <div class="row mb-2 fs-5">
    <div class="col record-date text-info"></div>
    <div class="col day-amount text-end"></div>
  </div>
  <div class="row">
    <div class="col">
      <div class="accordion accordion-flush"></div>
    </div>
  </div>
</div>`;

function createAndInsertMessage(id) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const table = container.firstChild;
  table.setAttribute('id', 'date' + id);

  recordListElement.appendChild(table);

  return table;
}

var CATEGORY_TEMPLATE =
`<div class="accordion-item mb-3">
  <div class="btn accordion-header d-flex justify-content-between"  data-bs-toggle="collapse">
    <span class="category-name"></span>
    <span class="category-amount align-self-center"></span>
  </div>
  <div class="accordion-collapse collapse">
    <div class="accordion-body p-0">
    </div>
  </div>
</div>`;

function createAndInsertCategory(id, itemData) {
  const container = document.createElement('div');
  container.innerHTML = CATEGORY_TEMPLATE;
  const category = container.firstChild;
  category.querySelector('.collapse').setAttribute('id', `category${itemData.category}${id}`);

  recordListElement.querySelector('#date'+ id).querySelector('.accordion').appendChild(category);

  return document.getElementById('category'+itemData.category+id);
}


var ITEM_TEMPLATE = 
`<div class="btn item d-flex justify-content-between" data-bs-toggle="modal" data-bs-target="#add-record-modal">
  <span class="item-name"></span>
  <span class="item-amount align-self-center"></span>
</div>`;

function createAndInsertItem(id, itemData, docID) {
  const container = document.createElement('div');
  container.innerHTML = ITEM_TEMPLATE;
  const item = container.firstChild;
  item.addEventListener('click', modalModeSwitch);
  item.setAttribute('id', 'item'+docID);


  recordListElement.querySelector(`#category${itemData.category}${id}`).querySelector('.accordion-body').appendChild(item);

  return item;
}

var MEMO_TEMPLATE = 
`<div class="row">
  <div class="col memo">
    <textarea rows="2" class="form-control" placeholder="Write memo here..."></textarea>
  </div>
</div>`;

async function createAndInsertMemo(date) {
  const container = document.createElement('div');
  container.innerHTML = MEMO_TEMPLATE;
  const memo = container.firstChild;
  memo.setAttribute('id', `memo${date}`);
  memo.querySelector('textarea').setAttribute('data-date', date);
  memo.querySelector('textarea').addEventListener('input', updateMemo);
  recordListElement.querySelector('#date'+ date).appendChild(memo);
  const arrDate = moment(date).format('YYYY-MM-DD').split('-');
  const memoRef = doc(getFirestore(), 'restaurant', arrDate[0], 'months', arrDate[1], 'days', arrDate[2]);
  const memoSnap = await getDoc(memoRef);
  
  memo.querySelector('textarea').value = memoSnap.data().memo || '';

  return memo;
}

function updateMemo(){
  const memoElement = this;
  const date = moment(this.getAttribute('data-date')).format('YYYY-MM-DD').split('-');
  const dateRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2]);
  clearTimeout(timer);
  timer = setTimeout(function(){
    setDoc(dateRef, { memo: memoElement.value }, { merge: true });
  },2000)
}

var CATEGORY_MONTH_AMOUNT_TEMPLATE = 
`<div class="row justify-content-between">
<div class="col category-name"></div>
<div class="col category-amount text-end"></div>
</div>`;

function createAndInsertCategoryMonthAmount(name, amount){
  const container = document.createElement('div');
  container.innerHTML = CATEGORY_MONTH_AMOUNT_TEMPLATE;
  const category = container.firstChild;
  category.querySelector('.category-name').textContent = name;
  category.querySelector('.category-amount').textContent = amountFormat(amount);
  if (amount > 0){
    category.querySelector('.category-amount').classList.add('text-primary');
  } else if (amount < 0) {
    category.querySelector('.category-amount').classList.add('text-danger');
  }
  categoryMonthAmountElement.appendChild(category);
}

var ITEM_MONTH_AMOUNT_TEMPLATE = 
`<div class="row justify-content-between">
<div class="col item-name"></div>
<div class="col item-amount text-end"></div>
</div>`;

function createAndInsertItemMonthAmount(name, amount){
  const container = document.createElement('div');
  container.innerHTML = ITEM_MONTH_AMOUNT_TEMPLATE;
  const item = container.firstChild;
  item.querySelector('.item-name').textContent = name;
  item.querySelector('.item-amount').textContent = amountFormat(amount);
  if (amount > 0){
    item.querySelector('.item-amount').classList.add('text-primary');
  } else if (amount < 0) {
    item.querySelector('.item-amount').classList.add('text-danger');
  }
  itemMonthAmountElement.appendChild(item);
}
// Displays a Message in the UI.
function displayRecord(id, itemData, docID) {
  const div = document.getElementById('date' + id) || createAndInsertMessage(id);
  const category = document.getElementById(`category${itemData.category}${id}`) || createAndInsertCategory(id, itemData);
  const item = document.getElementById('item'+docID) || createAndInsertItem(id, itemData, docID);
  document.getElementById(`memo${id}`) || createAndInsertMemo(id);

  div.querySelector('.record-date').textContent = moment(id).format('DD dddd YYYY MMMM');
  category.parentNode.querySelector('.accordion-header').setAttribute('data-bs-target', '#category'+itemData.category+id);
  category.parentNode.querySelector('.category-name').textContent = categories[itemData.category];
  item.querySelector('.item-name').textContent = items[itemData.item];
  item.querySelector('.item-amount').textContent = amountFormat(itemData.amount);
  item.setAttribute('data-amount', itemData.amount);
  item.setAttribute('data-expin', itemData.expin);
  item.setAttribute('data-category', itemData.category);
  item.setAttribute('data-item', itemData.item);
  item.setAttribute('data-date', itemData.date);
  item.setAttribute('data-id', docID);
  
  if (itemData.expin == "expense"){
    item.querySelector('.item-amount').setAttribute('data-amount', -itemData.amount);
  } else {
    item.querySelector('.item-amount').setAttribute('data-amount', itemData.amount);
  }
  
  categoryAmount['category'+itemData.category+id] = 0;
  let aItemAmount = category.getElementsByClassName('item-amount');
  for (let i = 0; i < aItemAmount.length; i++){
    categoryAmount['category'+itemData.category+id] += parseInt(aItemAmount[i].getAttribute('data-amount'));
  }
  category.previousElementSibling.querySelector('.category-amount').setAttribute('data-amount', categoryAmount['category'+itemData.category+id]);
  category.previousElementSibling.querySelector('.category-amount').textContent = amountFormat(categoryAmount['category'+itemData.category+id]);

  dayAmount['date'+id] = 0;
  let aCategoryAmount = div.getElementsByClassName('category-amount');
  for (let i = 0; i < aCategoryAmount.length; i++){
    dayAmount['date'+id] += parseInt(aCategoryAmount[i].getAttribute('data-amount'));
  }
  div.querySelector('.day-amount').setAttribute('data-amount', dayAmount['date'+id]);
  div.querySelector('.day-amount').textContent = amountFormat(dayAmount['date'+id]);

  for (let key in categoryMonthAmount){
    categoryMonthAmount[key] = 0;
  }
  let allCategoryAmount = document.getElementById('records').getElementsByClassName('category-name');
  for (let i = 0; i < allCategoryAmount.length; i++){
    categoryMonthAmount[allCategoryAmount[i].textContent] += parseInt(allCategoryAmount[i].nextElementSibling.getAttribute('data-amount'));
  }
  
  categoryMonthAmountElement.textContent = '';
  for (let i in categoryMonthAmount){
    createAndInsertCategoryMonthAmount(i, categoryMonthAmount[i]);
  }
  
  for (let key in itemMonthAmount){
    itemMonthAmount[key] = 0;
  }
  let allItemAmount = document.getElementById('records').getElementsByClassName('item-name');
  for (let i = 0; i < allItemAmount.length; i++){
    itemMonthAmount[allItemAmount[i].textContent] += parseInt(allItemAmount[i].nextElementSibling.getAttribute('data-amount'));
  }
  
  itemMonthAmountElement.textContent = '';
  for (let i in itemMonthAmount){
    createAndInsertItemMonthAmount(i, itemMonthAmount[i]);
  }
  

  if (parseInt(item.querySelector('.item-amount').getAttribute('data-amount')) > 0 ){
    item.querySelector('.item-amount').classList.remove('text-danger');
    item.querySelector('.item-amount').classList.add('text-primary');
  } else {
    item.querySelector('.item-amount').classList.remove('text-primary');
    item.querySelector('.item-amount').classList.add('text-danger');
  }
  if (parseInt(div.querySelector('.day-amount').getAttribute('data-amount')) > 0 ){
    div.querySelector('.day-amount').classList.remove('text-danger');
    div.querySelector('.day-amount').classList.add('text-primary');
  } else {
    div.querySelector('.day-amount').classList.remove('text-primary');
    div.querySelector('.day-amount').classList.add('text-danger');
  }
}

// Delete a Message from the UI.
function deleteRecord(docID, itemData) {
  let item = document.getElementById('item'+docID);
  let accordionBody = item.parentNode;
  let div = document.getElementById('date'+itemData.date);
  console.log(div);
  let category = div.querySelector(`#category${itemData.category}${itemData.date}`);
  // If an element for that message exists we delete it.
  if (item) {
    accordionBody.removeChild(item);
  }

  if (accordionBody.children.length == 0){
    category.parentNode.parentNode.removeChild(category.parentNode);
  } else {
    categoryAmount['category'+itemData.category+itemData.date] = 0;
    let aItemAmount = category.getElementsByClassName('item-amount');
    for (let i = 0; i < aItemAmount.length; i++){
      categoryAmount['category'+itemData.category+itemData.date] += parseInt(aItemAmount[i].getAttribute('data-amount'));
    }
    category.previousElementSibling.querySelector('.category-amount').setAttribute('data-amount', categoryAmount['category'+itemData.category+itemData.date]);
    category.previousElementSibling.querySelector('.category-amount').textContent = amountFormat(categoryAmount['category'+itemData.category+itemData.date]);
  }

  if (div.querySelector('.accordion').children.length == 0){
    div.parentNode.removeChild(div);
  } else {
    dayAmount['date'+itemData.date] = 0;
    let aCategoryAmount = div.getElementsByClassName('category-amount');
    for (let i = 0; i < aCategoryAmount.length; i++){
      dayAmount['date'+itemData.date] += parseInt(aCategoryAmount[i].getAttribute('data-amount'));
    }
    div.querySelector('.day-amount').setAttribute('data-amount', dayAmount['date'+itemData.date]);
    div.querySelector('.day-amount').textContent = amountFormat(dayAmount['date'+itemData.date]);
  }
}

function amountFormat(amount) {
  return `${new Intl.NumberFormat().format(amount)} ฿`;
}

function showToast(){
  var toastLiveExample = document.getElementById('liveToast')
  if (toastTriggerElement) {
    toastTriggerElement.addEventListener('click', function () {
      var toast = new bootstrap.Toast(toastLiveExample)
  
      toast.show()
    })
  }
}

function loadCategoriesList() {
    // TODO 8: Load and listen for new messages.
    const recentRecordsQuery = query(collection(getFirestore(), 'categories'), orderBy('index'));
  
    // Start listening to the query.
    unsubscribes['category'] = onSnapshot(recentRecordsQuery, function(snapshot) {
      snapshot.docChanges().forEach(function(change) {
        if (change.type === 'removed') {
          deleteRecord(change.doc.id, change.doc.data());
        } else {
          categories[change.doc.id] = change.doc.data().name;
          categoryMonthAmount[change.doc.data().name] = 0;
          createAndInsertCategoryOption(change.doc.id, change.doc.data());
        }
      }, function(error){
        console.error(error);
      });
    });
}

var OPTION_TEMPLATE = 
`<option></option>`;

function createAndInsertCategoryOption(id, itemData) {
  const container = document.createElement('div');
  container.innerHTML = OPTION_TEMPLATE;
  const option = container.firstChild;
  option.setAttribute('value', id);
  option.textContent = itemData.name;

  categorySelectElement.appendChild(option);
}

function loadItemsList() {
  // TODO 8: Load and listen for new messages.
  const recentRecordsQuery = query(collection(getFirestore(), 'items'), orderBy('index'));

  // Start listening to the query.
  unsubscribes['item'] = onSnapshot(recentRecordsQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteRecord(change.doc.id, change.doc.data());
      } else {
        items[change.doc.id] = change.doc.data().name;
        itemMonthAmount[change.doc.data().name] = 0;
        createAndInsertItemOption(change.doc.id, change.doc.data());
      }
    }, function(error){
      console.error(error);
    });
  });
}

function createAndInsertItemOption(id, itemData) {
  const container = document.createElement('div');
  container.innerHTML = OPTION_TEMPLATE;
  const option = container.firstChild;
  option.setAttribute('value', id);
  option.textContent = itemData.name;
  if (itemData.expin == 'income'){
    option.classList.add('income');
    option.classList.add('d-none');
  } else {
    option.classList.add('expense');
  }

  itemSelectElement.appendChild(option);
}

// Triggered when the send new message form is submitted.
function onRecordFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (amountInputElement.value && checkSignedInWithMessage()) {
    submitData['amount'] = amountInputElement.value;
    submitData['date'] = dateSelectorElement.value;
    submitData['timestamp'] = serverTimestamp();
    expenseRadioElement.checked == true ? submitData['expin'] = 'expense' : submitData['expin'] = 'income';
    saveMessage(submitData);
    dismissButtonElement.click();
  }
}

function toggleExpin() {
  itemSelectElement.value = '';
  const expenseOptions = document.getElementsByClassName('expense');
  const incomeOptions = document.getElementsByClassName('income');

  for (let i = 0; i < incomeOptions.length; i++){
    incomeOptions[i].classList.toggle('d-none');
  }
  for (let i = 0; i < expenseOptions.length; i++){
    expenseOptions[i].classList.toggle('d-none');
  }
}
//Load date from date
async function monthSelector() {
  let date = moment(new Date()).format('YYYY-MM-DD').split('-');
  let days = getDaysInMonth(date[0], date[1]);
  monthSelectorElement.setAttribute('value', date[0]+'-'+date[1]);
  dateSelectorElement.setAttribute('value', date[0]+'-'+date[1]+'-'+date[2]);

  for (let day=days; day > 0; day--){
    if (day<10){day='0'+day}
    await loadRecords(date[0], date[1], `${day}`);
  }
}

// Saves a new message on the Cloud Firestore.
async function saveMessage(messageText) {
  const date = moment(messageText.timestamp).format('YYYY-MM-DD').split('-');
  const recordsRef = collection(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'records');
  
  // TODO 7: Push a new message to Cloud Firestore.
  try {
    await addDoc(recordsRef, messageText);
  }
  catch(error) {
    console.error('Error writing new message to Firebase Database', error);
  }
}

function selectChange(){
  submitData[this.name] = this.value;
}

function getDaysInMonth (year, month){
  return new Date(year, month, 0).getDate();
}

function focusInput(){
  amountInputElement.focus();
}

function modalModeSwitch(){
  if (this.id == 'add-record-button'){
    deleteButtonElement.classList.add('d-none');
    modifyButtonElement.classList.add('d-none');
    dismissButtonElement.classList.remove('d-none');
    submitButtonElement.classList.remove('d-none');
    modifyButtonElement.setAttribute('disabled', 'true');
    submitButtonElement.removeAttribute('disabled');
  } else {
    deleteButtonElement.classList.remove('d-none');
    modifyButtonElement.classList.remove('d-none');
    dismissButtonElement.classList.add('d-none');
    submitButtonElement.classList.add('d-none');
    modifyButtonElement.removeAttribute('disabled');
    submitButtonElement.setAttribute('disabled', 'true');
    amountInputElement.value = this.getAttribute('data-amount');
    expinRadioElement.querySelector(`#${this.getAttribute('data-expin')}-radio`).checked = true;
    categorySelectElement.value = this.getAttribute("data-category");
    itemSelectElement.value = this.getAttribute("data-item");
    modifyButtonElement.setAttribute('data-date', this.getAttribute('data-date'));
    deleteButtonElement.setAttribute('data-date', this.getAttribute('data-date'))
    modifyButtonElement.setAttribute('data-id', this.getAttribute('data-id'));
    deleteButtonElement.setAttribute('data-id', this.getAttribute('data-id'));
  }
}

function cleanModal(){
  amountInputElement.value = '';
  expenseRadioElement.setAttribute('checked', 'true');
  categorySelectElement.value = '';
  itemSelectElement.value = '';;
}

async function modifyItemData(e){
  e.preventDefault();
  const date = this.getAttribute('data-date').split('-');
  const itemRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'records', this.getAttribute('data-id'));
  const itemData = {
    amount: parseInt(amountInputElement.value),
    expin: expenseRadioElement.checked == true ? 'expense' : 'income',
    category: categorySelectElement.value,
    item: itemSelectElement.value
  }
  dismissButtonElement.click();
  await updateDoc(itemRef, itemData);
}

async function deleteItem(e){
  e.preventDefault();
  const date = this.getAttribute('data-date').split('-');
  const itemRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'records', this.getAttribute('data-id'));

  dismissButtonElement.click();
  await deleteDoc(itemRef);
}

// Shortcuts to DOM Elements.
var recordListElement = document.getElementById('records');
var signInButtonElement = document.getElementById('sign-in');
var monthSelectorElement = document.getElementById('month-selector');
var signOutButtonElement = document.getElementById('sign-out');
var signInToastElement = document.getElementById('must-signin-toast')
var categorySelectElement = document.getElementById('category-select');
var itemSelectElement = document.getElementById('item-select');
var expenseRadioElement = document.getElementById('expense-radio');
var incomeRadioElement = document.getElementById('income-radio');
var dateSelectorElement = document.getElementById('date-selector');
var amountInputElement = document.getElementById('amount-input');
var addRecordButtonElement = document.getElementById('add-record-button');
var addRecordModalElement = document.getElementById('add-record-modal');
var dismissButtonElement = document.getElementById('dismiss-button');
var submitButtonElement = document.getElementById('submit-button');
var deleteButtonElement = document.getElementById('delete-button');
var modifyButtonElement = document.getElementById('modify-button');
var expinRadioElement = document.getElementById('expin-radio');
var signInModalElement = document.getElementById('sign-in-modal');
var emailInputElement = document.getElementById('email-input');
var passwordInputElement = document.getElementById('password-input');
var categoryMonthAmountElement = document.getElementById('category-month-amount');
var itemMonthAmountElement = document.getElementById('item-month-amount');

// Saves message on form submit.
addRecordModalElement.addEventListener('submit', onRecordFormSubmit);
signInModalElement.addEventListener('submit', signIn);
categorySelectElement.addEventListener('change', selectChange);
itemSelectElement.addEventListener('change', selectChange);
signOutButtonElement.addEventListener('click', signOutUser);
//signInButtonElement.addEventListener('click', signIn);
addRecordModalElement.addEventListener('shown.bs.modal', focusInput);
addRecordModalElement.addEventListener('hidden.bs.modal', cleanModal);
addRecordButtonElement.addEventListener('click', modalModeSwitch);
modifyButtonElement.addEventListener('click', modifyItemData);
deleteButtonElement.addEventListener('click', deleteItem);
//Radio button
expenseRadioElement.addEventListener('change', toggleExpin);
incomeRadioElement.addEventListener('change', toggleExpin);

//Show this month
monthSelectorElement.value = moment(new Date()).format('YYYY-MM')
//Show Toast
signInToastElement.addEventListener('click', showToast); 

const config = {
  apiKey: "AIzaSyCZHCKSZnH9WE5QkrGhtApo92NXe8tzNLY",
  authDomain: "rayoktailand.firebaseapp.com",
  projectId: "rayoktailand",
  storageBucket: "rayoktailand.appspot.com",
  messagingSenderId: "899005250836",
  appId: "1:899005250836:web:6274621a59d56e3be99601",
  measurementId: "G-4T12BRNEP7"
};

initializeApp(config);
initFirebaseAuth();