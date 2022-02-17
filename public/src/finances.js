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

let items = {}, categories = {}, submitData = {}, unsubscribes = {};
let itemMonthAmount ={}, categoryMonthAmount = {};
let timer = null;

function signIn(e) {
  e.preventDefault();
  const email = signInModalElement.querySelector('#sign-in-email-input').value;
  const password = signInModalElement.querySelector('#sign-in-password-input').value;
  signInWithEmailAndPassword(getAuth(), email, password)
  .then((userCredential) => {
      // Signed in
      signInModalElement.querySelector('.btn-close').click();
  })
  .catch((error) => {
    const errorCode = error.code;
    switch (errorCode){
      case 'auth/invalid-email':
        promptToastElement.children[0].innerHTML = "您的信箱格式輸入錯誤";
        promptToast.show();
        break;
      case 'auth/user-disabled':
        promptToastElement.children[0].innerHTML = "您的帳號目前停用，請聯絡管理員";
        promptToast.show();
        break;
      case 'auth/user-not-found':
        promptToastElement.children[0].innerHTML = "您的信箱尚未註冊";
        promptToast.show();
        break;
      case 'auth/wrong-password':
        promptToastElement.children[0].innerHTML = "您的密碼輸入錯誤";
        promptToast.show();
        break;
      case 'auth/too-many-requests':
        promptToastElement.children[0].innerHTML = "錯誤次數過多，請稍後再試";
        promptToast.show();
        break;
    }
  });
}

function signUp(e) {
  e.preventDefault();
  const email = signUpModalElement.querySelector('#sign-up-email-input').value;
  const password = signUpModalElement.querySelector('#sign-up-password-input').value;
  
  createUserWithEmailAndPassword(getAuth(), email, password)
  .then((userCredential) => {
  })
  .catch((error) => {
    const errorCode = error.code;
    switch (errorCode){
      case 'auth/email-already-in-use':
        promptToastElement.children[0].innerHTML = "信箱已有人使用";
        promptToast.show();
        break;
      case 'auth/invalid-email':
        promptToastElement.children[0].innerHTML = "信箱格式錯誤";
        promptToast.show();
        break;
      case 'auth/operation-not-allowed':
        promptToastElement.children[0].innerHTML = "目前尚未開放註冊";
        promptToast.show();
        break;
      case 'auth/weak-password':
        promptToastElement.children[0].innerHTML = "密碼強度不足";
        promptToast.show();
        break;
    }
  })
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

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  promptToastElement.children[0].innerHTML = "You must sign-in first"
  let toast = new bootstrap.Toast(promptToastElement);
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
    monthSelector.apply(monthSelectorElement);

    // Hide sign-in button.
    signOutButtonElement.classList.remove('d-none');
    signInButtonElement.classList.add('d-none');
    signUpButtonElement.classList.add('d-none');

  } else {
    // Show sign-in button.
    signOutButtonElement.classList.add('d-none');
    signInButtonElement.classList.remove('d-none');
    signUpButtonElement.classList.remove('d-none');
  }
}

// Loads chat messages history and listens for upcoming ones.
async function loadRecords(year, month, day) {
  // TODO 8: Load and listen for new messages.
  const recentRecordsQuery = query(collection(getFirestore(), 'restaurant', year, 'months', month, 'days', day, 'records'), orderBy('timestamp', 'desc'));


  //Start listening to the query.
  unsubscribes[`${year}${month}${day}`] = onSnapshot(recentRecordsQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteRecord(change.doc.id, change.doc.data());
      } else {
        displayRecord(`${year}-${month}-${day}`, change.doc.data(), change.doc.id);
      }
    }, function(error){
      console.error(error);
    });
  });
}

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
    <div class="accordion-body px-2 py-0">
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
`<div class="mb-3 btn item d-flex justify-content-between" data-bs-toggle="modal" data-bs-target="#add-record-modal">
  <span class="item-name"></span>
  <span class="item-amount align-self-center"></span>
</div>`;

