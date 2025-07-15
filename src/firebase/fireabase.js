// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth"; 
import { setPersistence, browserLocalPersistence } from "firebase/auth";
const firebaseConfig = {
  // apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // appId: import.meta.env.VITE_FIREBASE_APP_ID,

  apiKey: "AIzaSyCCdVY02bmYh4Sk58SB-ynisA-flXbzkdY",
authDomain: "blog-d54b5.firebaseapp.com",
projectId: "blog-d54b5",
storageBucket: "blog-d54b5.firebasestorage.app",
messagingSenderId: "124944860208",
appId: "1:124944860208:web:a474fd81202e78694ed9f5",
measurementId: "G-FF92Y5DHH0"
};

const app = initializeApp(firebaseConfig);
export default app;
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
setPersistence(auth, browserLocalPersistence); // ✅ Important for mob
