'use strict';

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";
import {
    getFirestore,
    doc,
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

async function uploadVideo(){
    const file = this.files[0];
    const videoRef = ref(storage, 'videos'+'/'+new Date().getTime()+'.'+this.files[0].type.split('/')[1]);
    const _this = this;
    // 'file' comes from the Blob or File API
    uploadBytes(videoRef, file).then((snapshot) => {
        console.log('Uploaded a blob or file!');
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            _this.previousElementSibling.value = downloadURL;
            _this.nextElementSibling.removeAttribute('disabled');
        });
    });
}

async function updateAboutPage(e){
    e.preventDefault();
    const aboutRef = doc(db, "pages", "about");

    await updateDoc(aboutRef, {
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

slideUploader1.addEventListener('change', uploadVideo);
slideUploader2.addEventListener('change', uploadVideo);
slideUploader3.addEventListener('change', uploadVideo);
slideUploader4.addEventListener('change', uploadVideo);
slideUploader5.addEventListener('change', uploadVideo);
slideUploader6.addEventListener('change', uploadVideo);
slideUploader7.addEventListener('change', uploadVideo);
slideUploader8.addEventListener('change', uploadVideo);

//Update Image
var slideFormElement1 = document.querySelector("#slide1");
var slideFormElement2 = document.querySelector("#slide2");
var slideFormElement3 = document.querySelector("#slide3");
var slideFormElement4 = document.querySelector("#slide4");
var slideFormElement5 = document.querySelector("#slide5");
var slideFormElement6 = document.querySelector("#slide6");
var slideFormElement7 = document.querySelector("#slide7");
var slideFormElement8 = document.querySelector("#slide8");

slideFormElement1.addEventListener('submit', updateAboutPage);
slideFormElement2.addEventListener('submit', updateAboutPage);
slideFormElement3.addEventListener('submit', updateAboutPage);
slideFormElement4.addEventListener('submit', updateAboutPage);
slideFormElement5.addEventListener('submit', updateAboutPage);
slideFormElement6.addEventListener('submit', updateAboutPage);
slideFormElement7.addEventListener('submit', updateAboutPage);
slideFormElement8.addEventListener('submit', updateAboutPage);

signOutButtonElement.addEventListener('click', signOutUser)

initFirebaseAuth();
document.querySelector('.nav-link[href="/about"]').classList.add('active');