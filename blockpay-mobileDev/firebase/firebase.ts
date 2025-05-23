// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhx_OI0jec7o5iJo3eGhVSxyDiBHurs3s",
  authDomain: "blockpay-a63db.firebaseapp.com",
  projectId: "blockpay-a63db",
  storageBucket: "blockpay-a63db.firebasestorage.app",
  messagingSenderId: "759679062650",
  appId: "1:759679062650:web:eea7b2a7afa7296cda61c3",
  measurementId: "G-WJXCTL8G6W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore
const analytics = getAnalytics(app);
export { db, analytics };