'use strict';

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
} from 'firebase/firestore';

import { getFirebaseConfig } from '../../../connections/thepudomdhamtravel/firebase-config.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Set the configuration for your app
// TODO: Replace with your app's config object


const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// const imagesRef = ref(storage, 'images');

function signOutUser(){
    signOut(getAuth());
}

function initFirebaseAuth() {
    // Listen to auth state changes.
    onAuthStateChanged(auth, authStateObserver);
}

function authStateObserver(user){
    console.log(user);
    if(user){
        signOutButtonElement.classList.remove('d-none');
        signInButtonElement.classList.add('d-none');
    } else {
        signOutButtonElement.classList.add('d-none');
        signInButtonElement.classList.remove('d-none');
    }
}

var signInButtonElement = document.getElementById('rd-sign-in-btn');
var signOutButtonElement = document.getElementById('rd-sign-out-btn');
//Slide Images
var slideImagesElement = document.querySelector(".carousel-inner").getElementsByTagName('img');
console.log(slideImagesElement)
//Switch Buttons
var switchButtonsElement = document.getElementById('switch-buttons').getElementsByTagName('button');
for (let i=0; i<switchButtonsElement.length; i++){
    switchButtonsElement[i].addEventListener('click', switchPage)
}

function switchPage(){
    for (let i=0; i<switchButtonsElement.length; i++){
        switchButtonsElement[i].classList.remove('active');
        document.querySelector(switchButtonsElement[i].getAttribute('rd-target'))
        .classList.add('d-none');
    }
    this.classList.add('active');
    document.querySelector(this.getAttribute('rd-target')).classList.remove('d-none');
}

async function uploadImage(){
    const file = this.files[0];
    const imageRef = ref(storage, 'images'+'/'+new Date().getTime()+'.'+this.files[0].type.split('/')[1]);
    const _this = this;
    // 'file' comes from the Blob or File API
    uploadBytes(imageRef, file).then((snapshot) => {
        console.log('Uploaded a blob or file!');
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            _this.previousElementSibling.value = downloadURL;
            _this.nextElementSibling.removeAttribute('disabled');
        });
    });
}

async function updateSlideImage(e){
    e.preventDefault();
    const indexRef = doc(db, "pages", "index");

    await updateDoc(indexRef, {
        [this.id]: this.querySelector('input[type="text"]').value
    }).then(function(){
        location.reload();
    });
}
//Image Upload
var slideUploader1 = document.querySelector("#slide-uploader-1")
var slideUploader2 = document.querySelector("#slide-uploader-2")
var slideUploader3 = document.querySelector("#slide-uploader-3")
var slideUploader4 = document.querySelector("#slide-uploader-4")
var slideUploader5 = document.querySelector("#slide-uploader-5")
var slideUploader6 = document.querySelector("#slide-uploader-6")
var slideUploader7 = document.querySelector("#slide-uploader-7")
var slideUploader8 = document.querySelector("#slide-uploader-8")

slideUploader1.addEventListener('change', uploadImage);
slideUploader2.addEventListener('change', uploadImage);
slideUploader3.addEventListener('change', uploadImage);
slideUploader4.addEventListener('change', uploadImage);
slideUploader5.addEventListener('change', uploadImage);
slideUploader6.addEventListener('change', uploadImage);
slideUploader7.addEventListener('change', uploadImage);
slideUploader8.addEventListener('change', uploadImage);

//Update Image
var slideFormElement1 = document.querySelector("#slide1");
var slideFormElement2 = document.querySelector("#slide2");
var slideFormElement3 = document.querySelector("#slide3");
var slideFormElement4 = document.querySelector("#slide4");
var slideFormElement5 = document.querySelector("#slide5");
var slideFormElement6 = document.querySelector("#slide6");
var slideFormElement7 = document.querySelector("#slide7");
var slideFormElement8 = document.querySelector("#slide8");

slideFormElement1.addEventListener('submit', updateSlideImage);
slideFormElement2.addEventListener('submit', updateSlideImage);
slideFormElement3.addEventListener('submit', updateSlideImage);
slideFormElement4.addEventListener('submit', updateSlideImage);
slideFormElement5.addEventListener('submit', updateSlideImage);
slideFormElement6.addEventListener('submit', updateSlideImage);
slideFormElement7.addEventListener('submit', updateSlideImage);
slideFormElement8.addEventListener('submit', updateSlideImage);



signOutButtonElement.addEventListener('click', signOutUser)

initFirebaseAuth();
document.querySelector('.nav-link[href="/"]').classList.add('active');