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
  getDocs,
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

let items = {}, categories = {}, staff = {}, submitData = {}, unsubscribes = {};
let itemMonthAmount ={}, categoryMonthAmount = {}, staffSalaryMonthAmount = {}, staffSalaryLastMonthAmount = {};
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
async function authStateObserver(user) {
  if (user) {
    manageCategoryElement.textContent= "";
    manageItemElement.textContent = "";
    const userRef = doc(getFirestore(), "users", user.uid);
    try {
      await getDoc(userRef);
      loadCategoriesList();
      loadItemsList();
      loadStaffList();
      monthSelector.apply(monthSelectorElement);
    } catch (e){
      recordListElement.innerHTML = 
      `<div class="container">
        <p class="fs-3 text-center">您的權限不足，無法讀取資料</p>
        <p class="fs-3 text-center">Missing or insufficient permissions</p>
      </div>`;
    }
    // Hide sign-in button.
    signOutButtonElement.classList.remove('d-none');
    manageButtonElement.classList.remove('d-none');
    staffButtonElement.classList.remove('d-none');
    signInButtonElement.classList.add('d-none');
    signUpButtonElement.classList.add('d-none');

  } else {
    // Show sign-in button.
    initWebSite();
    signOutButtonElement.classList.add('d-none');
    manageButtonElement.classList.add('d-none');
    staffButtonElement.classList.add('d-none');
    signInButtonElement.classList.remove('d-none');
    signUpButtonElement.classList.remove('d-none');
  }
}

function initWebSite(){
  manageCategoryElement.textContent = ""
  categoryMonthAmountElement.textContent = "";
  itemMonthAmountElement.textContent = "";
  incomeAmountElement.textContent = "0 ฿";
  outcomeAmountElement.textContent = "0 ฿";
  earningAmountElement.textContent = "0 ฿";
  monthSelectorElement.value = moment(new Date).format('YYYY-MM');
}

// Loads chat messages history and listens for upcoming ones.
async function loadRecords(year, month, day) {
  // TODO 8: Load and listen for new messages.
  const recentRecordsQuery = query(collection(getFirestore(), 'restaurant', year, 'months', month, 'days', day, 'records'), orderBy('timestamp', 'desc'));
  createAndInsertMessage(`${year}-${month}-${day}`)

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

async function loadStaffData(year, month, day) {
  // TODO 8: Load and listen for new messages.
  const recentRecordsQuery = query(collection(getFirestore(), 'restaurant', year, 'months', month, 'days', day, 'staff'));

  //Start listening to the query.
  unsubscribes[`${year}${month}${day}`] = onSnapshot(recentRecordsQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteStaffDataElement(`${year}-${month}-${day}`, change.doc.id);
      } else {
        displayStaffData(`${year}-${month}-${day}`, change.doc.id, change.doc.data());
      }
    }, function(error){
      console.error(error);
    });
  });
}

// Displays a Message in the UI.
function displayStaffData(date, id, data) {
  const div = document.getElementById('date' + date);
  div.classList.remove('d-none');
  div.querySelector('.record-date').textContent = moment(date).format('DD dddd YYYY MMMM');
  // Category ----
  const category = document.getElementById(`salary${date}`) || createAndInsertSalaryCategory(date, data);
  category.parentNode.querySelector('.salary-category-name').textContent = "Salary";
  // ----Category

  // Salary Item --------
  const salaryItem = document.getElementById(id+date) || createAndInsertSalaryItem(date, id, data);
  // div.querySelector('.record-date').textContent = moment(date).format('DD dddd YYYY MMMM');

  salaryItem.setAttribute('data-amount', data.amount);
  salaryItem.setAttribute('data-date', date);
  salaryItem.setAttribute('data-id', id);
  salaryItem.setAttribute('data-payment-status', data.status);
  salaryItem.querySelector('.salary-item-name').textContent = staff[id].name;
  salaryItem.querySelector('.salary-item-amount').textContent = amountFormat(salaryItem.getAttribute('data-amount'));
  // ----- Item
  calculateSalaryAmount();
  bodyResize();
}

async function calculateSalaryAmount(){
  const aSalaryItems = document.getElementsByClassName('salary-item-amount');
  //初始化員工薪水
  for (let staffId in staff){
    document.getElementById(staffId).querySelector('.staff-item-this-month-amount').textContent = '0 ฿';
    document.getElementById(staffId).querySelector('.staff-item-last-month-amount').textContent = '0 ฿';
    document.getElementById(staffId).querySelector('.staff-item-month-total-amount').textContent = '0 ฿';
    document.getElementById(staffId).querySelector('.staff-item-this-month-amount').setAttribute('data-amount', '0');
    document.getElementById(staffId).querySelector('.staff-item-last-month-amount').setAttribute('data-amount', '0');
    document.getElementById(staffId).querySelector('.staff-item-month-total-amount').setAttribute('data-amount', '0');
  }
  for (let staffId in staffSalaryLastMonthAmount){
    const staffMonthItemId = document.getElementById(staffId);
    staffMonthItemId.querySelector('.staff-item-last-month-amount').textContent = amountFormat(staffSalaryLastMonthAmount[staffId]);
    staffMonthItemId.querySelector('.staff-item-last-month-amount').setAttribute('data-amount', staffSalaryLastMonthAmount[staffId]);
  }

  staffSalaryMonthAmount = {};
  for (let i = 0; i < aSalaryItems.length; i++){
    if(aSalaryItems[i].parentElement.getAttribute('data-payment-status') == 'pending'){
      if (staffSalaryMonthAmount[`${aSalaryItems[i].parentElement.getAttribute('data-id')}`] == undefined){
        staffSalaryMonthAmount[`${aSalaryItems[i].parentElement.getAttribute('data-id')}`] = parseInt(aSalaryItems[i].parentElement.getAttribute('data-amount'));
      } else {
        staffSalaryMonthAmount[`${aSalaryItems[i].parentElement.getAttribute('data-id')}`] = staffSalaryMonthAmount[`${aSalaryItems[i].parentElement.getAttribute('data-id')}`] + parseInt(aSalaryItems[i].parentElement.getAttribute('data-amount'));
      }
    }
  }

  const date = monthSelectorElement.value.split('-');
  const monthRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1]);

  for (let staffId in staffSalaryMonthAmount){
    let staffMonthItemId = document.getElementById(staffId);
    staffMonthItemId.querySelector('.staff-item-this-month-amount').textContent = amountFormat(staffSalaryMonthAmount[staffId]);
    staffMonthItemId.querySelector('.staff-item-this-month-amount').setAttribute('data-amount', staffSalaryMonthAmount[staffId]);
    staffMonthItemId.querySelector('.staff-item-month-total-amount').textContent = amountFormat(parseInt(staffMonthItemId.querySelector('.staff-item-this-month-amount').getAttribute('data-amount'))+parseInt(staffMonthItemId.querySelector('.staff-item-last-month-amount').getAttribute('data-amount')));
  }


  for (let staffId in staff){
    let data = `{
      '${staffId}': ${parseInt(document.getElementById(staffId).querySelector('.staff-item-this-month-amount').getAttribute('data-amount'))}
    }`

    await setDoc(monthRef, eval('('+data+')'), {merge: true});
  }
};

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

