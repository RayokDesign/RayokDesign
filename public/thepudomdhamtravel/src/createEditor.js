'use strict'

import getFileURL from './getFileURL';

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

export default async function createEditor(){
    const editor = await
    ClassicEditor
    .create( document.querySelector(`#rd-editor`) , {
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
    })
    return editor;
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
                getFileURL(file).then( (fileURL) => {
                    resolve({
                        default: fileURL
                    })
                })
            }));
    }
}

function MyCustomUploadAdapterPlugin( editor ) {
    editor.plugins.get( 'FileRepository' ).createUploadAdapter = ( loader ) => {
        // Configure the URL to the upload script in your back-end here!
        return new MyUploadAdapter( loader );
    };
}