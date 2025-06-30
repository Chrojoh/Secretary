console.log("🔧 DEBUG: view-trials.js starting to load...");

import { auth, db } from './firebase.js';
import { collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

console.log("🔧 DEBUG: Firebase imports successful");

const trialList = document.getElementById("trialList");
console.log("🔧 DEBUG: trialList element:", trialList);

async function deleteTrial(trialId, trialName) {
  if (confirm(`Are you sure you want to delete "${trialName}"? This cannot be undone.`)) {
    try {
      await deleteDoc(doc(db, "trials", trialId));
      console.log("Trial deleted:", trialId);
      alert("Trial deleted successfully!");
      location.reload();
    } catch (error) {
      console.error("Error deleting trial:", error);
      alert("Error deleting trial: " + error.message);
    }
  }
}

function editTrial(trialId) {
  console.log("🔧 DEBUG: Edit trial clicked:", trialId);
  window.location.href = `edit-trial.html?id=${trialId}&mode=edit`;
}

function viewTrial(trialId) {
  console.log("🔧 DEBUG: View trial clicked:", trialId);
  window.location.href = `edit-trial.html?id=${trialId}&mode=view`;
}

async function loadTrials(user) {
  try {
    console.log("🔧 DEBUG: Loading trials for user:", user.email);
    console.log("🔧 DEBUG: User UID:", user.uid);
    
    const q = query(
      collection(db, "trials"), 
      where("createdBy", "==", user.uid)
    );
    
    console.log("🔧 DEBUG: Query created, executing...");
    const snapshot = await getDocs(q);
    console.log("🔧 DEBUG: Query executed, snapshot:", snapshot);
    console.log("🔧 DEBUG: Snapshot empty?", snapshot.empty);
    console.log("🔧 DEBUG: Snapshot size:", snapshot.size);
    
    if (snapshot.empty) {
      console.log("🔧 DEBUG: No trials found for this user");
      trialList.innerHTML = '<div class="no-trials">No trials found. <a href="create-trial.html">Create your first trial</a></div>';
      return;
    }
    
    trialList.innerHTML = '';
    
    const trials = [];
    snapshot.forEach(doc => {
      console.log("🔧 DEBUG: Processing trial doc:", doc.id, doc.data());
      const trialData = doc.data();
      trials.push({ id: doc.id, ...trialData });
    });
    
    console.log("🔧 DEBUG: Total trials found:", trials.length);
    
    trials.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA;
    });
    
    trials.forEach(trialData => {
      console.log("🔧 DEBUG: Rendering trial:", trialData.id, trialData.clubName);
      
      const trialItem = document.createElement("div");
      trialItem.className = "trial-item";
      
      let createdDate = "Unknown date";
      if (trialData.createdAt) {
        createdDate = trialData.createdAt.toDate().toLocaleDateString();
      }
      
      let trialDates = "No dates specified";
      if (trialData.days && trialData.days.length > 0) {
        const dates = trialData.days
          .filter(day => day.date)
          .map(day => day.date)
          .join(', ');
        if (dates) {
          trialDates = dates;
        }
      }
      
      let totalClasses = 0;
      if (trialData.days) {
        trialData.days.forEach(day => {
          if (day.classes) {
            totalClasses += day.classes.length;
          }
        });
      }
      
      trialItem.innerHTML = `
        <div class="trial-actions">
          <button class="view-btn" onclick="viewTrial('${trialData.id}')" title="View trial details">👁️ View</button>
          <button class="edit-btn" onclick="editTrial('${trialData.id}')" title="Edit trial">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteTrial('${trialData.id}', '${(trialData.clubName || 'Unnamed Trial').replace(/'/g, '\\\'')}')" title="Delete trial">🗑️ Delete</button>
        </div>
        <h3>${trialData.clubName || 'Unnamed Trial'}</h3>
        <div class="trial-details">
          <strong>Secretary:</strong> ${trialData.secretary || 'Not specified'}<br>
          <strong>Trial Dates:</strong> ${trialDates}<br>
          <strong>Number of Days:</strong> ${trialData.numDays || 0}<br>
          <strong>Total Classes:</strong> ${totalClasses}<br>
          <strong>Created:</strong> ${createdDate}
        </div>
      `;
      
      trialList.appendChild(trialItem);
    });
    
    console.log(`🔧 DEBUG: Loaded ${trials.length} trials successfully`);
    
  } catch (error) {
    console.error("🔧 DEBUG: Error loading trials:", error);
    trialList.innerHTML = '<div class="no-trials">Error loading trials: ' + error.message + '</div>';
  }
}

window.deleteTrial = deleteTrial;
window.editTrial = editTrial;
window.viewTrial = viewTrial;

console.log("🔧 DEBUG: Setting up auth state change listener...");

auth.onAuthStateChanged(async user => {
  console.log("🔧 DEBUG: Auth state changed. User:", user);
  
  if (!user) {
    console.log("🔧 DEBUG: No user, redirecting to index.html");
    window.location.href = "index.html";
    return;
  }
  
  console.log("🔧 DEBUG: User authenticated, loading trials...");
  trialList.innerHTML = '<div class="no-trials">Loading trials...</div>';
  
  await loadTrials(user);
});

console.log("🔧 DEBUG: view-trials.js fully loaded");