function createAndInsertMessage(date) {
  const container = document.createElement('div');
  container.innerHTML = MESSAGE_TEMPLATE;
  const table = container.firstChild;
  table.setAttribute('id', 'date' + date);
  table.classList.add('d-none');
  recordListElement.appendChild(table);

  return table;
}

var CATEGORY_TEMPLATE =
`<div class="accordion-item mb-3">
  <div class="btn accordion-header d-flex justify-content-between"  data-bs-toggle="collapse">
    <span class="category-name text-capitalize"></span>
    <span class="category-amount align-self-center"></span>
  </div>
  <div class="accordion-collapse collapse">
    <div class="accordion-body px-2 py-0">
    </div>
  </div>
</div>`;

var SALARY_CATEGORY_TEMPLATE =
`<div class="accordion-item mb-3">
  <h2 class="accordion-header">
    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse">
      <span class="salary-category-name text-capitalize"></span>
    </button>
  </h2>
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

function createAndInsertSalaryCategory(date, data) {
  const container = document.createElement('div');
  container.innerHTML = SALARY_CATEGORY_TEMPLATE;
  const category = container.firstChild;
  category.querySelector('button').setAttribute('data-bs-target', `#salary${date}`);
  category.querySelector('.collapse').setAttribute('id', `salary${date}`);
  const accordionElement = recordListElement.querySelector('#date'+ date).querySelector('.accordion');
  accordionElement.insertBefore(category, accordionElement.firstChild);

  return document.getElementById('salary'+date);
}


var ITEM_TEMPLATE = 
`<div class="mb-3 btn item d-flex justify-content-between" data-bs-toggle="modal" data-bs-target="#add-record-modal">
  <span class="item-name text-capitalize"></span>
  <span class="item-amount align-self-center"></span>
</div>`;
var SALARY_ITEM_TEMPLATE = 
`<div class="mb-3 btn salary-item d-flex justify-content-between" data-bs-toggle="modal" data-bs-target="#modify-staff-amount-modal">
  <span class="salary-item-name text-capitalize"></span>
  <span class="salary-item-amount align-self-center"></span>
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
function createAndInsertSalaryItem(date, id) {
  const container = document.createElement('div');
  container.innerHTML = SALARY_ITEM_TEMPLATE;
  const salaryItem = container.firstChild;
  salaryItem.addEventListener('click', loadSalaryItem);
  salaryItem.setAttribute('id', id+date);
  recordListElement.querySelector(`#salary${date}`).querySelector('.accordion-body').appendChild(salaryItem);

  return salaryItem;
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

function updateCategory(){
  const inputElement = this;
  const categoriesRef = doc(getFirestore(), 'categories', this.getAttribute('data-category'));
  clearTimeout(timer);
  timer = setTimeout(function(){
    setDoc(categoriesRef, { name: inputElement.value }, { merge: true });
    promptToastElement.children[0].innerHTML = "Category Updated!";
    promptToast.show();
    inputElement.previousElementSibling.querySelector('input[type="checkbox"').click();
    toggleInputDisabled.apply(inputElement.previousElementSibling.querySelector('input[type="checkbox"'));
  },2000)
}

function updateItem(){
  const inputElement = this;
  const itemsRef = doc(getFirestore(), 'items', this.getAttribute('data-item'));
  clearTimeout(timer);
  timer = setTimeout(function(){
    setDoc(itemsRef, { name: inputElement.value }, { merge: true });
    promptToastElement.children[0].innerHTML = "Item Updated!";
    promptToast.show();
    inputElement.previousElementSibling.querySelector('input[type="checkbox"').click();
    toggleInputDisabled.apply(inputElement.previousElementSibling.querySelector('input[type="checkbox"'));
  },2000)
}

function updateStaffDaySalaryDefault(){
  const inputElement = this;
  const staffRef = doc(getFirestore(), 'staff', this.getAttribute('data-staff-id'));
  clearTimeout(timer);
  timer = setTimeout(function(){
    setDoc(staffRef, { daySalaryDefault: inputElement.value }, { merge: true });
    staffDaySalaryCheckBox.checked = false;
    toggleStaffDaySalaryDefaultInput.apply(staffDaySalaryCheckBox);
    promptToastElement.children[0].innerHTML = "Value Updated!!";
    promptToast.show();
  },2000)
}

