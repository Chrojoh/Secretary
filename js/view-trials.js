import { auth, db } from './firebase.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const trialList = document.getElementById("trialList");

auth.onAuthStateChanged(async user => {
  if (!user) return (window.location.href = "index.html");
  const q = query(collection(db, "trials"), where("createdBy", "==", user.uid));
  const snapshot = await getDocs(q);
  snapshot.forEach(doc => {
    const li = document.createElement("li");
    li.textContent = doc.data().club;
    trialList.appendChild(li);
  });
});
