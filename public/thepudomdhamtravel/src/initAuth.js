'use strict';

import initApp from './initApp';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

initApp();

function signOutUser(){
    signOut(getAuth());
}

function initFirebaseAuth() {
    // Listen to auth state changes.
    onAuthStateChanged(getAuth(), authStateObserver);
}

function authStateObserver(user){
    if(user){
        for (let i=0; i<loggedInRequiredElement.length; i++){
            loggedInRequiredElement[i].classList.remove('d-none');
        }
        for (let i=0; i<loggedOutRequiredElement.length; i++){
            loggedOutRequiredElement[i].classList.add('d-none');
        }
    } else {
        for (let i=0; i<loggedInRequiredElement.length; i++){
            loggedInRequiredElement[i].classList.add('d-none');
        }
        for (let i=0; i<loggedOutRequiredElement.length; i++){
            loggedOutRequiredElement[i].classList.remove('d-none');
        }
    }
}

const loggedInRequiredElement = document.querySelectorAll('.logged-in');
const loggedOutRequiredElement = document.querySelectorAll('.logged-out');
const signOutBtnElement = document.querySelector('#sign-out-btn');

signOutBtnElement.addEventListener('click', signOutUser);
    
export default function initAuth(){
    initFirebaseAuth();
}