// Displays a Message in the UI.
function displayRecord(id, itemData, docID) {
  const div = document.getElementById('date' + id);
  div.classList.remove('d-none');
  // Category ----
  if (itemData.category != undefined && itemData.category != ''){
    const category = document.getElementById(`category${itemData.category}${id}`) || createAndInsertCategory(id, itemData);
    category.parentNode.querySelector('.accordion-header').setAttribute('data-bs-target', '#category'+itemData.category+id);
    category.parentNode.querySelector('.category-name').textContent = categories[itemData.category] || itemData.category;
  }
  // ----Category
  const item = document.getElementById('item'+docID) || createAndInsertItem(id, itemData, docID);
  document.getElementById(`memo${id}`) || createAndInsertMemo(id);

  div.querySelector('.record-date').textContent = moment(id).format('DD dddd YYYY MMMM');

  if (items[itemData.item]){
    item.querySelector('.item-name').textContent = items[itemData.item].name;
  } else {
    item.querySelector('.item-name').textContent = itemData.item;
  }
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

  calculateAmount()
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

  for (let i=0; i<aDayAmountElement.length; i++){
    const aItemAmount = aDayAmountElement[i].parentElement.parentElement.getElementsByClassName('item-amount');
    aDayAmountElement[i].textContent = '0';
    aDayAmountElement[i].classList.remove('text-primary');
    aDayAmountElement[i].classList.remove('text-danger');

    for(let j=0; j<aItemAmount.length; j++) {
      aDayAmountElement[i].textContent = parseInt(aDayAmountElement[i].textContent) + parseInt(aItemAmount[j].getAttribute('data-amount'));
    }
    aDayAmountElement[i].setAttribute('data-amount', aDayAmountElement[i].textContent);

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
  
  //Item Month Amount and Finances Amount------------
  
  incomeAmountElement.textContent = '0';
  outcomeAmountElement.textContent = '0';
  earningAmountElement.textContent = '0';
  for (let i=0; i<aItemElements.length; i++){
    if (aItemElements[i].nextElementSibling.getAttribute('data-amount') > 0){
      incomeAmountElement.textContent = `${parseInt(incomeAmountElement.textContent)+parseInt(aItemElements[i].nextElementSibling.getAttribute('data-amount'))}`;
    } else {
      outcomeAmountElement.textContent = `${parseInt(outcomeAmountElement.textContent)+parseInt(aItemElements[i].nextElementSibling.getAttribute('data-amount'))}`;
    }
    if (itemMonthAmount[`${aItemElements[i].textContent}`] == undefined){
      itemMonthAmount[`${aItemElements[i].textContent}`] = {
        amount: parseInt(aItemElements[i].nextElementSibling.getAttribute('data-amount')),
        expin: aItemElements[i].parentElement.getAttribute('data-expin')
      }
    } else {
      itemMonthAmount[`${aItemElements[i].textContent}`].amount = itemMonthAmount[`${aItemElements[i].textContent}`].amount + parseInt(aItemElements[i].nextElementSibling.getAttribute('data-amount'));
    }
  }
  earningAmountElement.textContent = `${parseInt(incomeAmountElement.textContent)+parseInt(outcomeAmountElement.textContent)}`;
  incomeAmountElement.textContent = amountFormat(incomeAmountElement.textContent);
  outcomeAmountElement.textContent = amountFormat(outcomeAmountElement.textContent);
  earningAmountElement.textContent = amountFormat(earningAmountElement.textContent);

  var ITEM_MONTH_AMOUNT_TEMPLATE =
  `<div class="row justify-content-between">
    <div class="col item-month-name text-capitalize"></div>
    <div class="col item-month-amount text-end">0</div>
  </div>`;

  itemMonthAmountElement.querySelector('.expenseMonthList').textContent = '';
  itemMonthAmountElement.querySelector('.incomeMonthList').textContent = '';

  for (let itemName in itemMonthAmount){
    const container = document.createElement('div');
    container.innerHTML = ITEM_MONTH_AMOUNT_TEMPLATE;
    const item = container.firstChild;
    item.querySelector('.item-month-name').textContent = itemName;
    item.querySelector('.item-month-amount').textContent = amountFormat(itemMonthAmount[itemName].amount);
    if (itemMonthAmount[itemName].expin == 'expense'){
      itemMonthAmountElement.querySelector('.expenseMonthList').appendChild(item);
    } else {
      itemMonthAmountElement.querySelector('.incomeMonthList').appendChild(item);
    }
  }

  //------- Item Month Amount and Finances Amount

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
    <div class="col category-month-name text-capitalize"></div>
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
function itemMonthRadioCheck(){
  itemMonthAmountElement.querySelector('.expenseMonthList').classList.add('d-none');
  itemMonthAmountElement.querySelector('.incomeMonthList').classList.add('d-none');
  itemMonthAmountElement.querySelector('.staffMonthList').classList.add('d-none');

  itemMonthAmountElement.querySelector(`.${this.getAttribute('data-target')}`).classList.remove('d-none');
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
    div.classList.add('d-none');
  }
  calculateAmount();
  bodyResize();
}

function deleteStaffDataElement(date, id){
  let salaryItem = document.getElementById(id+date);
  let category = document.getElementById('salary'+date);
  let div = document.getElementById('date'+date);
  // If an element for that message exists we delete it.

  if (salaryItem) {
    salaryItem.parentNode.removeChild(salaryItem);
  }

  if (category.querySelector('.accordion-body').children.length == 0){
    category.parentElement.parentElement.removeChild(category.parentElement);
  }
  if (div.querySelector('.accordion').children.length == 0){
    div.classList.add('d-none');
  }
}

function amountFormat(amount) {
  return `${new Intl.NumberFormat().format(amount)} ฿`;
}

var MANAGE_TABLE_TEMPLATE = 
`<tbody>
  <tr>
    <td>
      <div class="input-group">
        <div class="input-group-text">
          <input type="checkbox" class="form-check-input mt-0">
        </div>
        <input class="form-control text-capitalize" type="text" disabled/>
      </div>
    </td>
  </tr>
  </tbody>`;

function toggleInputDisabled(){
  if (this.checked){
    this.parentElement.nextElementSibling.removeAttribute('disabled');
  } else {
    this.parentElement.nextElementSibling.setAttribute('disabled', 'true');
  }
}
function appendToManageList(el, id, name, expin, type){
  const container = document.createElement('table');
  container.innerHTML = MANAGE_TABLE_TEMPLATE;
  const newTr = container.querySelector('tr');
  newTr.querySelector('input[type="checkbox"]').addEventListener('change', toggleInputDisabled);
  newTr.querySelector('input[type="text"]').classList.add('manage-item-name');
  newTr.querySelector('input[type="text"]').value = name;
  if (type == "item"){
    newTr.querySelector('input[type="text"]').addEventListener('input', updateItem);
    newTr.querySelector('input[type="text"]').setAttribute('data-item', id);
  } else {
    newTr.querySelector('input[type="text"]').addEventListener('input', updateCategory);
    newTr.querySelector('input[type="text"]').setAttribute('data-category', id);
  }
  
  newTr.setAttribute('data-id', id);
  newTr.setAttribute('data-name', name);
  newTr.setAttribute('data-type', type);
  newTr.addEventListener('dblclick', showManageDeleteModal);
  if (expin){
    newTr.setAttribute('data-expin', expin);
  }
  el.appendChild(newTr);
}
function showManageDeleteModal(){
  manageDeleteModal.show();
  manageDeleteTr = this;
  manageDeleteModalElement.querySelector('#manage-delete-type').textContent = this.getAttribute('data-type');
  manageDeleteModalElement.querySelector('#manage-delete-name').textContent = this.getAttribute('data-name');
  manageDeleteModalElement.querySelector('#manage-delete-button').setAttribute('data-id', this.getAttribute('data-id'));
  if (this.getAttribute('data-type') == 'item'){
    manageDeleteModalElement.querySelector('#manage-delete-button').setAttribute('data-type-ref', 'items');
  } else {
    manageDeleteModalElement.querySelector('#manage-delete-button').setAttribute('data-type-ref', 'categories');
  }
  manageDeleteModalElement.querySelector('#manage-delete-button').addEventListener('click', manageDeletion);
}
async function manageDeletion(){
  manageDeleteModal.hide();
  await deleteDoc(doc(getFirestore(), this.getAttribute('data-type-ref'), this.getAttribute('data-id')));
  manageDeleteTr.parentElement.removeChild(manageDeleteTr);
}

async function loadCategoriesList() {
  const categoriesQuery = query(collection(getFirestore(), 'categories'), orderBy('timestamp'));

  const querySnapshot = await getDocs(categoriesQuery);
  
  querySnapshot.forEach((doc) => {
    categories[doc.id] = doc.data().name;
    appendToManageList(manageCategoryElement, doc.id, doc.data().name, false, 'category');
  });
  
  createAndInsertCategoryOption();
}


var OPTION_TEMPLATE = 
`<option></option>`;

function createAndInsertCategoryOption() {
  for (let category in categories){
    const container = document.createElement('div');
    container.innerHTML = OPTION_TEMPLATE;
    const option = container.firstChild;
    option.setAttribute('value', category);
    option.classList.add('text-capitalize');
    option.textContent = categories[category];
  
    categorySelectElement.appendChild(option);
  }
}

async function loadItemsList() {
  const itemsQuery = query(collection(getFirestore(), 'items'), orderBy('timestamp'));

  const querySnapshot = await getDocs(itemsQuery);
  
  querySnapshot.forEach((doc) => {
    items[doc.id] = {
      name: doc.data().name,
      expin: doc.data().expin
    }
    appendToManageList(manageItemElement, doc.id, doc.data().name, doc.data().expin, 'item');
  });

  createAndInsertItemOption();
}

async function loadStaffList() {
  const staffQuery = query(collection(getFirestore(), 'staff'), orderBy('timestamp'));

  const querySnapshot = await getDocs(staffQuery);
  
  querySnapshot.forEach((doc) => {
    staff[doc.id] = {
      name: doc.data().name,
      daySalaryDefault: doc.data().daySalaryDefault
    }
    appendToManageList(manageItemElement, doc.id, doc.data().name, 'staff', 'item');
    if(!document.getElementById(doc.id)){
      const SALARY_ITEM_MONTH_AMOUNT_TEMPLATE =
      `<div class="row justify-content-between">
        <div class="col-3 staff-item-month-name text-capitalize"></div>
        <div class="col-9 text-end">
          <span class="staff-item-this-month-amount" data-amount="0">0 ฿</span> +
          <span class="staff-item-last-month-amount" data-amount="0">0 ฿</span> =
          <span class="staff-item-month-total-amount" data-amount="0">0 ฿</span>
        </div>
      </div>`;
    
      const container = document.createElement('div');
      container.innerHTML = SALARY_ITEM_MONTH_AMOUNT_TEMPLATE;
      const item = container.firstChild;
      item.querySelector('.staff-item-month-name').textContent = doc.data().name;
      item.setAttribute('id', doc.id);
      itemMonthAmountElement.querySelector('.staffMonthList').appendChild(item);
    }
  });

  
  manageItemRadioStateChanged.apply(manageItemExpenseRadio);
  createAndInsertStaffOption();
}

function manageItemRadioStateChanged(){
  const manageItemRadios = manageItemHeadElement.querySelectorAll('input[name="manage-item-radio"]');
  const manageItemTrElements = manageItemElement.getElementsByTagName('tr');
  for (let i=0; i<manageItemRadios.length; i++){
    manageItemRadios[i].checked = false;
  }
  this.checked = true;

  for (let i=0; i<manageItemTrElements.length; i++){
    manageItemTrElements[i].classList.add('d-none');
  }
  for (let i=0; i<manageItemTrElements.length; i++){
    if (manageItemTrElements[i].getAttribute('data-expin') == this.getAttribute('data-type')){
      manageItemTrElements[i].classList.remove('d-none');
    }
  }
  newItemButtonElement.setAttribute('data-expin', this.getAttribute('data-type'));
//   if (manageItemExpenseRadio.checked){
//     for (let i=0; i<manageItemTrElements.length; i++){
//       if (manageItemTrElements[i].getAttribute('data-expin') == 'expense'){
//         manageItemTrElements[i].classList.remove('d-none');
//       } else {
//         manageItemTrElements[i].classList.add('d-none');
//       }
//     }
//     newItemButtonElement.setAttribute('data-expin', 'expense');
//   } else if (manageItemIncomeRadio.checked) {
//     for (let i=0; i<manageItemTrElements.length; i++){
//       if (manageItemTrElements[i].getAttribute('data-expin') == 'income'){
//         manageItemTrElements[i].classList.remove('d-none');
//       } else {
//         manageItemTrElements[i].classList.add('d-none');
//       }
//     }
//     newItemButtonElement.setAttribute('data-expin', 'income');
//   } else {
//     for (let i=0; i<manageItemTrElements.length; i++){
//         manageItemTrElements[i].classList.add('d-none');
//     }
//   }
}

function createAndInsertItemOption() {
  const aExpenseItem = manageItemElement.querySelectorAll('tr[data-expin="expense"]');
  const aIncomeItem = manageItemElement.querySelectorAll('tr[data-expin="income"]');
  const emptyOption = itemSelectElement.firstElementChild;
  itemSelectElement.textContent = "";
  itemSelectElement.appendChild(emptyOption);
  if (expenseRadioElement.checked){
    for (let i=0; i<aExpenseItem.length; i++){
      const container = document.createElement('div');
      container.innerHTML = OPTION_TEMPLATE;
      const option = container.firstChild;
      option.setAttribute('value', aExpenseItem[i].getAttribute('data-id'));
      option.classList.add('text-capitalize');
      option.textContent = aExpenseItem[i].querySelector('input[type="text"]').value;
      itemSelectElement.appendChild(option);
    }
  } else {
    for (let i=0; i<aIncomeItem.length; i++){
      const container = document.createElement('div');
      container.innerHTML = OPTION_TEMPLATE;
      const option = container.firstChild;
      option.setAttribute('value', aIncomeItem[i].getAttribute('data-id'));
      option.classList.add('text-capitalize');
      option.textContent = aIncomeItem[i].querySelector('input[type="text"]').value;
      itemSelectElement.appendChild(option);
    }
  }
}

function createAndInsertStaffOption() {
  const aStaffItem = manageItemElement.querySelectorAll('tr[data-expin="staff"]');
  const emptyOption = staffSelectElement.firstElementChild;
  staffSelectElement.textContent = "";
  staffSelectElement.appendChild(emptyOption);
  
  for (let i=0; i<aStaffItem.length; i++){
    const container = document.createElement('div');
    container.innerHTML = OPTION_TEMPLATE;
    const option = container.firstChild;
    option.setAttribute('value', aStaffItem[i].getAttribute('data-id'));
    option.classList.add('text-capitalize');
    option.textContent = aStaffItem[i].querySelector('input[type="text"]').value;
    staffSelectElement.appendChild(option);
  }
}

// Triggered when the send new message form is submitted.
function onRecordFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (amountInputElement.value && checkSignedInWithMessage()) {
    submitData['amount'] = amountInputElement.value;
    submitData['date'] = dateSelectorElement.value;
    submitData['timestamp'] = serverTimestamp();

    if (categoryCheckBoxElement.checked){
      submitData['category'] = (categoryCheckBoxElement.parentElement.nextElementSibling.value).toLowerCase();
    } else {
      submitData['category'] = categorySelectElement.value;
    }

    if (itemCheckBoxElement.checked){
      submitData['item'] = (itemCheckBoxElement.parentElement.nextElementSibling.value).toLowerCase();
    } else {
      submitData['item'] = itemSelectElement.value;
    }
    expenseRadioElement.checked == true ? submitData['expin'] = 'expense' : submitData['expin'] = 'income';
    saveMessage(submitData);
    dismissButtonElement.click();
    
  }
}

