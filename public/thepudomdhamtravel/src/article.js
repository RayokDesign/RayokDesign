'use strict';

import { initializeApp } from 'firebase/app';

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
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage";


import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageInsert from '@ckeditor/ckeditor5-image/src/imageinsert';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import ImageResize from '@ckeditor/ckeditor5-image/src/imageresize';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageBlock from '@ckeditor/ckeditor5-image/src/imageblock';
import ImageInline from '@ckeditor/ckeditor5-image/src/imageinline';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import LinkImage from '@ckeditor/ckeditor5-link/src/linkimage';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Font from '@ckeditor/ckeditor5-font/src/font';



import { getFirebaseConfig } from '../../../connections/thepudomdhamtravel/firebase-config.js';

function createEditor(){
    ClassicEditor
    .create( document.querySelector( '#rd-editor' ) , {
        extraPlugins: [ MyCustomUploadAdapterPlugin ],
        plugins: [ Essentials, Font, Bold, Italic, Underline, Strikethrough, Paragraph, Heading, Image, ImageBlock, ImageInline, ImageResize, ImageInsert, ImageCaption, ImageStyle, ImageToolbar, LinkImage, Alignment ],
        toolbar: [ 'heading', 'fontColor', 'bold', 'italic', 'underline', 'strikethrough', '|', 'ImageInsert', 'alignment', '|', 'undo', 'redo' ],
        image: {
            toolbar: [
                {
                    name: 'inline',
                    title: 'Wrap text',
                    items: [ 'imageStyle:alignLeft', 'imageStyle:alignRight' ],
                    defaultItem: 'imageStyle:alignLeft'
                },
                {
                    name: 'block',
                    title: 'Break text',
                    items: [ 'imageStyle:alignBlockLeft', 'imageStyle:block', 'imageStyle:alignBlockRight' ],
                    defaultItem: 'imageStyle:block'
                },
                'resizeImage',
            ]
        },
        heading: {
            options: [
                { model: 'paragraph', title: 'ย่อหน้า', class: 'ck-heading_paragraph'  },
                { model: 'heading1', view: 'h1', title: 'ชื่อเรื่องหนึ่ง', class: 'ck-heading_heading1'},
                { model: 'heading2', view: 'h2', title: 'ชื่อเรื่องที่สอง', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'ชื่อเรื่องสาม', class: 'ck-heading_heading3' }
            ]
        },
        fontColor: {
            colors: [
                {
                    color: '#0d6efd',
                    label: 'Blue'
                },
                {
                    color: '#6610f2',
                    label: 'Indigo'
                },
                {
                    color: '#6f42c1',
                    label: 'Purple'
                },
                {
                    color: '#d63384',
                    label: 'Pink'
                },
                {
                    color: '#dc3545',
                    label: 'Red'
                },
                {
                    color: '#fd7e14',
                    label: 'Orange'
                },
                {
                    color: '#ffc107',
                    label: 'Yellow'
                },
                {
                    color: '#198754',
                    label: 'Green'
                },
                {
                    color: '#20c997',
                    label: 'Teal'
                },
                {
                    color: '#0dcaf0',
                    label: 'Cyan'
                },
                {
                    color: '#adb5bd',
                    label: 'Gray'
                },
                {
                    color: '#000',
                    label: 'Black'
                }
            ]
        },
    } )
    .then( editor => {
        editor.setData(contentElement.innerHTML);
        ckEditorElement = editor;
    } )
    .catch( error => {
        console.error( error.stack );
    } );
}

 // Set the configuration for your app
// TODO: Replace with your app's config object
const app = initializeApp(getFirebaseConfig());
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

var articleRef = null;
var headlineRef = null;

const imagesRef = ref(storage, 'images');

function signOutUser(){
    signOut(getAuth());
}

function initFirebaseAuth() {
    // Listen to auth state changes.
    onAuthStateChanged(auth, authStateObserver);
}

function authStateObserver(user){
    if(user){
        switchButtonsElement.classList.remove('d-none');
        signOutButtonElement.classList.remove('d-none');
        signInButtonElement.classList.add('d-none');
    } else {
        switchButtonsElement.classList.add('d-none');
        signOutButtonElement.classList.add('d-none');
        signInButtonElement.classList.remove('d-none');
    }
}

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

   // Displays a Message in the UI.
