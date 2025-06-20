import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('username').textContent = user.email.split('@')[0];
  } else {
    window.location.href = 'index.html';
  }
});

window.logout = () => signOut(auth);
