import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhyFEKTWGXxlwh0joCXlhYRdxEVpHoD0I",
  authDomain: "bd-firebase-554f6.firebaseapp.com",
  projectId: "bd-firebase-554f6",
  storageBucket: "bd-firebase-554f6.firebasestorage.app",
  messagingSenderId: "735665721367",
  appId: "1:735665721367:web:8d1c9b309a3ef775f00c52",
  measurementId: "G-VJC68VEY1C"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);