function displayArticle(article, articleID) {
    contentElement.innerHTML = article.content;
    slugElement.value = article.slug;
    titleTagElement.value = article.titleTag
    metaDescriptionElement.value = article.metaDescription;
    openGraphImageUrlElement.value = article.openGraphImageURL;

    articleRef = doc(db, "articles", articleID);
    headlineRef = doc(db, "headlines", article.headlineID);
    createEditor();
    loadHeadline();
}

async function updateContent(e){
    e.preventDefault();

    await updateDoc(articleRef, {
        content: ckEditorElement.getData(),
    }).then(function(){
        contentElement.innerHTML = ckEditorElement.getData();
        switchButtonsElement.children[0].click();
    });

    // await updateDoc(headlineRef, {
    //     linkUrl: `/${location.pathname.split('/')[1]}/${slugElement.value}`
    // }).then(function(){
    //     location.href = `/${location.pathname.split('/')[1]}/${slugElement.value}`;
    // })
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
    const file = this.files[0];
    const _this = this;
    // 'file' comes from the Blob or File API
    uploadBytes(imagesRef, file).then((snapshot) => {
        console.log('Uploaded a blob or file!');
        getDownloadURL(snapshot.ref).then((downloadURL) => {
            console.log('File available at', downloadURL);
            _this.previousElementSibling.value = downloadURL;
        });
    });
}

class MyUploadAdapter {
    constructor( loader ) {
        // The file loader instance to use during the upload.
        this.loader = loader;
    }

    // Starts the upload process.
    upload() {
        return this.loader.file
            .then( file => new Promise( ( resolve, reject ) => {

                // Create the file metadata
  // Upload file and metadata to the object 'images/mountains.jpg'
  const storageRef = ref(storage, 'images/' + file.name);
  const uploadTask = uploadBytesResumable(storageRef, file);
                // Listen for state changes, errors, and completion of the upload.
uploadTask.on('state_changed',
(snapshot) => {
  // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  console.log('Upload is ' + progress + '% done');
  switch (snapshot.state) {
    case 'paused':
      console.log('Upload is paused');
      break;
    case 'running':
      console.log('Upload is running');
      break;
  }
}, 
(error) => {
  // A full list of error codes is available at
  // https://firebase.google.com/docs/storage/web/handle-errors
  switch (error.code) {
    case 'storage/unauthorized':
      // User doesn't have permission to access the object
      break;
    case 'storage/canceled':
      // User canceled the upload
      break;

    // ...

    case 'storage/unknown':
      // Unknown error occurred, inspect error.serverResponse
      break;
    }
    }, 
    () => {
    // Upload completed successfully, now we can get the download URL
    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        console.log('File available at', downloadURL);
        resolve( {
            default: downloadURL
                    } );
                });
                }
            );

                            
        } ) );
    }
}

function MyCustomUploadAdapterPlugin( editor ) {
    editor.plugins.get( 'FileRepository' ).createUploadAdapter = ( loader ) => {
        // Configure the URL to the upload script in your back-end here!
        return new MyUploadAdapter( loader );
    };
}

//Delete Article
async function deleteArticle(){
    console.log('article deleted');
    await deleteDoc(articleRef);
    await deleteDoc(headlineRef);
    location = `/${location.pathname.split('/')[1]}`;
}

var contentElement = document.querySelector('#content');

//Form Control
var ckEditorElement = null;

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

//Image Upload
openGraphImageUrlUploadElement.addEventListener('change', uploadImage);
headlineImageUploadElement.addEventListener('change', uploadImage);

function switchPage(){
    for (let i=0; i<switchButtonsElement.children.length; i++){
        switchButtonsElement.children[i].classList.remove('active');
        document.querySelector(switchButtonsElement.children[i].getAttribute('rd-target'))
        .classList.add('d-none');
    }
    this.classList.add('active');
    document.querySelector(this.getAttribute('rd-target')).classList.remove('d-none');
}

//Member System
var signInButtonElement = document.getElementById('rd-sign-in-btn');
var signOutButtonElement = document.getElementById('rd-sign-out-btn');
signOutButtonElement.addEventListener('click', signOutUser);

initFirebaseAuth();
loadArticle();