'use strict';


import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
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
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
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
import moment from 'moment'
let dayAmount = {}, categoryAmount = {}, categories = {}, items = {}, submitData = {};

async function signIn() {
    var provider = new GoogleAuthProvider();
    await signInWithPopup(getAuth(), provider);
}

// Signs-out of Friendly Chat.
function signOutUser() {
  // TODO 2: Sign out of Firebase.
  signOut(getAuth());
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

// Triggered when the send new message form is submitted.
function onMessageFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (messageInputElement.value && checkSignedInWithMessage()) {
    saveMessage(messageInputElement.value).then(function () {
      // Clear message text field and re-enable the SEND button.
      resetMaterialTextfield(messageInputElement);
      toggleButton();
    });
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

// Resets the given MaterialTextField.
function resetMaterialTextfield(element) {
  element.value = '';
}


// Initiate firebase auth
function initFirebaseAuth() {
  // TODO 3: Subscribe to the user's signed-in status
  onAuthStateChanged(getAuth(), authStateObserver);
}
// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) {
    // User is signed in!
    // Get the signed-in user's profile pic and name.
    // var profilePicUrl = getProfilePicUrl();
    // var userName = getUserName();

    // Set the user's profile pic and name.
    // userPicElement.style.backgroundImage =
    //   'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    // userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    // userNameElement.removeAttribute('hidden');
    // userPicElement.removeAttribute('hidden');
    signOutButtonElement.classList.remove('d-none');

    // Hide sign-in button.
    signInButtonElement.classList.add('d-none');

    // We save the Firebase Messaging Device token and enable notifications.
    // saveMessagingDeviceToken();
  } else {
    // User is signed out!
    // Hide user's profile and sign-out button.
    // userNameElement.setAttribute('hidden', 'true');
    // userPicElement.setAttribute('hidden', 'true');
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
  onSnapshot(recentRecordsQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteRecord(change.doc.id);
      } else {
        getDetailData(`${year}-${month}-${day}`, change.doc.data());
        displayRecord(`${year}-${month}-${day}`, change.doc.data(), change.doc.id);
      }
    }, function(error){
      console.error(error);
    });
  });
}

// Loads chat messages history and listens for upcoming ones.
function getDetailData(id, itemData) {
  if (itemData.expin == 'income'){
    typeof(dayAmount[id]) == 'undefined' ? dayAmount[id] = itemData.amount : dayAmount[id] += itemData.amount;
    typeof(categoryAmount[`${itemData.category}${id}`]) == 'undefined' ? categoryAmount[`${itemData.category}${id}`] = itemData.amount : categoryAmount[`${itemData.category}${id}`] += itemData.amount;
  } else {
    typeof(dayAmount[id]) == 'undefined' ? dayAmount[id] = -itemData.amount : dayAmount[id] -= itemData.amount;
    typeof(categoryAmount[`${itemData.category}${id}`]) == 'undefined' ? categoryAmount[`${itemData.category}${id}`] = -itemData.amount : categoryAmount[`${itemData.category}${id}`] -= itemData.amount;
  }
}

// Template for messages.
var MESSAGE_TEMPLATE =
`<div class="mb-2 border border-2 border-success rounded">
  <div class="row mb-2 fs-5">
    <div class="col record-date"></div>
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
  category.setAttribute('id', `${itemData.category}${id}`);

  recordListElement.querySelector('#date'+ id).querySelector('.accordion').appendChild(category);

  return category;
}


var ITEM_TEMPLATE = 
`<div class="btn item d-flex justify-content-between" data-bs-toggle="modal" data-bs-target="#add-record-modal" onclick="modalModeSwitch();">
  <span class="item-name"></span>
  <span class="item-amount align-self-center"></span>
</div>`;

function createAndInsertItem(id, itemData, docID) {
  const container = document.createElement('div');
  container.innerHTML = ITEM_TEMPLATE;
  const item = container.firstChild;
  item.setAttribute('id', docID);

  recordListElement.querySelector(`#${itemData.category}${id}`).querySelector('.accordion-body').appendChild(item);

  return item;
}

var MEMO_TEMPLATE = 
`<div class="row">
  <div class="col memo">
    <textarea rows="2" class="form-control" placeholder="Write memo here..."></textarea>
  </div>
</div>`;

