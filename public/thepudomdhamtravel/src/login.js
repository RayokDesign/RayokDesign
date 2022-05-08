'use strict';

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import initAuth from './initAuth';
import showPromptToast from "./showPromptToast";

initAuth();

function signIn(e){
    e.preventDefault();
    signInWithEmailAndPassword(getAuth(), emailElement.value, passwordElement.value)
    .then(() => {
        window.location.href='/';
    })
    .catch((error) => {
          // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        switch (errorCode){
            case "auth/invalid-email":
                showPromptToast('Email format incorrect');
                break;
            case "auth/user-disabled":
                showPromptToast('User is disabled');
                break;
            case "auth/user-not-found":
                showPromptToast('User not found');
                break;
            case "auth/wrong-password": 
                showPromptToast('Wrong password');
                break;
            default:
                showPromptToast(errorMessage);
        }
    })
}

var loginFormElement = document.getElementById('rd-sign-in-form');
var emailElement = document.getElementById('rd-email');
var passwordElement = document.getElementById('rd-password');

loginFormElement.addEventListener('submit', signIn);