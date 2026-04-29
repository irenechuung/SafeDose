import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_g-MdR7ldm794HtCM4qToN5IR5OC9XD8", // I took this from your first message
  authDomain: "safedise.firebaseapp.com",
  projectId: "safedise",
  storageBucket: "safedise.firebasestorage.app",
  messagingSenderId: "161203569229",
  appId: "1:161203569229:web:6baa8686254ea9068f9204"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);