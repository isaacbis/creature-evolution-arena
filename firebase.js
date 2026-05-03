import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZkCXioFje39FqmUFkM2GqEAcPvVo7csg",
  authDomain: "ritiro-olio.firebaseapp.com",
  projectId: "ritiro-olio",
  storageBucket: "ritiro-olio.firebasestorage.app",
  messagingSenderId: "1088319614799",
  appId: "1:1088319614799:web:e89cfc9c6a548b318c9f3a",
  measurementId: "G-Q0WCW8T0B1"
};

const isConfigured =
  Boolean(firebaseConfig.apiKey) &&
  !firebaseConfig.apiKey.includes("INSERISCI") &&
  Boolean(firebaseConfig.projectId);

let app = null;
let db = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

export function firebaseReady() {
  return Boolean(db);
}

function requireDb() {
  if (!db) {
    throw new Error("Firebase non configurato correttamente.");
  }

  return db;
}

export function createMatchDoc(code, data) {
  const database = requireDb();

  return setDoc(doc(database, "matches", code), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function getMatchDoc(code) {
  const database = requireDb();
  const snap = await getDoc(doc(database, "matches", code));
  return snap.exists() ? snap.data() : null;
}

export function updateMatchDoc(code, data) {
  const database = requireDb();

  return updateDoc(doc(database, "matches", code), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export function listenMatchDoc(code, callback, onError) {
  const database = requireDb();

  return onSnapshot(
    doc(database, "matches", code),
    snap => {
      if (!snap.exists()) {
        callback(null);
        return;
      }

      callback(snap.data());
    },
    error => {
      console.error("Errore ascolto partita:", error);
      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}