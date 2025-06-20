import { auth, db } from './firebase.js';
import { collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const trialList = document.getElementById("trialList");

async function deleteTrial(trialId, trialName) {
  if (confirm(`Are you sure you want to delete "${trialName}"? This cannot be undone.`)) {
    try {
      await deleteDoc(doc(db, "trials", trialId));
      console.log("Trial deleted:", trialId);
      alert("Trial deleted successfully!");
      // Reload the trials list
      location.reload();
    } catch (error) {
      console.error("Error deleting trial:", error);
      alert("Error deleting trial: " + error.message);
    }
  }
}

function editTrial(trialId) {
  // Store the trial ID in sessionStorage so the create-trial page can load it for editing
  sessionStorage.setItem('editTrialId', trialId);
  window.location.href = 'create-trial.html';
}

async function loadTrials(user) {
  try {
    console.log("Loading trials for user:", user.email);
    
    // Simplified query without orderBy to avoid index requirement
    const q = query(
      collection(db, "trials"), 
      where("createdBy", "==", user.uid)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      trialList.innerHTML = '<div class="no-trials">No trials found. <a href="create-trial.html">Create your first trial</a></div>';
      return;
    }
    
    trialList.innerHTML = ''; // Clear loading message
    
    // Convert to array and sort manually
    const trials = [];
    snapshot.forEach(doc => {
      const trialData = doc.data();
      trials.push({ id: doc.id, ...trialData });
    });
    
    // Sort by creation date (most recent first) - do this in JavaScript instead of Firestore
    trials.sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
      const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
      return dateB - dateA; // Most recent first
    });
    
    // Display trials
    trials.forEach(trialData => {
      console.log("Trial data:", trialData);
      
      const trialItem = document.createElement("div");
      trialItem.className = "trial-item";
      
      // Format the creation date
      let createdDate = "Unknown date";
      if (trialData.createdAt) {
        createdDate = trialData.createdAt.toDate().toLocaleDateString();
      }
      
      // Get trial dates
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
      
      // Count classes
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
          <button class="edit-btn" onclick="editTrial('${trialData.id}')">Edit</button>
          <button class="delete-btn" onclick="deleteTrial('${trialData.id}', '${trialData.clubName || 'Unnamed Trial'}')">Delete</button>
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
    
    console.log(`Loaded ${trials.length} trials`);
    
  } catch (error) {
    console.error("Error loading trials:", error);
    trialList.innerHTML = '<div class="no-trials">Error loading trials: ' + error.message + '</div>';
  }
}

// Make functions globally accessible
window.deleteTrial = deleteTrial;
window.editTrial = editTrial;

auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  
  // Show loading message
  trialList.innerHTML = '<div class="no-trials">Loading trials...</div>';
  
  await loadTrials(user);
});