function submitStaffSalaryData() {
  let data = {};
  let id = staffSelectElement.value;
  if (staffDaySalaryDefault.value && checkSignedInWithMessage()) {
    data['amount'] = Math.abs(parseInt(staffDaySalaryDefault.value));
    data['date'] = staffSalaryMonthSelectorElement.value+'-'+this.textContent;
    data['status'] = "pending";

    saveStaffSalaryData(id, data);
  }
  
}

async function updateStaffSalaryData() {
  const date = this.getAttribute('data-date').split('-');
  const id = staffSelectElement.value;
  const staffSalaryRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'staff', id);

  if (staffDaySalaryDefault.value && checkSignedInWithMessage()) {
    try {
      await updateDoc(staffSalaryRef, {
        status: 'paid'
      });
    }
    catch(error) {
      console.error('Error update staff salary data', error);
    }
  }
}

function toggleExpin() {
  createAndInsertItemOption();
  
  itemSelectElement.focus();
}

//Load date from date
async function monthSelector() {
  recordListElement.textContent = '';
  itemMonthExpenseRadio.checked = true;
  itemMonthRadioCheck.apply(itemMonthExpenseRadio);
  staffSalaryMonthSelectorElement.value = this.value;
  let date = this.value.split('-') || moment(new Date()).format('YYYY-MM').split('-')
  let days = getDaysInMonth(date[0], date[1]);

  //獲取當月從禮拜幾開始
  let dayStart = new Date(`${date[0]}-${date[1]}`).getDay();
  const calendarDaysElement = document.getElementById('calendar-days');
  
  //新增空白的 li 前，先刪除之前的空 li
  let aEmptyLi = document.getElementsByClassName('empty-li');
  if (aEmptyLi){
    for (let i = aEmptyLi.length-1; i >= 0; i--){
      aEmptyLi[i].remove();
    }
  }
  //新增空白的 li 在當月星期開始前
  for (let i = 1; i < dayStart; i++){
    const newLi = document.createElement('li');
    newLi.classList.add('empty-li');
    calendarDaysElement.insertBefore(newLi, calendarDaysElement.firstElementChild);
  }
  //AANEW
  //獲取月曆日期的所有按鈕
  const aDateButton = staffSalaryCalendarElement.getElementsByTagName('a');
  //隱藏所有按鈕
  for (let i = 0; i < aDateButton.length; i++){
    aDateButton[i].classList.add('d-none');
  }

  //顯示當前月份的日期按鈕
  for (let day = 0; day < days; day++){
    aDateButton[day].classList.remove('d-none');
  }
  
  for (let day = days; day > 0; day--){
    if (day<10){day='0'+day}
    await loadRecords(date[0], date[1], `${day}`);
  }
  for (let day = days; day > 0; day--){
    if (day<10){day='0'+day}
    await loadStaffData(date[0], date[1], `${day}`);
  }
  
  const lastMonthDate = getLastMonth(date[0],date[1]).split('-');
  const lastMonthRef = doc(getFirestore(), 'restaurant', lastMonthDate[0], 'months', lastMonthDate[1]);
  const lastMonthSnap = await getDoc(lastMonthRef);

  if (lastMonthSnap.exists()) {
    staffSalaryLastMonthAmount = lastMonthSnap.data();
  } else {
    // doc.data() will be undefined in this case
    staffSalaryLastMonthAmount = {};
  }

  calculateAmount();
  calculateSalaryAmount();
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

async function saveStaffSalaryData(id, data) {
  const date = moment(data.date).format('YYYY-MM-DD').split('-');
  const staffSalaryRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'staff', id);
  
  // TODO 7: Push a new message to Cloud Firestore.
  try {
    await setDoc(staffSalaryRef, data);
  }
  catch(error) {
    console.error('Error writing new message to Firebase Database', error);
  }
}
async function deleteStaffSalaryData(){
  const date = this.getAttribute('data-date').split('-');
  const staffSalaryRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'staff', staffSelectElement.value);

  await deleteDoc(staffSalaryRef);
}

