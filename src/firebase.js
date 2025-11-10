// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRSWb8iNFZtS19kM4221KyXwJPOoHIf8g",
  authDomain: "holiday-pachinko.firebaseapp.com",
  projectId: "holiday-pachinko",
  storageBucket: "holiday-pachinko.firebasestorage.app",
  messagingSenderId: "995852540189",
  appId: "1:995852540189:web:bb0cce3c63c727437d29f4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to Functions emulator in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  console.log('🔧 Connected to Functions emulator');
}
