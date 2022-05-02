'use strict'

import { initializeApp } from 'firebase/app';
import { getFirebaseConfig } from '../../../connections/thepudomdhamtravel/firebase-config.js';

export default function initApp(){
    initializeApp(getFirebaseConfig());
}