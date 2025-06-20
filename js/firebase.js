import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbmbWZ2lH9ikUMFPpqH1nRB-czpXzYjDs",
  authDomain: "trial-secretary-cf449.firebaseapp.com",
  projectId: "trial-secretary-cf449",
  storageBucket: "trial-secretary-cf449.appspot.com",
  messagingSenderId: "742305544428",
  appId: "1:742305544428:web:c50b207ec1ae7b54c1cdc9",
  measurementId: "G-W0SP1XJT8X"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
