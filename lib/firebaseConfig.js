import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyA3QTT9yXSGBvrhWwfLAPu7o7e4cMDh2fE",
  authDomain: "velot-78844.firebaseapp.com",
  databaseURL: "https://velot-78844-default-rtdb.firebaseio.com",
  projectId: "velot-78844",
  storageBucket: "velot-78844.firebasestorage.app",
  messagingSenderId: "168477169981",
  appId: "1:168477169981:web:b9f4a3e963c4b6781d4d54",
};

// Evita reinicializar o app em hot-reload / múltiplos imports (Next.js).
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
