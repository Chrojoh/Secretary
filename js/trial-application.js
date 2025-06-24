import { auth, db } from './firebase.js';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let currentTrialData = null;
let applicationData = null;

// Required fields for highlighting
const requiredFields = [
  'trialDates', 'venueAddress', 'hostName', 'trialLocation', 'premiumWebsite',
  'contactName', 'contactEmail', 'contactPhone', 'advocates', 'ringSurface',
  'searchAreas', 'insuranceDate'
];

// Load trial data and populate form
async function loadTrialData() {
  try {
    // Wait for auth state to be determined
    await new Promise((resolve) => {
      if (auth.currentUser) {
        resolve();
      } else {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve();
        });
      }
    });

    if (!auth.currentUser) {
      console.log("No authenticated user found, redirecting to login");
      window.location.href = 'index.html';
      return;
    }

    console.log("Authenticated user:", auth.currentUser.email);

    // Get the most recent trial for this user
    const q = query(
      collection(db, "trials"), 
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Get the most recent trial (assuming last one is most recent)
      const trials = [];
      snapshot.forEach(doc => {
        trials.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by creation date, most recent first
      trials.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      currentTrialData = trials[0];
      
      console.log("Loaded trial data:", currentTrialData);
      populateFormFromTrial();
    } else {
      alert("No trial found. Please create a trial first.");
      window.location.href = 'main-dashboard.html';
    }
    
    // Try to load existing application data
    await loadExistingApplication();
    
  } catch (error) {
    console.error("Error loading trial data:", error);
    alert("Error loading trial data: " + error.message);
  }
}

function populateFormFromTrial() {
  if (!currentTrialData) return;
  
  // Populate trial dates
  if (currentTrialData.days && currentTrialData.days.length > 0) {
    const dates = currentTrialData.days
      .filter(day => day.date)
      .map(day => day.date)
      .join(', ');
    document.getElementById('trialDates').value = dates;
  }
  
  // Populate host name from club name
  if (currentTrialData.clubName) {
    document.getElementById('hostName').value = currentTrialData.clubName;
  }
  
  // Populate contact name from secretary
  if (currentTrialData.secretary) {
    document.getElementById('contactName').value = currentTrialData.secretary;
  }
  
  // Populate judges list
  const allJudges = new Set();
  if (currentTrialData.days) {
    currentTrialData.days.forEach(day => {
      if (day.classes) {
        day.classes.forEach(cls => {
          if (cls.rounds) {
            cls.rounds.forEach(round => {
              if (round.judge && round.judge.trim()) {
                allJudges.add(round.judge.trim());
              }
            });
          }
        });
      }
    });
  }
  
  if (allJudges.size > 0) {
    document.getElementById('judges').value = Array.from(allJudges).join(', ');
  }
  
  // Set submitted date to today
  document.getElementById('submittedDate').value = new Date().toISOString().split('T')[0];
  
  // Populate schedule table
populateScheduleTableWithRealJudges();
  console.log("Form populated with trial data");
}

async function populateScheduleTableWithRealJudges() {
  if (!currentTrialData || !currentTrialData.days) return;
  
  console.log("📋 Populating schedule table with real judge data...");
  
  // First, load the actual judge assignments from entries
  const judgeData = await loadJudgesFromEntries(currentTrialData.id);
  
  const scheduleBody = document.getElementById('scheduleBody');
  scheduleBody.innerHTML = '';
  
  // Get all unique classes across all days
  const allClasses = new Set();
  currentTrialData.days.forEach(day => {
    if (day.classes) {
      day.classes.forEach(cls => {
        if (cls.className && cls.className.trim()) {
          allClasses.add(cls.className.trim());
        }
      });
    }
  });
  
  // Create rows for each class
  Array.from(allClasses).forEach(className => {
    const row = document.createElement('tr');
    
    // Class name cell
    const classCell = document.createElement('td');
    classCell.innerHTML = `<input type="text" value="${className}" readonly style="background: #f0f0f0;">`;
    row.appendChild(classCell);
    
    // Judge cells for each day (up to 6 days)
    for (let dayIndex = 0; dayIndex < 6; dayIndex++) {
      const judgeCell = document.createElement('td');
      
      let judgeValue = '';
      
      // CRITICAL FIX: Look for judge in the entry data, not trial structure
      if (dayIndex < currentTrialData.days.length) {
        const day = currentTrialData.days[dayIndex];
        const dayDate = day.date;
        
        // Look for this judge in the entry data
        const judgeKey = `${dayDate}_${className}_1`; // Assuming round 1 for now
        if (judgeData[judgeKey]) {
          judgeValue = judgeData[judgeKey].judgeName;
        } else {
          // Fallback: check trial structure as backup
          if (day.classes) {
            const classMatch = day.classes.find(cls => cls.className === className);
            if (classMatch && classMatch.rounds && classMatch.rounds.length > 0) {
              judgeValue = classMatch.rounds[0].judge || '';
            }
          }
        }
      }
      
      judgeCell.innerHTML = `<input type="text" value="${judgeValue}" placeholder="">`;
      row.appendChild(judgeCell);
    }
    
    scheduleBody.appendChild(row);
  });
  
  console.log("✅ Schedule table populated with real judge data");
}