function createAndInsertMemo(id) {
  const container = document.createElement('div');
  container.innerHTML = MEMO_TEMPLATE;
  const memo = container.firstChild;
  memo.setAttribute('id', `memo${id}`);

  recordListElement.querySelector('#date'+ id).appendChild(memo);

  return memo;
}
// Displays a Message in the UI.
function displayRecord(id, itemData, docID) {
  var div = document.getElementById('date' + id) || createAndInsertMessage(id);
  var category = document.getElementById(`${itemData.category}${id}`) || createAndInsertCategory(id, itemData);
  var item = document.getElementById(docID) || createAndInsertItem(id, itemData, docID);
  var memo = document.getElementById(`memo${id}`) || createAndInsertMemo(id);

  div.querySelector('.record-date').textContent = moment(id).format('DD dddd YYYY MMMM');
  div.querySelector('.day-amount').textContent = amountFormat(dayAmount[id]);
  category.querySelector('.accordion-header').setAttribute('data-bs-target', '#accordion' + itemData.timestamp.seconds);
  category.querySelector('.category-name').textContent = categories[itemData.category];
  category.querySelector('.category-amount').textContent = amountFormat(categoryAmount[itemData.category+id]);
  category.querySelector('.collapse').setAttribute('id', 'accordion' + itemData.timestamp.seconds);
  item.querySelector('.item-name').textContent = items[itemData.item];
  item.querySelector('.item-amount').textContent = amountFormat(itemData.amount);

  if (dayAmount[id] > 0){
    div.querySelector('.day-amount').classList.add('text-primary');
  } else {
    div.querySelector('.day-amount').classList.add('text-danger');
  }
  if (itemData.expin == 'income'){
    item.querySelector('.item-amount').classList.add('text-primary');
  } else {
    item.querySelector('.item-amount').classList.add('text-danger');
  }
}

// Delete a Message from the UI.
function deleteRecord(id) {
  var table = document.getElementById(id);
  // If an element for that message exists we delete it.
  if (table) {
    table.parentNode.removeChild(table);
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
    onSnapshot(recentRecordsQuery, function(snapshot) {
      snapshot.docChanges().forEach(function(change) {
        if (change.type === 'removed') {
          deleteRecord(change.doc.id);
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
  onSnapshot(recentRecordsQuery, function(snapshot) {
    snapshot.docChanges().forEach(function(change) {
      if (change.type === 'removed') {
        deleteRecord(change.doc.id);
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
    submitData['timestamp'] = new Date(dateSelectorElement.value);
    saveMessage(submitData);
    cleanUpModal();
  }
}

function toggleExpin() {
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
function monthSelector() {
  let date = moment(new Date()).format('YYYY-MM-DD').split('-');
  let days = getDaysInMonth(date[0], date[1]);
  monthSelectorElement.setAttribute('value', date[0]+'-'+date[1]);
  dateSelectorElement.setAttribute('value', date[0]+'-'+date[1]+'-'+date[2]);

  for (let day=1; day<=days; day++){
    if (day<10){day='0'+day}
    loadRecords(date[0], date[1], `${day}`);
  }
}

// Saves a new message on the Cloud Firestore.
async function saveMessage(messageText) {
  console.log(JSON.stringify(messageText));
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
    console.log('bb');
  } else {
    deleteButtonElement.classList.remove('d-none');
    modifyButtonElement.classList.remove('d-none');
    dismissButtonElement.classList.add('d-none');
    submitButtonElement.classList.add('d-none');
    console.log('aa');
  }
}

function cleanUpModal(){
  dismissButtonElement.click();
  amountInputElement.value = '';
}

// Shortcuts to DOM Elements.
var recordListElement = document.getElementById('records');
var signInButtonElement = document.getElementById('sign-in');
var monthSelectorElement = document.getElementById('month-selector');
var signOutButtonElement = document.getElementById('sign-out');
var signInToastElement = document.getElementById('must-signin-toast')

var recordFormElement = document.getElementById('record-form');
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

// Saves message on form submit.
recordFormElement.addEventListener('submit', onRecordFormSubmit);
categorySelectElement.addEventListener('change', selectChange);
itemSelectElement.addEventListener('change', selectChange);
signOutButtonElement.addEventListener('click', signOutUser);
signInButtonElement.addEventListener('click', signIn);
addRecordModalElement.addEventListener('shown.bs.modal', focusInput);
addRecordButtonElement.addEventListener('click', modalModeSwitch);

//Radio button
expenseRadioElement.addEventListener('change', toggleExpin);
incomeRadioElement.addEventListener('change', toggleExpin);

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
loadCategoriesList();
loadItemsList();
monthSelector();