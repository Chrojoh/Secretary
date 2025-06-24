// ===========================================
// STANDARD FIELD DEFINITIONS
// ===========================================
const STANDARD_FIELDS = {
  HANDLER_NAME: 'handlerName',    // NOT 'Handler' or 'handler'
  DOG_CALL_NAME: 'dogCallName',   // NOT 'Call Name' or 'dogName'
  JUDGE_NAME: 'judgeName',        // NOT 'judge' or 'judgeAssigned'
  CLASS_NAME: 'className',        // NOT 'Class' or 'class'
  CWAGS_NUMBER: 'cwagsNumber'     // NOT 'Registration'
};

// ===========================================
// FORM DATA COLLECTION & NORMALIZATION
// ===========================================

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
  
  // Collect schedule table data using standardized field names
  const scheduleRows = document.querySelectorAll('#scheduleBody tr');
  const scheduleData = [];
  scheduleRows.forEach(row => {
    const cells = row.querySelectorAll('td input');
    if (cells.length > 0) {
      const rowData = {
        [STANDARD_FIELDS.CLASS_NAME]: cells[0].value,
        judges: []
      };
      for (let i = 1; i < cells.length; i++) {
        if (cells[i].value.trim()) {
          rowData.judges.push({
            [STANDARD_FIELDS.JUDGE_NAME]: cells[i].value.trim()
          });
        }
      }
      if (rowData[STANDARD_FIELDS.CLASS_NAME].trim()) {
        scheduleData.push(rowData);
      }
    }
  });
  formData.schedule = scheduleData;
  
  return normalizeFormData(formData);
}

// Normalize any legacy field names to standard ones
function normalizeFormData(data) {
  const normalized = { ...data };
  
  // Handler name normalization
  if (data.handler || data.Handler) {
    normalized[STANDARD_FIELDS.HANDLER_NAME] = data.handler || data.Handler;
    delete normalized.handler;
    delete normalized.Handler;
  }
  
  // Dog call name normalization
  if (data.dogName || data['Call Name'] || data.callName) {
    normalized[STANDARD_FIELDS.DOG_CALL_NAME] = data.dogName || data['Call Name'] || data.callName;
    delete normalized.dogName;
    delete normalized['Call Name'];
    delete normalized.callName;
  }
  
  // Judge name normalization
  if (data.judge || data.judgeAssigned) {
    normalized[STANDARD_FIELDS.JUDGE_NAME] = data.judge || data.judgeAssigned;
    delete normalized.judge;
    delete normalized.judgeAssigned;
  }
  
  // Class name normalization
  if (data.Class || data.class) {
    normalized[STANDARD_FIELDS.CLASS_NAME] = data.Class || data.class;
    delete normalized.Class;
    delete normalized.class;
  }
  
  // CWAGS number normalization
  if (data.Registration || data.registration || data.registrationNumber) {
    normalized[STANDARD_FIELDS.CWAGS_NUMBER] = data.Registration || data.registration || data.registrationNumber;
    delete normalized.Registration;
    delete normalized.registration;
    delete normalized.registrationNumber;
  }
  
  return normalized;
}

// ===========================================
// APPLICATION SAVE & LOAD FUNCTIONS
// ===========================================

