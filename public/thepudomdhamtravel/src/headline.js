'use strict';

 import { initializeApp } from 'firebase/app';

 import {
   getFirestore,
   collection,
   query,
   where,
   orderBy,
   setDoc,
   addDoc,
   getDocs,
   serverTimestamp
 } from 'firebase/firestore';

import { getFirebaseConfig } from '../../../connections/thepudomdhamtravel/firebase-config.js';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


 // Set the configuration for your app
// TODO: Replace with your app's config object
const app = initializeApp(getFirebaseConfig());
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const imagesRef = ref(storage, 'images');

async function loadCards(){
    const q = query(collection(db, "headlines"), where("country", "==", window.location.pathname.split('/')[1]), orderBy('timestamp'));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        var headline = doc.data();
        displayCard(doc.id, headline.cardImage, headline.cardTitle, headline.cardText, headline.cardLink)
    });
}

   // Displays a Message in the UI.
function displayCard(headlineID, cardImage, cardTitle, cardText, cardLink) {
    var div = document.getElementById(headlineID) || createAndInsertCard(headlineID);

    div.querySelector('.card-img-top').src = cardImage;
    div.querySelector('.card-title').textContent = cardTitle;
    div.querySelector('.card-text').textContent = cardText;
    div.querySelector('a').href = cardLink;
}

// Template for headline card.
var HEADLINE_CARD_TEMPLATE =
`<div class="col-sm-6 mb-3">
<div class="card">
    <div class="card-img-box">
        <img src="" class="card-img-top card-img-fit-parent-box" alt="...">
    </div>
    <div class="card-body">
        <h5 class="card-title">Card title</h5>
        <div class="card-text-box overflow-hidden mb-3">
            <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
        </div>
        <a href="#" class="btn btn-primary stretched-link">อ่านต่อ</a>
    </div>
</div>
</div>`;

function createAndInsertCard(headlineID) {
    const container = document.createElement('div');
    container.innerHTML = HEADLINE_CARD_TEMPLATE;
    const div = container.firstChild;
    div.setAttribute('id', headlineID);
  
    cardListElement.appendChild(div);
    return div;
}

async function addHeadline(e){
    e.preventDefault();

    if(formChecker()){
        this.querySelector('button[type="submit"]').setAttribute('disabled', '')
        const file = headlineImageUploadElement.files[0];
        const storageRef = ref(storage, 'images/' + file.name);
        await uploadBytes(storageRef, file).then(async(snapshot) => {
            const docRef = await addDoc(collection(db, 'headlines'), {
                cardImage: headlineImageElement.value,
                cardTitle: headlineTitleElement.value,
                cardText: headlineTextElement.value,
                country: window.location.pathname.split('/')[1],
                timestamp: serverTimestamp()
            });
            await setDoc(docRef, { cardLink: `${window.location.pathname}/${docRef.id}` }, { merge: true });
            addArticleElement(docRef.id);
        });
        window.location.reload();
    }
}

async function addArticleElement(headlineID){
    await addDoc(collection(db, "articles"), {
        headlineID: headlineID,
        slug: headlineID,
        titleTag: '',
        metaDescription: '',
        openGraphImageURL: '',
        content: '',
        timestamp: serverTimestamp()
    });
}

function formChecker(){
    if (headlineImageElement.value == ''){
        promptToastElement.querySelector('.toast-body').textContent = 'Please upload card image.'
        promptToast.show();
        return false;
    } else if(headlineTitleElement.value == '') {
        promptToastElement.querySelector('.toast-body').textContent = 'Please input card title.'
        promptToast.show();
        return false;
    } else if(headlineTextElement.value == '') {
        promptToastElement.querySelector('.toast-body').textContent = 'Please input card text.';
        promptToast.show();
        return false;
    } else {
        return true;
    }
}

async function uploadImage(){
    const file = this.files[0];
    const _this = this;
    // 'file' comes from the Blob or File API
    uploadBytes(imagesRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            _this.previousElementSibling.value = downloadURL;
        });
    });
}

function signOutUser(){
    signOut(getAuth());
}

function initFirebaseAuth() {
    // Listen to auth state changes.
    onAuthStateChanged(auth, authStateObserver);
}

function authStateObserver(user){
    if(user){
        rdSignOutBtnElement.classList.remove('d-none');
        rdSignInBtnElement.classList.add('d-none');
        addHeadlineFormElement.parentElement.classList.remove('d-none');
    } else {
        rdSignOutBtnElement.classList.add('d-none');
        rdSignInBtnElement.classList.remove('d-none');
        addHeadlineFormElement.parentElement.classList.add('d-none');
    }
}


var cardListElement = document.getElementById('card-list')
var addHeadlineFormElement = document.getElementById('add-article-form');
var headlineImageUploadElement = document.getElementById('headline-image-upload');
var headlineImageElement = document.getElementById('headline-image');
var headlineTitleElement = document.getElementById('headline-title');
var headlineTextElement = document.getElementById('headline-text');
var promptToastElement  = document.getElementById('prompt-toast')
var promptToast = new bootstrap.Toast(promptToastElement);

//member
var rdSignInBtnElement = document.getElementById('rd-sign-in-btn');
var rdSignOutBtnElement = document.getElementById('rd-sign-out-btn');

rdSignOutBtnElement.addEventListener('click', signOutUser);

headlineImageUploadElement.addEventListener('change', uploadImage);
addHeadlineFormElement.addEventListener('submit', addHeadline);

loadCards();
initFirebaseAuth();