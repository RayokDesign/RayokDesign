import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

import { getFirebaseConfig } from '../../../connections/thepudomdhamtravel/firebase-config.js';

 // Set the configuration for your app
// TODO: Replace with your app's config object
const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);

function signIn(e){
    e.preventDefault();
    signInWithEmailAndPassword(getAuth(), emailElement.value, passwordElement.value)
    .then(() => {
        window.location.href='/';
    })
    .catch((error) => {
        console.log(error);
    })
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

var loginFormElement = document.getElementById('rd-sign-in-form');
var emailElement = document.getElementById('rd-email');
var passwordElement = document.getElementById('rd-password');
var signInButtonElement = document.getElementById('rd-sign-in-btn');
var signOutButtonElement = document.getElementById('rd-sign-out-btn');

loginFormElement.addEventListener('submit', signIn);
initFirebaseAuth();