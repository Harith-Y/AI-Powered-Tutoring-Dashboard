import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // These are demo values - replace with your actual Firebase config
  apiKey: "demo-api-key",
  authDomain: "ai-tutoring-demo.firebaseapp.com",
  projectId: "ai-tutoring-demo",
  storageBucket: "ai-tutoring-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);