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
async function authStateObserver(user) {
  if (user) {
    const userRef = doc(getFirestore(), "users", user.uid);
    try {
      await getDoc(userRef);
      loadCategoriesList();
      loadItemsList();
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
    signInButtonElement.classList.add('d-none');
    signUpButtonElement.classList.add('d-none');

  } else {
    // Show sign-in button.
    signOutButtonElement.classList.add('d-none');
    manageButtonElement.classList.add('d-none');
    signInButtonElement.classList.remove('d-none');
    signUpButtonElement.classList.remove('d-none');
  }
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
  <span class="item-name text-capitalize"></span>
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

  itemMonthAmountElement.textContent = '';

  for (let itemName in itemMonthAmount){
    const container = document.createElement('div');
    container.innerHTML = ITEM_MONTH_AMOUNT_TEMPLATE;
    const item = container.firstChild;
    item.setAttribute('data-expin', itemMonthAmount[itemName].expin);
    item.querySelector('.item-month-name').textContent = itemName;
    item.querySelector('.item-month-amount').textContent = amountFormat(itemMonthAmount[itemName].amount);
  
    itemMonthAmountElement.appendChild(item);
  }
  itemMonthRadioCheck();

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
  const aExpenseItems = itemMonthAmountElement.querySelectorAll('div[data-expin = "expense"]');
  const aIncomeItems = itemMonthAmountElement.querySelectorAll('div[data-expin = "income"]');
  if (itemMonthExpenseRadio.checked){
    if (aExpenseItems.length != 0){
      for (let i=0; i<aExpenseItems.length; i++){
        aExpenseItems[i].classList.remove('d-none');
      }
    }
    if (aIncomeItems.length != 0){
      for (let i=0; i<aIncomeItems.length; i++){
        aIncomeItems[i].classList.add('d-none');
      }
    }
  } else {
    if (aExpenseItems.length != 0){
      for (let i=0; i<aExpenseItems.length; i++){
        aExpenseItems[i].classList.add('d-none');
      }
    }
    if (aIncomeItems.length != 0){
      for (let i=0; i<aIncomeItems.length; i++){
        aIncomeItems[i].classList.remove('d-none');
      }
    }
  }
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
    //div.parentNode.removeChild(div);
    div.classList.add('d-none');
  }
  calculateAmount();
  bodyResize();
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
  manageItemExpenseRadio.checked = true;
  manageItemRadioStateChanged();
}

function manageItemRadioStateChanged(){
  const manageItemTrElements = manageItemElement.getElementsByTagName('tr');

  if (manageItemExpenseRadio.checked){
    for (let i=0; i<manageItemTrElements.length; i++){
      if (manageItemTrElements[i].getAttribute('data-expin') == 'expense'){
        manageItemTrElements[i].classList.remove('d-none');
      } else {
        manageItemTrElements[i].classList.add('d-none');
      }
    }
    newItemButtonElement.setAttribute('data-expin', 'expense');
  } else {
    for (let i=0; i<manageItemTrElements.length; i++){
      if (manageItemTrElements[i].getAttribute('data-expin') == 'income'){
        manageItemTrElements[i].classList.remove('d-none');
      } else {
        manageItemTrElements[i].classList.add('d-none');
      }
    }
    newItemButtonElement.setAttribute('data-expin', 'income');
  }
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

function toggleExpin() {
  createAndInsertItemOption();
  
  itemSelectElement.focus();
}
var mouseDownEvent = new MouseEvent('mousedown', {
    'bubbleds': true,
    'cancelable': true
});
//Load date from date
async function monthSelector() {
  recordListElement.textContent = '';
  itemMonthExpenseRadio.checked = true;
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
  expenseRadioElement.setAttribute('checked', 'true');
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
  this.previousElementSibling.value = '';
}
function focusItemSelectElement(){
  itemSelectElement.focus();
}

function focusNumInput(){
  amountInputElement.focus();
}

// Shortcuts to DOM Elements.
var recordListElement = document.getElementById('records');
var signInModalElement = document.getElementById('sign-in-modal');
var signUpModalElement = document.getElementById('sign-up-modal');
var signInButtonElement = document.getElementById('sign-in');
var signUpButtonElement = document.getElementById('sign-up');
var monthSelectorElement = document.getElementById('month-selector');
var manageButtonElement = document.getElementById('manage');
var manageCategoryElement = document.getElementById('manage-category');
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
var manageDeleteModalElement = document.getElementById('manage-delete-modal');
var manageDeleteModal = new bootstrap.Modal(document.getElementById('manage-delete-modal'));
var manageDeleteTr = null;
var incomeAmountElement = financeMonthAmountElement.querySelector('.income-amount');
var outcomeAmountElement = financeMonthAmountElement.querySelector('.outcome-amount');
var earningAmountElement = financeMonthAmountElement.querySelector('.earning-amount');
var itemMonthExpenseRadio = document.getElementById('item-month-expense-radio');
var itemMonthIncomeRadio = document.getElementById('item-month-income-radio');
var categorySelectDivElement = document.getElementById('category-select-div');

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
addRecordButtonElement.addEventListener('click', modalModeSwitch);
modifyButtonElement.addEventListener('click', modifyItemData);
deleteButtonElement.addEventListener('click', deleteItem);
itemMonthExpenseRadio.addEventListener('change', itemMonthRadioCheck);
itemMonthIncomeRadio.addEventListener('change', itemMonthRadioCheck);
itemSelectElement.addEventListener('change', focusNumInput)
//Manage Item List
manageItemExpenseRadio.addEventListener('change', manageItemRadioStateChanged);
manageItemIncomeRadio.addEventListener('change', manageItemRadioStateChanged);

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