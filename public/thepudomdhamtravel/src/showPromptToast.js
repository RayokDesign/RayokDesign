'use strict'

// Template for headline card.
var PROMPT_TOAST_TEMPLATE =
`<div class="position-fixed top-0 start-50 p-3 translate-middle-x" style="z-index: 11">
<div id="prompt-toast" class="toast align-items-center text-white bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
    <div class="d-flex">
    <div class="toast-body">
    </div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
</div>
</div>`;

const container = document.createElement('div');
container.innerHTML = PROMPT_TOAST_TEMPLATE;
const div = container.firstChild;
document.querySelector("body").appendChild(div);

var promptToastElement  = document.getElementById('prompt-toast')
var promptToast = new bootstrap.Toast(promptToastElement);

export default function showPromptToast(text){
    promptToastElement.querySelector('.toast-body').textContent = text;
    promptToast.show();
}