function createAndInsertItem(id, itemData, docID) {
  const container = document.createElement('div');
  container.innerHTML = ITEM_TEMPLATE;
  const item = container.firstChild;
  item.addEventListener('click', modalModeSwitch);
  item.setAttribute('id', 'item'+docID);

  if (itemData.category == undefined || itemData.category == ''){
    recordListElement.querySelector('#date'+ id).querySelector('.accordion').appendChild(item);
  } else {
    recordListElement.querySelector(`#category${itemData.category}${id}`).querySelector('.accordion-body').appendChild(item);
  }
  
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

  if (memoSnap.exists()) {
    memo.querySelector('textarea').value = memoSnap.data().memo;
  } else {
    memo.querySelector('textarea').value = '';
  }
  

  return memo;
}

function updateMemo(){
  const memoElement = this;
  const date = moment(this.getAttribute('data-date')).format('YYYY-MM-DD').split('-');
  const dateRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2]);
  clearTimeout(timer);
  timer = setTimeout(function(){
    setDoc(dateRef, { memo: memoElement.value }, { merge: true });
    promptToastElement.children[0].innerHTML = "備註已更新";
    promptToast.show();
  },2000)
}

// Displays a Message in the UI.
function displayRecord(id, itemData, docID) {
  const div = document.getElementById('date' + id) || createAndInsertMessage(id);
  // Category ----
  if (itemData.category != undefined && itemData.category != ''){
    const category = document.getElementById(`category${itemData.category}${id}`) || createAndInsertCategory(id, itemData);
    category.parentNode.querySelector('.accordion-header').setAttribute('data-bs-target', '#category'+itemData.category+id);
    category.parentNode.querySelector('.category-name').textContent = categories[itemData.category];
  }
  // ----Category
  const item = document.getElementById('item'+docID) || createAndInsertItem(id, itemData, docID);
  document.getElementById(`memo${id}`) || createAndInsertMemo(id);

  div.querySelector('.record-date').textContent = moment(id).format('DD dddd YYYY MMMM');
  
  item.querySelector('.item-name').textContent = items[itemData.item];
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
  item.querySelector('.item-amount').textContent = amountFormat(item.querySelector('.item-amount').getAttribute('data-amount'));

  calculateAmount();
  bodyResize();
}

