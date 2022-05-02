'use strict';

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import initAuth from './initAuth';

initAuth();

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

var loginFormElement = document.getElementById('rd-sign-in-form');
var emailElement = document.getElementById('rd-email');
var passwordElement = document.getElementById('rd-password');

loginFormElement.addEventListener('submit', signIn);