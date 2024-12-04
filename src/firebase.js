import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCnE2FqGyCOW-5PVHyLL9AgsVs5wiZvQ0c",
  authDomain: "lulu-54a03.firebaseapp.com",
  projectId: "lulu-54a03",
  storageBucket: "lulu-54a03.firebasestorage.app",
  messagingSenderId: "940331730872",
  appId: "1:940331730872:web:637a3ebbb84c942a0bb14d",
  measurementId: "G-QYC427SRMH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