async function loadExistingApplication() {
  try {
    if (!currentTrialData) return;
    
    const q = query(
      collection(db, "applications"),
      where("trialId", "==", currentTrialData.id),
      where("createdBy", "==", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      snapshot.forEach(doc => {
        applicationData = { id: doc.id, ...doc.data() };
      });
      
      // Populate form with existing application data
      populateFormFromApplication();
      console.log("Loaded existing application data");
    }
  } catch (error) {
    console.error("Error loading existing application:", error);
  }
}

function populateFormFromApplication() {
  if (!applicationData) return;
  
  // Populate all form fields with saved data
  Object.keys(applicationData).forEach(key => {
    const element = document.getElementById(key);
    if (element) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = applicationData[key];
      } else {
        element.value = applicationData[key] || '';
      }
    }
  });
}

function highlightMissingFields() {
  let missingCount = 0;
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      if (!field.value || field.value.trim() === '') {
        field.classList.add('missing');
        missingCount++;
      } else {
        field.classList.remove('missing');
      }
    }
  });
  
  // Check Inside/Outside checkboxes (updated for checkboxes instead of radio buttons)
  const locationCheckboxes = document.querySelectorAll('input[name="trialLocation"]');
  const locationChecked = Array.from(locationCheckboxes).some(checkbox => checkbox.checked);
  if (!locationChecked) {
    locationCheckboxes.forEach(checkbox => checkbox.parentElement.style.backgroundColor = '#ffcccc');
    missingCount++;
  } else {
    locationCheckboxes.forEach(checkbox => checkbox.parentElement.style.backgroundColor = '');
  }
  
  // Check Resets radio buttons
  const resetsRadios = document.querySelectorAll('input[name="resets"]');
  const resetsChecked = Array.from(resetsRadios).some(radio => radio.checked);
  if (!resetsChecked) {
    resetsRadios.forEach(radio => radio.parentElement.style.backgroundColor = '#ffcccc');
    missingCount++;
  } else {
    resetsRadios.forEach(radio => radio.parentElement.style.backgroundColor = '');
  }
  
  if (missingCount > 0) {
    console.log(`${missingCount} required fields are missing`);
  }
  
  return missingCount === 0;
}

function collectFormData() {
  const formData = {};
  
  // Collect all input values
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    if (input.id) {
      if (input.type === 'checkbox' || input.type === 'radio') {
        if (input.checked) {
          formData[input.id] = true;
          if (input.name) {
            formData[input.name] = input.value;
          }
        }
      } else {
        formData[input.id] = input.value;
      }
    }
  });
  
  // Special handling for Inside/Outside trial checkboxes
  const locationCheckboxes = document.querySelectorAll('input[name="trialLocation"]:checked');
  const locationValues = Array.from(locationCheckboxes).map(checkbox => checkbox.value);
  if (locationValues.length > 0) {
    formData.trialLocationTypes = locationValues; // Store as array
    formData.trialLocationType = locationValues.join(' & '); // Store as string for display
  }
  
  // Collect schedule table data
  const scheduleRows = document.querySelectorAll('#scheduleBody tr');
  const scheduleData = [];
  scheduleRows.forEach(row => {
    const cells = row.querySelectorAll('td input');
    if (cells.length > 0) {
      const rowData = {
        className: cells[0].value,
        judges: []
      };
      for (let i = 1; i < cells.length; i++) {
        rowData.judges.push(cells[i].value);
      }
      if (rowData.className.trim()) {
        scheduleData.push(rowData);
      }
    }
  });
  formData.schedule = scheduleData;
  
  return formData;
}

async function saveApplication(formData) {
  try {
    const applicationRecord = {
      ...formData,
      trialId: currentTrialData.id,
      createdBy: auth.currentUser.uid,
      updatedAt: new Date()
    };
    
    if (applicationData && applicationData.id) {
      // Update existing application
      await updateDoc(doc(db, "applications", applicationData.id), applicationRecord);
      console.log("Application updated");
    } else {
      // Create new application
      applicationRecord.createdAt = new Date();
      const docRef = await addDoc(collection(db, "applications"), applicationRecord);
      console.log("Application saved with ID:", docRef.id);
    }
    
    alert("Application saved successfully!");
    // **FIXED REDIRECT** - Changed from 'dashboard.html' to 'main-dashboard.html'
    window.location.href = 'main-dashboard.html';
    
  } catch (error) {
    console.error("Error saving application:", error);
    alert("Error saving application: " + error.message);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Don't load trial data immediately - wait for auth
  console.log("Page loaded, waiting for authentication...");
  
  // Add event listeners for real-time validation
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', highlightMissingFields);
      field.addEventListener('change', highlightMissingFields);
    }
  });
  
  // League checkboxes - only one should be checked
  const leagueYes = document.getElementById('leagueYes');
  const leagueNo = document.getElementById('leagueNo');
  
  if (leagueYes && leagueNo) {
    leagueYes.addEventListener('change', function() {
      if (this.checked) leagueNo.checked = false;
    });
    
    leagueNo.addEventListener('change', function() {
      if (this.checked) leagueYes.checked = false;
    });
  }
  
  // Form submission
  const form = document.getElementById('applicationForm');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const isValid = highlightMissingFields();
    if (!isValid) {
      alert("Please fill in all highlighted required fields before saving.");
      return;
    }
    
    const formData = collectFormData();
    console.log("Collected form data:", formData);
    saveApplication(formData);
  });
  
  // Initial highlighting check
  setTimeout(highlightMissingFields, 1000);
});

// Auth state listener
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("User authenticated:", user.email);
    // Now load the trial data
    loadTrialData();
  } else {
    console.log("No user authenticated, redirecting to login");
    window.location.href = 'index.html';
  }
});
