// firebase/firebase.ts

// 0) Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";           // ← import Auth

// 1) Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhx_OI0jec7o5iJo3eGhVSxyDiBHurs3s",
  authDomain: "blockpay-a63db.firebaseapp.com",
  projectId: "blockpay-a63db",
  storageBucket: "blockpay-a63db.firebasestorage.app",
  messagingSenderId: "759679062650",
  appId: "1:759679062650:web:eea7b2a7afa7296cda61c3",
  measurementId: "G-WJXCTL8G6W"
};

// 2) Initialize Firebase
const app = initializeApp(firebaseConfig);

// 3) Initialize and export each service
export const db        = getFirestore(app);
export const analytics = getAnalytics(app);
export const auth      = getAuth(app);             // ← export Auth
