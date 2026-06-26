import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7Vo8HzHkfb_O_wHYDigRsX9lvlNNoFTo",
  authDomain: "nebenlesen.firebaseapp.com",
  projectId: "nebenlesen",
  storageBucket: "nebenlesen.firebasestorage.app",
  messagingSenderId: "437938868751",
  appId: "1:437938868751:web:987852f447ab4e4a35497a",
  measurementId: "G-ZJHHNPG42L"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