function calculateAmount() {
  const aCategoryAmountElement = document.getElementsByClassName('category-amount');
  const aDayAmountElement = document.getElementsByClassName('day-amount');
  
  for(let i=0; i<aCategoryAmountElement.length; i++){
    const aItemAmount = aCategoryAmountElement[i].parentElement.parentElement.getElementsByClassName('item-amount');
    aCategoryAmountElement[i].textContent = '0';
    for(let j=0; j<aItemAmount.length; j++) {
      aCategoryAmountElement[i].textContent = parseInt(aCategoryAmountElement[i].textContent) + parseInt(aItemAmount[j].getAttribute('data-amount'));
    }
    aCategoryAmountElement[i].setAttribute('data-amount', aCategoryAmountElement[i].textContent);
    aCategoryAmountElement[i].textContent = amountFormat(aCategoryAmountElement[i].textContent);
  }

  financeMonthAmountElement.querySelector('.income-amount').textContent = '0';
  financeMonthAmountElement.querySelector('.outcome-amount').textContent = '0';
  financeMonthAmountElement.querySelector('.earning-amount').textContent = '0';
  for (let i=0; i<aDayAmountElement.length; i++){
    const aItemAmount = aDayAmountElement[i].parentElement.parentElement.getElementsByClassName('item-amount');
    aDayAmountElement[i].textContent = '0';
    aDayAmountElement[i].classList.remove('text-primary');
    aDayAmountElement[i].classList.remove('text-danger');

    for(let j=0; j<aItemAmount.length; j++) {
      aDayAmountElement[i].textContent = parseInt(aDayAmountElement[i].textContent) + parseInt(aItemAmount[j].getAttribute('data-amount'));
      financeMonthAmountElement.querySelector('.earning-amount').textContent = parseInt(financeMonthAmountElement.querySelector('.earning-amount').textContent)+parseInt(aItemAmount[j].getAttribute('data-amount'));
      if(parseInt(aItemAmount[j].getAttribute('data-amount')) > 0) {
        financeMonthAmountElement.querySelector('.income-amount').textContent = parseInt(financeMonthAmountElement.querySelector('.income-amount').textContent)+parseInt(aItemAmount[j].getAttribute('data-amount'));
      } else {
        financeMonthAmountElement.querySelector('.outcome-amount').textContent = parseInt(financeMonthAmountElement.querySelector('.outcome-amount').textContent)+parseInt(aItemAmount[j].getAttribute('data-amount'));
      }
    }
    aDayAmountElement[i].setAttribute('data-amount', aDayAmountElement[i].textContent);
    financeMonthAmountElement.querySelector('.income-amount').textContent = amountFormat(parseInt(financeMonthAmountElement.querySelector('.income-amount').textContent));
    financeMonthAmountElement.querySelector('.outcome-amount').textContent = amountFormat(parseInt(financeMonthAmountElement.querySelector('.outcome-amount').textContent));
    financeMonthAmountElement.querySelector('.earning-amount').textContent = amountFormat(parseInt(financeMonthAmountElement.querySelector('.earning-amount').textContent));

    if(parseInt(aDayAmountElement[i].getAttribute('data-amount')) > 0) {
      aDayAmountElement[i].classList.add('text-primary');
      aDayAmountElement[i].classList.remove('text-danger');
    } else if (parseInt(aDayAmountElement[i].getAttribute('data-amount')) < 0){
      aDayAmountElement[i].classList.remove('text-primary');
      aDayAmountElement[i].classList.add('text-danger');
    }
    aDayAmountElement[i].textContent = amountFormat(aDayAmountElement[i].textContent);
  }
  //reset month amount
  itemMonthAmount = {};
  categoryMonthAmount = {};
  let aItemElements = document.getElementsByClassName('item-name');
  let aCategoryElements = document.getElementsByClassName('category-name');
  
  //Item Month Amount ------------

  for (let i=0; i<aItemElements.length; i++){
    if (itemMonthAmount[`${aItemElements[i].textContent}`] == undefined){
      itemMonthAmount[`${aItemElements[i].textContent}`] = parseInt(aItemElements[i].nextElementSibling.getAttribute('data-amount'));
    } else {
      itemMonthAmount[`${aItemElements[i].textContent}`] = itemMonthAmount[`${aItemElements[i].textContent}`] + parseInt(aItemElements[i].nextElementSibling.getAttribute('data-amount'));
    }
  }

  var ITEM_MONTH_AMOUNT_TEMPLATE =
  `<div class="row justify-content-between">
    <div class="col item-month-name"></div>
    <div class="col item-month-amount text-end">0</div>
  </div>`;

  itemMonthAmountElement.textContent = '';

  for (let itemName in itemMonthAmount){
    const container = document.createElement('div');
    container.innerHTML = ITEM_MONTH_AMOUNT_TEMPLATE;
    const item = container.firstChild;
    item.querySelector('.item-month-name').textContent = itemName;
    item.querySelector('.item-month-amount').textContent = amountFormat(itemMonthAmount[itemName]);
  
    itemMonthAmountElement.appendChild(item);
  }

  //------- Item Month Amount

  //Category Month Amount -------
  for (let i=0; i<aCategoryElements.length; i++){
    if (categoryMonthAmount[`${aCategoryElements[i].textContent}`] == undefined){
      categoryMonthAmount[`${aCategoryElements[i].textContent}`] = parseInt(aCategoryElements[i].nextElementSibling.getAttribute('data-amount'));
    } else {
      categoryMonthAmount[`${aCategoryElements[i].textContent}`] = categoryMonthAmount[`${aCategoryElements[i].textContent}`] + parseInt(aCategoryElements[i].nextElementSibling.getAttribute('data-amount'));
    }
  }

  var CATEGORY_MONTH_AMOUNT_TEMPLATE =
  `<div class="row justify-content-between">
    <div class="col category-month-name"></div>
    <div class="col category-month-amount text-end">0</div>
  </div>`;

  categoryMonthAmountElement.textContent = '';

  for (let categoryName in categoryMonthAmount){
    const container = document.createElement('div');
    container.innerHTML = CATEGORY_MONTH_AMOUNT_TEMPLATE;
    const category = container.firstChild;
    category.querySelector('.category-month-name').textContent = categoryName;
    category.querySelector('.category-month-amount').textContent = amountFormat(categoryMonthAmount[categoryName]);
  
    categoryMonthAmountElement.appendChild(category);
  }
  //------------ Category Month Amount 
}

