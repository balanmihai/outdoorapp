import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD1lunPuiCAGMNLcZ8wIWZfTZOewOXwGIk",
  authDomain: "outdoorapp-7933c.firebaseapp.com",
  projectId: "outdoorapp-7933c",
  storageBucket: "outdoorapp-7933c.appspot.com",
  messagingSenderId: "849299870635",
  appId: "1:849299870635:web:6660bad258c96ae74878ee"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { db };
