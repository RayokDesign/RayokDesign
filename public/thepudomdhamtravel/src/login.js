'use strict';

import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import showPromptToast from "./showPromptToast";
import initApp from "./initApp";

initApp();

function signIn(e){
    e.preventDefault();
    signInWithEmailAndPassword(getAuth(), this.querySelector('#sign-in-email').value, this.querySelector('#sign-in-password').value)
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

function resetPassword(e){
    e.preventDefault();
    sendPasswordResetEmail(getAuth(), this.querySelector('#reset-password-email').value)
    .then(() => {
        // Password reset email sent!
        // ..
        showPromptToast('Password reset email sent!');
        setTimeout(function(){
            showSignInForm(e);
            showPromptToast('Sign in after reset email!');
        }, 2000);
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        switch (errorCode){
            case "auth/invalid-email":
                showPromptToast('Email can\'t find');
                break;
            default:
                showPromptToast(errorMessage);
        }
        console.log(errorCode);
        console.log(errorMessage);
        // ..
    });
}

function showResetPassForm(e){
    e.preventDefault();
    resetPassFormElement.classList.remove('d-none');
    signInFormElement.classList.add('d-none');
    pageHeadingElement.innerText = 'ลืมรหัสผ่าน';
}

function showSignInForm(e){
    e.preventDefault();
    resetPassFormElement.classList.add('d-none');
    signInFormElement.classList.remove('d-none');
    pageHeadingElement.innerText = 'ผู้ดูแลระบบเข้าสู่ระบบ';
}


var signInFormElement = document.getElementById('sign-in-form');
var resetPassFormElement = document.getElementById('reset-password-form');
var showSignInPageBtnElement = resetPassFormElement.querySelector('a');
var showResetPasswordPageBtnElement = signInFormElement.querySelector('a');
var pageHeadingElement = document.querySelector('#page-heading');

showSignInPageBtnElement.addEventListener('click', showSignInForm);
showResetPasswordPageBtnElement.addEventListener('click', showResetPassForm);


signInFormElement.addEventListener('submit', signIn);
resetPassFormElement.addEventListener('submit', resetPassword);