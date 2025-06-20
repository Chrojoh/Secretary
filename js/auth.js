import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

function getEmailFromUsername(username) {
  return `${username}@trial.local`;
}

window.signup = async function () {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const email = getEmailFromUsername(username);

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "usernames", username), { uid: auth.currentUser.uid });
    window.location.href = "dashboard.html";
  } catch (err) {
    document.getElementById("error").textContent = err.message;
  }
};

window.login = async function () {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const email = getEmailFromUsername(username);

  try {
    const ref = doc(db, "usernames", username);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Username not found");

    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    document.getElementById("error").textContent = err.message;
  }
};
