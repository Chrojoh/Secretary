import { auth, db } from './firebase.js';
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const trialList = document.getElementById("trialList");

async function loadTrials(user) {
  try {
    console.log("Loading trials for user:", user.email);
    
    const q = query(
      collection(db, "trials"), 
      where("createdBy", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      trialList.innerHTML = '<div class="no-trials">No trials found. <a href="create-trial.html">Create your first trial</a></div>';
      return;
    }
    
    trialList.innerHTML = ''; // Clear loading message
    
    snapshot.forEach(doc => {
      const trialData = doc.data();
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
    
    console.log(`Loaded ${snapshot.size} trials`);
    
  } catch (error) {
    console.error("Error loading trials:", error);
    trialList.innerHTML = '<div class="no-trials">Error loading trials: ' + error.message + '</div>';
  }
}

auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  
  // Show loading message
  trialList.innerHTML = '<div class="no-trials">Loading trials...</div>';
  
  await loadTrials(user);
});
