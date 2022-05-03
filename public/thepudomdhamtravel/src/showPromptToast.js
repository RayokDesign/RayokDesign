'use strict'

var promptToastElement  = document.getElementById('prompt-toast')
var promptToast = new bootstrap.Toast(promptToastElement);

export default function showPromptToast(text){
    promptToastElement.querySelector('.toast-body').textContent = text;
    promptToast.show();
}