function getDaysInMonth (year, month){
  return new Date(year, month, 0).getDate();
}
function getLastMonth (year, month){
  const lastMonthDate = new Date(year, parseInt(month)-1, 0);
  const date = moment(lastMonthDate).format('YYYY-MM');
  
  return date;
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
    categorySelectDivElement.classList.add('d-none');
  } else {
    categorySelectDivElement.classList.remove('d-none');
    deleteButtonElement.classList.remove('d-none');
    modifyButtonElement.classList.remove('d-none');
    dismissButtonElement.classList.add('d-none');
    submitButtonElement.classList.add('d-none');
    modifyButtonElement.removeAttribute('disabled');
    submitButtonElement.setAttribute('disabled', 'true');
    amountInputElement.value = this.getAttribute('data-amount');
    expinRadioElement.querySelector(`#${this.getAttribute('data-expin')}-radio`).checked = true;
    categorySelectElement.value = this.getAttribute("data-category");
    dateSelectorElement.value = this.getAttribute('data-date');

    if (items[this.getAttribute("data-item")] == undefined){
      itemCheckBoxElement.checked = true;
      switchMode.apply(itemCheckBoxElement);
      itemInputElement.value = this.getAttribute('data-item');
    } else {
      itemCheckBoxElement.checked = false;
      switchMode.apply(itemCheckBoxElement);
      itemSelectElement.value = this.getAttribute("data-item");
    }

    if (categories[this.getAttribute("data-category")] == undefined && this.getAttribute('data-category') != ''){
      categoryCheckBoxElement.checked = true;
      switchMode.apply(categoryCheckBoxElement);
      categoryInputElement.value = this.getAttribute('data-category');
    } else {
      categoryCheckBoxElement.checked = false;
      switchMode.apply(categoryCheckBoxElement);
      categorySelectElement.value = this.getAttribute("data-category");
    }
    
    modifyButtonElement.setAttribute('data-date', this.getAttribute('data-date'));
    modifyButtonElement.setAttribute('data-category', this.getAttribute('data-category'));
    deleteButtonElement.setAttribute('data-date', this.getAttribute('data-date'))
    modifyButtonElement.setAttribute('data-id', this.getAttribute('data-id'));
    deleteButtonElement.setAttribute('data-id', this.getAttribute('data-id'));
  }
}

