import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDM9k0l2ctlWmKHSdMjLr9kBNdQbtYjTPk",
  authDomain: "shopping-51e2b.firebaseapp.com",
  projectId: "shopping-51e2b",
  storageBucket: "shopping-51e2b.firebasestorage.app",
  messagingSenderId: "334972405006",
  appId: "1:334972405006:web:b4d1f682c713148cd1c35f",
  measurementId: "G-Q5GCG5RE0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;