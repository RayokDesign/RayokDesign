'use strict'

import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default async function getFileURL(file){
    const fileType = file.type.split('/');
    const fileRef = ref(getStorage(), fileType[0]+'s/'+new Date().getTime()+'.'+fileType[1]);
    // 'file' comes from the Blob or File API
    const snapshot = await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}