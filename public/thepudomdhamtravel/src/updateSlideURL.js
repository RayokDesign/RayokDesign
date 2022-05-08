'use strict';

import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import getFileURL from './getFileURL';

let carousel = new bootstrap.Carousel(carouselExampleIndicators);
let rdCarousel = document.getElementById('carouselExampleIndicators');

rdCarousel.onmouseover = function(){
    carousel.pause();
}
rdCarousel.onmouseout = function(){
    carousel.cycle();
}

function showFileInput(){
    rdCarousel.onmouseover = null;
    rdCarousel.onmouseout = null;
    carousel.pause();
    this.classList.add('d-none');
    this.nextElementSibling.classList.remove('d-none');
}

function initUploader(){
    rdCarousel.onmouseover = function(){
        carousel.pause();
    }
    rdCarousel.onmouseout = function(){
        carousel.cycle();
    }
    carousel.cycle();
    this.parentElement.classList.add('d-none');
    this.parentElement.previousElementSibling.classList.remove('d-none');
    this.parentElement.children[0].value = "";
    this.parentElement.children[0].removeAttribute('disabled');
    this.parentElement.children[1].classList.add('d-none');
}
async function showConfirmBtn(){
    this.setAttribute('disabled', 'true');
    const file = this.files[0];
    const fileURL = await getFileURL(file);
    this.nextElementSibling.classList.remove('d-none');
    this.nextElementSibling.setAttribute('rd-data-url', fileURL);
}

async function updateFirestore(){
    const docID = this.getAttribute('rd-data-doc-id');
    const docRef = doc(getFirestore(), "pages", docID);
    const _this = this;
    await updateDoc(docRef, {
        [this.id]: this.getAttribute('rd-data-url')
    }).then(function(){
        _this.parentElement.parentElement.parentElement.children[0].setAttribute('src', _this.getAttribute('rd-data-url'));
        initUploader.call(_this);
    });
}

export default function updateSlideURL(){
    const editBtnsElement = document.querySelectorAll('.edit-btn');
    for (let i=0; i<editBtnsElement.length; i++){
        editBtnsElement[i].addEventListener('click', showFileInput);
        const cancelBtnElement = editBtnsElement[i].nextElementSibling.children[2];
        cancelBtnElement.addEventListener('click', initUploader);

        const fileInputElement = editBtnsElement[i].nextElementSibling.children[0];
        fileInputElement.addEventListener('change', showConfirmBtn);

        const confirmBtnElement = editBtnsElement[i].nextElementSibling.children[1];
        confirmBtnElement.addEventListener('click', updateFirestore);
    }
}