// Delete a Message from the UI.
function deleteRecord(docID, itemData) {
  let item = document.getElementById('item'+docID);
  let div = document.getElementById('date'+itemData.date);
  let accordionBody = item.parentNode;
  
  // If an element for that message exists we delete it.

  if (item) {
    item.parentNode.removeChild(item);
  }

  if (item.getAttribute('data-category') != ''){
    let category = div.querySelector(`#category${itemData.category}${itemData.date}`);

    if (accordionBody.children.length == 0){
      category.parentNode.parentNode.removeChild(category.parentNode);
    }
  }

  if (div.querySelector('.accordion').children.length == 0){
    div.parentNode.removeChild(div);
  }
  calculateAmount();
  bodyResize();
}

function amountFormat(amount) {
  return `${new Intl.NumberFormat().format(amount)} ฿`;
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
    submitData['category'] = categorySelectElement.value;

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
  recordListElement.textContent = '';
  let date = this.value.split('-') || moment(new Date()).format('YYYY-MM').split('-')
  let days = getDaysInMonth(date[0], date[1]);

  for (let day = 0; day <= days; day++){
    if (day<10){day='0'+day}
    await loadRecords(date[0], date[1], `${day}`);
  }
}

// Saves a new message on the Cloud Firestore.
async function saveMessage(messageText) {
  const date = moment(messageText.date).format('YYYY-MM-DD').split('-');
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
  this.querySelector('input').focus();
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
    modifyButtonElement.setAttribute('data-category', this.getAttribute('data-category'));
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
  const item = document.getElementById('item'+this.getAttribute('data-id'));
  const accordionBody = item.parentNode;
  const date = this.getAttribute('data-date').split('-');
  const itemRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'records', this.getAttribute('data-id'));
  const itemData = {
    amount: parseInt(amountInputElement.value),
    expin: expenseRadioElement.checked == true ? 'expense' : 'income',
    category: categorySelectElement.value,
    item: itemSelectElement.value
  }
  if (this.getAttribute('data-category') != categorySelectElement.value){
    if (this.getAttribute('data-category') == ''){
      item.parentNode.removeChild(item);
    } else {
      item.parentNode.removeChild(item);
      if (accordionBody.children.length == 0){
        accordionBody.parentNode.parentNode.parentNode.removeChild(accordionBody.parentNode.parentNode);
      }
    }

    
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
function bodyResize(){
  bodyElement.style.marginBottom = fixedBottomArea.offsetHeight +'px';
}

// Shortcuts to DOM Elements.
var recordListElement = document.getElementById('records');
var signInModalElement = document.getElementById('sign-in-modal');
var signUpModalElement = document.getElementById('sign-up-modal');
var signInButtonElement = document.getElementById('sign-in');
var signUpButtonElement = document.getElementById('sign-up');
var monthSelectorElement = document.getElementById('month-selector');
var signOutButtonElement = document.getElementById('sign-out');
var promptToastElement = document.getElementById('prompt-toast');
var promptToast = new bootstrap.Toast(promptToastElement);
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
var categoryMonthAmountElement = document.getElementById('category-month-amount');
var itemMonthAmountElement = document.getElementById('item-month-amount');
var financeMonthAmountElement = document.getElementById('finance-month-amount');
var bodyElement = document.body;
var fixedBottomArea = document.getElementsByClassName('fixed-bottom')[0];

// Saves message on form submit.
addRecordModalElement.addEventListener('submit', onRecordFormSubmit);
signInModalElement.addEventListener('submit', signIn);
signInModalElement.addEventListener('shown.bs.modal', focusInput);
signUpModalElement.addEventListener('submit', signUp);
signUpModalElement.addEventListener('shown.bs.modal', focusInput);
//categorySelectElement.addEventListener('change', selectChange);
itemSelectElement.addEventListener('change', selectChange);
signOutButtonElement.addEventListener('click', signOutUser);
addRecordModalElement.addEventListener('shown.bs.modal', focusInput);
addRecordModalElement.addEventListener('hidden.bs.modal', cleanModal);
addRecordButtonElement.addEventListener('click', modalModeSwitch);
modifyButtonElement.addEventListener('click', modifyItemData);
deleteButtonElement.addEventListener('click', deleteItem);
//Radio button
expenseRadioElement.addEventListener('change', toggleExpin);
incomeRadioElement.addEventListener('change', toggleExpin);

//Show this month
monthSelectorElement.value = moment(new Date()).format('YYYY-MM');
monthSelectorElement.addEventListener('change', monthSelector);
dateSelectorElement.value = moment(new Date()).format('YYYY-MM-DD');;


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