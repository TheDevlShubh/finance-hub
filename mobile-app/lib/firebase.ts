import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBKiV9OemE3UsrlJilaPrN5iVBqZ-zqAuk",
  authDomain: "financehub-679eb.firebaseapp.com",
  projectId: "financehub-679eb",
  storageBucket: "financehub-679eb.firebasestorage.app",
  messagingSenderId: "545888212425",
  appId: "1:545888212425:web:158769354f5980cddac418"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