async function saveApplication(formData) {
  try {
    const normalizedData = normalizeFormData(formData);
    
    const applicationRecord = {
      ...normalizedData,
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
    
  } catch (error) {
    console.error("Error saving application:", error);
    alert("Error saving application: " + error.message);
  }
}

async function loadTrialData() {
  try {
    const trialId = new URLSearchParams(window.location.search).get('trial');
    if (!trialId) {
      alert("No trial specified. Please create a trial first.");
      window.location.href = 'main-dashboard.html';
      return;
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
  
  // Populate judges list using standardized field names
  const allJudges = new Set();
  if (currentTrialData.days) {
    currentTrialData.days.forEach(day => {
      if (day.classes) {
        day.classes.forEach(cls => {
          if (cls.rounds) {
            cls.rounds.forEach(round => {
              // Use standardized judge field name
              const judgeName = round[STANDARD_FIELDS.JUDGE_NAME] || round.judge || round.judgeAssigned;
              if (judgeName && judgeName.trim()) {
                allJudges.add(judgeName.trim());
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
  console.log("Form populated with trial data using standardized fields");
}

async function populateScheduleTableWithRealJudges() {
  if (!currentTrialData || !currentTrialData.days) return;
  
  console.log("📋 Populating schedule table with real judge data...");
  
  // First, load the actual judge assignments from entries
  const judgeData = await loadJudgesFromEntries(currentTrialData.id);
  
  const scheduleBody = document.getElementById('scheduleBody');
  scheduleBody.innerHTML = '';
  
  // Get all unique classes across all days using standardized field names
  const allClasses = new Set();
  currentTrialData.days.forEach(day => {
    if (day.classes) {
      day.classes.forEach(cls => {
        // Use standardized class name field
        const className = cls[STANDARD_FIELDS.CLASS_NAME] || cls.className || cls.Class || cls.class;
        if (className && className.trim()) {
          allClasses.add(className.trim());
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
      
      // Look for judge in the entry data, not trial structure
      if (dayIndex < currentTrialData.days.length) {
        const day = currentTrialData.days[dayIndex];
        const dayDate = day.date;
        
        // Look for this judge in the entry data using standardized key
        const judgeKey = `${dayDate}_${className}_1`; // Assuming round 1 for now
        if (judgeData[judgeKey]) {
          judgeValue = judgeData[judgeKey][STANDARD_FIELDS.JUDGE_NAME] || judgeData[judgeKey].judgeName || judgeData[judgeKey].judge;
        } else {
          // Fallback: check trial structure as backup
          if (day.classes) {
            const classMatch = day.classes.find(cls => {
              const clsName = cls[STANDARD_FIELDS.CLASS_NAME] || cls.className || cls.Class || cls.class;
              return clsName === className;
            });
            if (classMatch && classMatch.rounds && classMatch.rounds.length > 0) {
              judgeValue = classMatch.rounds[0][STANDARD_FIELDS.JUDGE_NAME] || 
                          classMatch.rounds[0].judge || 
                          classMatch.rounds[0].judgeAssigned || '';
            }
          }
        }
      }
      
      judgeCell.innerHTML = `<input type="text" value="${judgeValue}" placeholder="">`;
      row.appendChild(judgeCell);
    }
    
    scheduleBody.appendChild(row);
  });
  
  console.log("✅ Schedule table populated with real judge data using standardized fields");
}

// ===========================================
// JUDGE DATA LOADING FROM ENTRIES
// ===========================================

async function loadJudgesFromEntries(trialId) {
  try {
    console.log("🔍 Loading judges from entry data for trial:", trialId);
    
    const entriesQuery = query(
      collection(db, "entries"),
      where("trialId", "==", trialId)
    );
    
    const entriesSnapshot = await getDocs(entriesQuery);
    const judgeData = {};
    
    entriesSnapshot.forEach(doc => {
      const entry = doc.data();
      
      // Process each day/class combination using standardized field names
      if (entry.selectedClasses) {
        Object.keys(entry.selectedClasses).forEach(dayClassKey => {
          const classInfo = entry.selectedClasses[dayClassKey];
          if (classInfo.selected && classInfo[STANDARD_FIELDS.JUDGE_NAME]) {
            // Store judge info with standardized field names
            judgeData[dayClassKey] = {
              [STANDARD_FIELDS.JUDGE_NAME]: classInfo[STANDARD_FIELDS.JUDGE_NAME],
              [STANDARD_FIELDS.CLASS_NAME]: classInfo[STANDARD_FIELDS.CLASS_NAME] || classInfo.className,
              [STANDARD_FIELDS.HANDLER_NAME]: entry[STANDARD_FIELDS.HANDLER_NAME] || entry.handlerName,
              [STANDARD_FIELDS.DOG_CALL_NAME]: entry[STANDARD_FIELDS.DOG_CALL_NAME] || entry.dogCallName
            };
          }
        });
      }
    });
    
    console.log("✅ Loaded judge data with standardized fields:", Object.keys(judgeData).length, "assignments");
    return judgeData;
    
  } catch (error) {
    console.error("❌ Error loading judges from entries:", error);
    return {};
  }
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
        populateFormWithApplicationData(applicationData);
        console.log("✅ Loaded existing application with standardized fields");
      });
    }
  } catch (error) {
    console.error("❌ Error loading existing application:", error);
  }
}

function populateFormWithApplicationData(data) {
  if (!data) return;
  
  // Normalize the data first
  const normalizedData = normalizeFormData(data);
  
  // Populate form fields using standardized field names
  Object.keys(normalizedData).forEach(key => {
    const element = document.getElementById(key);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = normalizedData[key];
      } else {
        element.value = normalizedData[key];
      }
    }
  });
  
  // Handle special cases for arrays and objects
  if (normalizedData.trialLocationTypes && Array.isArray(normalizedData.trialLocationTypes)) {
    normalizedData.trialLocationTypes.forEach(location => {
      const checkbox = document.querySelector(`input[name="trialLocation"][value="${location}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  // Populate schedule table if present
  if (normalizedData.schedule && Array.isArray(normalizedData.schedule)) {
    populateScheduleTable(normalizedData.schedule);
  }
  
  console.log("✅ Form populated with application data using standardized fields");
}

function populateScheduleTable(scheduleData) {
  const scheduleBody = document.getElementById('scheduleBody');
  if (!scheduleBody || !scheduleData) return;
  
  scheduleBody.innerHTML = '';
  
  scheduleData.forEach(rowData => {
    const row = document.createElement('tr');
    
    // Class name cell using standardized field
    const classCell = document.createElement('td');
    const className = rowData[STANDARD_FIELDS.CLASS_NAME] || rowData.className || '';
    classCell.innerHTML = `<input type="text" value="${className}" readonly style="background: #f0f0f0;">`;
    row.appendChild(classCell);
    
    // Judge cells (up to 6)
    for (let i = 0; i < 6; i++) {
      const judgeCell = document.createElement('td');
      let judgeValue = '';
      
      if (rowData.judges && rowData.judges[i]) {
        // Handle both old and new judge data formats
        if (typeof rowData.judges[i] === 'string') {
          judgeValue = rowData.judges[i];
        } else if (typeof rowData.judges[i] === 'object') {
          judgeValue = rowData.judges[i][STANDARD_FIELDS.JUDGE_NAME] || 
                      rowData.judges[i].judgeName || 
                      rowData.judges[i].judge || '';
        }
      }
      
      judgeCell.innerHTML = `<input type="text" value="${judgeValue}" placeholder="">`;
      row.appendChild(judgeCell);
    }
    
    scheduleBody.appendChild(row);
  });
}

// ===========================================
// EVENT HANDLERS & INITIALIZATION
// ===========================================

// Form submission handler
async function handleFormSubmit(event) {
  event.preventDefault();
  
  try {
    const formData = collectFormData();
    await saveApplication(formData);
  } catch (error) {
    console.error("❌ Error submitting application:", error);
    alert("Error submitting application: " + error.message);
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Trial Application initialized with standardized fields");
  
  // Attach form submit handler
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
  
  // Load trial data and populate form
  loadTrialData().then(() => {
    populateFormFromTrial();
  });
});
