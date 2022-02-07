/**
 * To find your Firebase config object:
 * 
 * 1. Go to your [Project settings in the Firebase console](https://console.firebase.google.com/project/_/settings/general/)
 * 2. In the "Your apps" card, select the nickname of the app for which you need a config object.
 * 3. Select Config from the Firebase SDK snippet pane.
 * 4. Copy the config object snippet, then add it here.
 */
const config = {
  /* TODO: ADD YOUR FIREBASE CONFIGURATION OBJECT HERE */
  apiKey: "AIzaSyCZHCKSZnH9WE5QkrGhtApo92NXe8tzNLY",
  authDomain: "rayoktailand.firebaseapp.com",
  projectId: "rayoktailand",
  storageBucket: "rayoktailand.appspot.com",
  messagingSenderId: "899005250836",
  appId: "1:899005250836:web:e66795fa6f0db478e99601",
  measurementId: "G-JFR0CCVL56"
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error('No Firebase configuration object provided.' + '\n' +
    'Add your web app\'s configuration object to firebase-config.js');
  } else {
    return config;
  }
}