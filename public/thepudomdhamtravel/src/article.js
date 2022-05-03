'use strict';

import initApp from './initApp';
import initAuth from './initAuth';
import {
getFirestore,
collection,
query,
where,
getDocs,
getDoc,
doc,
updateDoc,
deleteDoc 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import createEditor from "./createEditor";

createEditor().then(editor => {
    rdEditor = editor;
});

const db = getFirestore();
const storage = getStorage();

var articleRef = null;
var headlineRef = null;

async function loadArticle(){
    const q = query(collection(db, "articles"), where("slug", "==", location.pathname.split('/')[2]));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const article = doc.data();
        displayArticle(article, doc.id);
    });
}

async function loadHeadline(){
    const docSnap = await getDoc(headlineRef);
    if (docSnap.exists()) {
        const headline = docSnap.data();
        headlineImageElement.value = headline.cardImage;
        headlineTitleElement.value = headline.cardTitle;
        headlineTextElement.value = headline.cardText;
    } else {
        console.log('No such document!');
    }
}

function displayArticle(article, articleID) {
    contentElement.innerHTML = article.content;
    slugElement.value = article.slug;
    titleTagElement.value = article.titleTag
    metaDescriptionElement.value = article.metaDescription;
    openGraphImageUrlElement.value = article.openGraphImageURL;

    articleRef = doc(db, "articles", articleID);
    headlineRef = doc(db, "headlines", article.headlineID);
    rdEditor.setData(contentElement.innerHTML);
    loadHeadline();
}

async function updateContent(e){
    e.preventDefault();

    await updateDoc(articleRef, {
        content: rdEditor.getData(),
    }).then(function(){
        contentElement.innerHTML = rdEditor.getData();
        switchButtonsElement.children[0].click();
    });
}

async function updatePageInfo(e){
    e.preventDefault();

    await updateDoc(articleRef, {
        slug: slugElement.value,
        titleTag: titleTagElement.value,
        metaDescription: metaDescriptionElement.value,
        openGraphImageURL: openGraphImageUrlElement.value
    });

    await updateDoc(headlineRef, {
        cardLink: `/${location.pathname.split('/')[1]}/${slugElement.value}`
    }).then(function(){
        location.href = `/${location.pathname.split('/')[1]}/${slugElement.value}`;
    })
}

async function updateHeadline(e){
    e.preventDefault();
    await updateDoc(headlineRef, {
        cardImage: headlineImageElement.value,
        cardTitle: headlineTitleElement.value,
        cardText: headlineTextElement.value,
    }).then(function(){
        location.reload();
    });
}

async function uploadImage(){
    const file = this.files[0] || false;
    if (file){
        const fileType = file.type.split('/')[0];
        if (fileType == "image") {
            const fileURL = await getFileURL(file);
            this.previousElementSibling.value = fileURL;
        } else {
            headlineImageUploadElement.value = "";
            promptToastElement.querySelector('.toast-body').textContent = 'Only accept image file.';
            promptToast.show();
        }
    } else {
        return;
    }
}

//Editor
let rdEditor;

//Delete Article
async function deleteArticle(){
    console.log('article deleted');
    await deleteDoc(articleRef);
    await deleteDoc(headlineRef);
    location = `/${location.pathname.split('/')[1]}`;
}

var contentElement = document.querySelector('#content');

//Editor
var editorFormElement = document.querySelector('#editor-form');
editorFormElement.addEventListener('submit', updateContent);

//Page Info
var pageInfoFormElement = document.querySelector('#page-info-form');
var slugElement = document.querySelector('#slug');
var titleTagElement = document.querySelector('#title-tag');
var metaDescriptionElement = document.querySelector('#meta-description');
var openGraphImageUrlElement = document.querySelector('#open-graph-image-url');
var openGraphImageUrlUploadElement = document.querySelector('#open-graph-image-url-upload');
pageInfoFormElement.addEventListener('submit', updatePageInfo);

//Headline
var headlineFormElement = document.querySelector('#headline-form');
var headlineImageElement = document.querySelector('#headline-image');
var headlineImageUploadElement = document.querySelector('#headline-image-upload');
var headlineTitleElement = document.querySelector('#headline-title');
var headlineTextElement = document.querySelector('#headline-text');
headlineFormElement.addEventListener('submit', updateHeadline);



//Delete Article
var deleteArticleBtnElement = document.getElementById('delete-article-btn');
deleteArticleBtnElement.addEventListener('click', function(e){
    e.preventDefault();
})
var deleteConfirmBtnElement = document.getElementById('delete-confirm-btn');
deleteConfirmBtnElement.addEventListener('click', deleteArticle);

//Switch Buttons
var switchButtonsElement = document.getElementById('switch-buttons');
for (let i=0; i<switchButtonsElement.children.length; i++){
    switchButtonsElement.children[i].addEventListener('click', switchPage)
}

function switchPage(){
    for (let i=0; i<switchButtonsElement.children.length; i++){
        switchButtonsElement.children[i].classList.remove('active');
        document.querySelector(switchButtonsElement.children[i].getAttribute('rd-target'))
        .classList.add('d-none');
    }
    this.classList.add('active');
    document.querySelector(this.getAttribute('rd-target')).classList.remove('d-none');
}

//Image Upload
openGraphImageUrlUploadElement.addEventListener('change', uploadImage);
headlineImageUploadElement.addEventListener('change', uploadImage);

//Toast
var promptToastElement  = document.getElementById('prompt-toast')
var promptToast = new bootstrap.Toast(promptToastElement);

initApp();
initAuth();
loadArticle();