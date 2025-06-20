// js/dashboard.js
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

onAuthStateChanged(auth, user => {
  if (user) {
    const username = user.email.split('@')[0];
    document.getElementById('user').textContent = `Logged in as: ${username}`;
  } else {
    window.location.href = "index.html";
  }
});

window.logout = function () {
  signOut(auth);
};