function cleanModal(){
  amountInputElement.value = '';
  expenseRadioElement.checked = true;
  if (categoryCheckBoxElement.checked == true){
    categoryCheckBoxElement.checked = false;
  }
  if (itemCheckBoxElement.checked == true){
    itemCheckBoxElement.checked = false;
  }
  switchMode.apply(categoryCheckBoxElement);
  switchMode.apply(itemCheckBoxElement);
  categorySelectElement.value = '';
  itemSelectElement.value = '';
  itemInputElement.value = '';
  createAndInsertItemOption();
}

async function modifyItemData(e){
  e.preventDefault();
  const item = document.getElementById('item'+this.getAttribute('data-id'));
  const accordionBody = item.parentNode;
  const date = this.getAttribute('data-date').split('-');
  const dateSelectValue = dateSelectorElement.value.split('-');
  const itemRef = doc(getFirestore(), 'restaurant', dateSelectValue[0], 'months', dateSelectValue[1], 'days', dateSelectValue[2], 'records', this.getAttribute('data-id'));
  const itemData = {
    amount: parseInt(amountInputElement.value),
    expin: expenseRadioElement.checked == true ? 'expense' : 'income',
  }
  if (itemCheckBoxElement.checked){
    itemData['item'] = (itemInputElement.value).toLowerCase();
  } else {
    itemData['item'] = itemSelectElement.value
  }

  if (categoryCheckBoxElement.checked){
    itemData['category'] = (categoryInputElement.value).toLowerCase();
  } else {
    itemData['category'] = categorySelectElement.value
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
  if (dateSelectorElement.value != this.getAttribute('data-date')){
    itemData['timestamp'] = serverTimestamp();
    itemData['date'] = dateSelectorElement.value;
    await deleteDoc(doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'records', this.getAttribute('data-id')));
    saveMessage(itemData);
  } else {
    await updateDoc(itemRef, itemData);
  }
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
function switchMode(){
  if (this.checked){
    this.parentElement.nextElementSibling.classList.remove('d-none');
    this.parentElement.nextElementSibling.focus();
    this.parentElement.nextElementSibling.nextElementSibling.classList.add('d-none');
    
    this.parentElement.nextElementSibling.removeAttribute('disabled');
    this.parentElement.nextElementSibling.nextElementSibling.setAttribute('disabled', 'true');
  } else {
    this.parentElement.nextElementSibling.classList.add('d-none');
    this.parentElement.nextElementSibling.nextElementSibling.classList.remove('d-none');
    
    this.parentElement.nextElementSibling.setAttribute('disabled', 'true');
    this.parentElement.nextElementSibling.nextElementSibling.removeAttribute('disabled');
  }
}

async function newCategory(){
  const categoryName = (this.previousElementSibling.value).toLowerCase();
  const categoryRef = await addDoc(collection(getFirestore(), "categories"), {
    name: categoryName,
    timestamp: serverTimestamp()
  });
  
  appendToManageList(manageCategoryElement, categoryRef.id, categoryName, false, 'category');
  this.previousElementSibling.value = '';
}

async function newItem(){
  const itemName = (this.previousElementSibling.value).toLowerCase();
  const itemExpin = this.getAttribute('data-expin');
  const itemRef = await addDoc(collection(getFirestore(), "items"), {
    name: itemName,
    expin: itemExpin,
    timestamp: serverTimestamp()
  });
  
  appendToManageList(manageItemElement, itemRef.id, itemName, itemExpin, 'item');
  items[itemRef.id] = {
    name: itemName,
    expin: itemExpin
  }
  this.previousElementSibling.value = '';
  createAndInsertItemOption();
}

async function newStaff(){
  const staffName = (this.previousElementSibling.value).toLowerCase();
  const staffRef = await addDoc(collection(getFirestore(), "staff"), {
    name: staffName,
    timestamp: serverTimestamp()
  });
  
  appendToManageList(manageItemElement, staffRef.id, staffName, 'staff');
  this.previousElementSibling.value = '';
  createAndInsertStaffOption();
}

function focusItemSelectElement(){
  itemSelectElement.focus();
}

function showStaffSalaryCalendar(){
  if (this.value == ""){
    staffSalaryCalendarElement.classList.add('d-none');
    staffDaySalaryCheckBox.setAttribute('disabled', 'true');
  } else {
    staffDaySalaryCheckBox.removeAttribute('disabled');
    staffDaySalaryDefault.value = staff[this.value].daySalaryDefault;
    staffDaySalaryDefault.setAttribute('data-staff-id', this.value);
    staffSalaryCalendarElement.classList.remove('d-none');
    for (let i = 0; i < aStaffSalaryCalendarDayButtonElement.length; i++){
      const twoNum = i < 10 ? `0${i+1}` : `${i+1}`;
      aStaffSalaryCalendarDayButtonElement[i].setAttribute('data-salary-item', this.value+staffSalaryMonthSelectorElement.value+'-'+twoNum);
      aStaffSalaryCalendarDayButtonElement[i].setAttribute('data-date', staffSalaryMonthSelectorElement.value+'-'+twoNum);
    }
    getStaffSalaryData.apply(this);
  }

}
function cleanStaffSalaryModal(){
  staffSelectElement.value="";
  staffSalaryCalendarElement.classList.add('d-none');
}
function getStaffSalaryData(){
  //取得月曆所有按鈕並重置狀態
  for(let i = 0; i < aStaffSalaryCalendarDayButtonElement.length; i++){
    aStaffSalaryCalendarDayButtonElement[i].setAttribute('data-payment-status', 'none');
    checkDayButtonStatus.apply(aStaffSalaryCalendarDayButtonElement[i]);

    if(document.getElementById(aStaffSalaryCalendarDayButtonElement[i].getAttribute('data-salary-item'))){
      if(document.getElementById(aStaffSalaryCalendarDayButtonElement[i].getAttribute('data-salary-item')).getAttribute('data-payment-status') == 'pending'){
        aStaffSalaryCalendarDayButtonElement[i].setAttribute('data-payment-status', 'pending');
        checkDayButtonStatus.apply(aStaffSalaryCalendarDayButtonElement[i]);
      } else if(document.getElementById(aStaffSalaryCalendarDayButtonElement[i].getAttribute('data-salary-item')).getAttribute('data-payment-status') == 'paid'){
        aStaffSalaryCalendarDayButtonElement[i].setAttribute('data-payment-status', 'paid');
        checkDayButtonStatus.apply(aStaffSalaryCalendarDayButtonElement[i]);
      }
    }
  }

  //取得上個月需支付總金額

  //當月需支付總金額 + 上個月需支付總金額 = 總需支付金額
}
function checkDayButtonStatus(){
  if (this.getAttribute('data-payment-status') == 'none'){
    this.classList.remove('btn-success', 'btn-danger');
    this.classList.add('btn-outline-primary');
  } else if(this.getAttribute('data-payment-status') == 'pending') {
    this.classList.remove('btn-outline-primary', 'btn-success');
    this.classList.add('btn-danger');
  } else if(this.getAttribute('data-payment-status') == 'paid') {
    this.classList.remove('btn-danger', 'btn-outline-primary');
    this.classList.add('btn-success');
  }
}
function dayButtonStatusChange(){
  if (this.getAttribute('data-payment-status') == 'none'){
    this.setAttribute('data-payment-status', 'pending');
    submitStaffSalaryData.apply(this);
  } else if(this.getAttribute('data-payment-status') == 'pending') {
    this.setAttribute('data-payment-status', 'paid');
    updateStaffSalaryData.apply(this);
  } else if(this.getAttribute('data-payment-status') == 'paid') {
    this.setAttribute('data-payment-status', 'none');
    deleteStaffSalaryData.apply(this);
  }
  checkDayButtonStatus.apply(this);
}
function toggleStaffDaySalaryDefaultInput(){
  if (this.checked == true && staffSelectElement.value != ''){
    staffDaySalaryDefault.removeAttribute('disabled');
  } else {
    staffDaySalaryDefault.setAttribute('disabled', 'true');
  }
}

function loadSalaryItem(){
  modifyStaffAmountModalElement.querySelector('#staff-name').value = staff[this.getAttribute('data-id')].name;
  modifyStaffAmountModalElement.querySelector('#staff-amount').value = this.getAttribute('data-amount');
  modifyStaffAmountButtonElement.setAttribute('data-date', this.getAttribute('data-date'));
  modifyStaffAmountButtonElement.setAttribute('data-id', this.getAttribute('data-id'));
}

function modifyStaffAmountData(){
  const date = this.getAttribute('data-date').split('-');
  const staffDataRef = doc(getFirestore(), 'restaurant', date[0], 'months', date[1], 'days', date[2], 'staff', this.getAttribute('data-id'));
  const numOnlyReg = /^-?\d+$/g

  if(modifyStaffAmountModalElement.querySelector('#staff-amount').value != '' && modifyStaffAmountModalElement.querySelector('#staff-amount').value.match(numOnlyReg)){
    setDoc(staffDataRef, { amount: parseInt(modifyStaffAmountModalElement.querySelector('#staff-amount').value) }, { merge: true });
    modifyStaffAmountModalElement.querySelector('button').click();
    promptToastElement.children[0].innerHTML = "Data Updated!!";
    promptToast.show();
  } else {
    modifyStaffAmountModalElement.querySelector('#staff-amount').value = '0';
    promptToastElement.children[0].innerHTML = "Input only number!!";
    promptToast.show();
  }
}

function closeCollapseElement(){
  if (!this.classList.contains('collapsed')){
    this.click();
  }
}

// Shortcuts to DOM Elements.
var recordListElement = document.getElementById('records');
var signInModalElement = document.getElementById('sign-in-modal');
var signUpModalElement = document.getElementById('sign-up-modal');
var signInButtonElement = document.getElementById('sign-in');
var signUpButtonElement = document.getElementById('sign-up');
var monthSelectorElement = document.getElementById('month-selector');
var staffSalaryMonthSelectorElement = document.getElementById('staff-salary-month-selector');
var manageButtonElement = document.getElementById('manage');
var staffButtonElement = document.getElementById('staff');
var manageCategoryElement = document.getElementById('manage-category');
var manageItemHeadElement = document.getElementById('manage-item-head'); 
var manageItemElement = document.getElementById('manage-item');
var newCategoryButtonElement = document.getElementById('new-category-button');
var newItemButtonElement = document.getElementById('new-item-button');
var signOutButtonElement = document.getElementById('sign-out');
var promptToastElement = document.getElementById('prompt-toast');
var promptToast = new bootstrap.Toast(promptToastElement);
var categoryCheckBoxElement = document.getElementById('category-checkbox');
var categoryInputElement = document.getElementById('category-input');
var categorySelectElement = document.getElementById('category-select');
var itemCheckBoxElement = document.getElementById('item-checkbox');
var itemInputElement = document.getElementById('item-input');
var itemSelectElement = document.getElementById('item-select');
var staffSelectElement = document.getElementById('staff-select');
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
var manageItemExpenseRadio = document.getElementById('manage-item-expense-radio');
var manageItemIncomeRadio = document.getElementById('manage-item-income-radio');
var manageItemStaffRadio = document.getElementById('manage-item-staff-radio');
var manageDeleteModalElement = document.getElementById('manage-delete-modal');
var manageDeleteModal = new bootstrap.Modal(document.getElementById('manage-delete-modal'));
var manageDeleteTr = null;
var incomeAmountElement = financeMonthAmountElement.querySelector('.income-amount');
var outcomeAmountElement = financeMonthAmountElement.querySelector('.outcome-amount');
var earningAmountElement = financeMonthAmountElement.querySelector('.earning-amount');
var itemMonthExpenseRadio = document.getElementById('item-month-expense-radio');
var itemMonthIncomeRadio = document.getElementById('item-month-income-radio');
var itemMonthStaffRadio = document.getElementById('item-month-staff-radio');
var categorySelectDivElement = document.getElementById('category-select-div');
var staffSalaryCalendarElement = document.getElementById('staff-salary-calendar');
var staffDaySalaryDefault = document.getElementById('staff-day-salary-default');
var staffSalaryModal = document.getElementById('staff-salary-modal');
var staffDaySalaryCheckBox = document.getElementById('staff-day-salary-checkbox');
var modifyStaffAmountModalElement = document.getElementById('modify-staff-amount-modal');
var modifyStaffAmountButtonElement =document.getElementById('modify-staff-amount-button');
var rightSideNavbarButton = document.getElementById('right-side-navbar-button');

//calendar button
const aStaffSalaryCalendarDayButtonElement = staffSalaryCalendarElement.getElementsByTagName('a');
for(let i = 0; i < aStaffSalaryCalendarDayButtonElement.length; i++){
  aStaffSalaryCalendarDayButtonElement[i].addEventListener('click', dayButtonStatusChange);
}
//--calendar button

// Saves message on form submit.
addRecordModalElement.addEventListener('submit', onRecordFormSubmit);
signInModalElement.addEventListener('submit', signIn);
signInModalElement.addEventListener('shown.bs.modal', focusInput);
signUpModalElement.addEventListener('submit', signUp);
signUpModalElement.addEventListener('shown.bs.modal', focusInput);
itemCheckBoxElement.addEventListener('change', switchMode);
categoryCheckBoxElement.addEventListener('change', switchMode);
signOutButtonElement.addEventListener('click', signOutUser);
addRecordModalElement.addEventListener('shown.bs.modal', focusItemSelectElement);
addRecordModalElement.addEventListener('hidden.bs.modal', cleanModal);
staffSalaryModal.addEventListener('hidden.bs.modal', cleanStaffSalaryModal);
addRecordButtonElement.addEventListener('click', modalModeSwitch);
modifyButtonElement.addEventListener('click', modifyItemData);
deleteButtonElement.addEventListener('click', deleteItem);
itemMonthExpenseRadio.addEventListener('change', itemMonthRadioCheck);
itemMonthIncomeRadio.addEventListener('change', itemMonthRadioCheck);
itemMonthStaffRadio.addEventListener('change', itemMonthRadioCheck);
staffSelectElement.addEventListener('change', showStaffSalaryCalendar);
staffDaySalaryCheckBox.addEventListener('change', toggleStaffDaySalaryDefaultInput)
staffDaySalaryDefault.addEventListener('input', updateStaffDaySalaryDefault);
modifyStaffAmountButtonElement.addEventListener('click', modifyStaffAmountData);
rightSideNavbarButton.addEventListener('blur', closeCollapseElement)
//Manage Item List
manageItemExpenseRadio.addEventListener('change', manageItemRadioStateChanged);
manageItemIncomeRadio.addEventListener('change', manageItemRadioStateChanged);
manageItemStaffRadio.addEventListener('change', manageItemRadioStateChanged);

//Radio button
expenseRadioElement.addEventListener('change', toggleExpin);
incomeRadioElement.addEventListener('change', toggleExpin);

//Show this month
monthSelectorElement.value = moment(new Date()).format('YYYY-MM');
monthSelectorElement.addEventListener('change', monthSelector);
dateSelectorElement.value = moment(new Date()).format('YYYY-MM-DD');;

//Append new category/item
newCategoryButtonElement.addEventListener('click', newCategory);
newItemButtonElement.addEventListener('click', newItem);

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