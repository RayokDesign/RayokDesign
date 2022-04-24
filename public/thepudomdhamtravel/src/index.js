'use strict';

import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut} from "firebase/auth";

import { getFirebaseConfig } from '../../../connections/thepudomdhamtravel/firebase-config.js';

// Set the configuration for your app
// TODO: Replace with your app's config object

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);

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

signOutButtonElement.addEventListener('click', signOutUser)

initFirebaseAuth();