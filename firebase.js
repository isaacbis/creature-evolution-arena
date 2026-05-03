import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZkCXioFje39FqmUFkM2GqEAcPvVo7csg",
  authDomain: "ritiro-olio.firebaseapp.com",
  projectId: "ritiro-olio",
  storageBucket: "ritiro-olio.firebasestorage.app",
  messagingSenderId: "1088319614799",
  appId: "1:1088319614799:web:e89cfc9c6a548b318c9f3a",
  measurementId: "G-Q0WCW8T0B1"
};

/*
  SOSTITUISCI QUESTI DATI CON QUELLI DEL TUO FIREBASE.

  Firebase Console:
  Project settings → General → Your apps → Web app → Firebase SDK config
*/

const firebaseConfig = {
  apiKey: "INSERISCI_API_KEY",
  authDomain: "INSERISCI_AUTH_DOMAIN",
  projectId: "INSERISCI_PROJECT_ID",
  storageBucket: "INSERISCI_STORAGE_BUCKET",
  messagingSenderId: "INSERISCI_MESSAGING_SENDER_ID",
  appId: "INSERISCI_APP_ID"
};

const isConfigured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes("INSERISCI");

let app = null;
let db = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export function firebaseReady() {
  return Boolean(db);
}

export function createMatchDoc(code, data) {
  if (!db) throw new Error("Firebase non configurato.");
  return setDoc(doc(db, "matches", code), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getMatchDoc(code) {
  if (!db) throw new Error("Firebase non configurato.");
  const snap = await getDoc(doc(db, "matches", code));
  return snap.exists() ? snap.data() : null;
}

export function updateMatchDoc(code, data) {
  if (!db) throw new Error("Firebase non configurato.");
  return updateDoc(doc(db, "matches", code), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function listenMatchDoc(code, callback) {
  if (!db) throw new Error("Firebase non configurato.");

  return onSnapshot(doc(db, "matches", code), snap => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    callback(snap.data());
  });
}