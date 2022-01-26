/**
 * To find your Firebase config object:
 * 
 * 1. Go to your [Project settings in the Firebase console](https://console.firebase.google.com/project/_/settings/general/)
 * 2. In the "Your apps" card, select the nickname of the app for which you need a config object.
 * 3. Select Config from the Firebase SDK snippet pane.
 * 4. Copy the config object snippet, then add it here.
 */
const config = {
  apiKey: "AIzaSyBqGyOFp9my1L6EPrR5WiQbpPNHBiPQxMU",
  authDomain: "friendlychat-feeec.firebaseapp.com",
  databaseURL: "https://friendlychat-feeec.firebaseio.com",
  projectId: "friendlychat-feeec",
  storageBucket: "friendlychat-feeec.appspot.com",
  messagingSenderId: "319867406444",
  appId: "1:319867406444:web:30c83e870639ad14f07049"
};

export function getFirebaseConfig() {
  if (!config || !config.apiKey) {
    throw new Error('No Firebase configuration object provided.' + '\n' +
    'Add your web app\'s configuration object to firebase-config.js');
  } else {
    return config;
  }
}