// trial-setup.js
// Trial setup functions with standardized field names

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
// DATA NORMALIZATION FUNCTIONS
// ===========================================

/**
 * Normalize dog registration data to use standardized field names
 * @param {Object} dog - Dog data to normalize
 * @returns {Object} - Normalized dog data
 */
function normalizeDogData(dog) {
  if (!dog) return dog;
  
  const normalized = { ...dog };
  
  // Handler name normalization
  if (dog.handler || dog.Handler) {
    normalized[STANDARD_FIELDS.HANDLER_NAME] = dog.handler || dog.Handler;
    delete normalized.handler;
    delete normalized.Handler;
  }
  
  // Dog call name normalization
  if (dog.callName || dog['Call Name'] || dog.dogName) {
    normalized[STANDARD_FIELDS.DOG_CALL_NAME] = dog.callName || dog['Call Name'] || dog.dogName;
    delete normalized.callName;
    delete normalized['Call Name'];
    delete normalized.dogName;
  }
  
  // CWAGS number normalization (commonly stored as 'reg' in dog data)
  if (dog.reg || dog.Registration || dog.registration || dog.registrationNumber) {
    normalized[STANDARD_FIELDS.CWAGS_NUMBER] = dog.reg || dog.Registration || dog.registration || dog.registrationNumber;
    delete normalized.reg;
    delete normalized.Registration;
    delete normalized.registration;
    delete normalized.registrationNumber;
  }
  
  return normalized;
}

/**
 * Normalize class data to use standardized field names
 * @param {Array} classes - Array of class names
 * @returns {Array} - Array of normalized class objects
 */
function normalizeClassData(classes) {
  if (!Array.isArray(classes)) return classes;
  
  return classes.map(cls => {
    if (typeof cls === 'string') {
      return {
        [STANDARD_FIELDS.CLASS_NAME]: cls,
        name: cls // Keep for backward compatibility
      };
    } else if (typeof cls === 'object') {
      const normalized = { ...cls };
      
      // Class name normalization
      if (cls.Class || cls.class) {
        normalized[STANDARD_FIELDS.CLASS_NAME] = cls.Class || cls.class;
        delete normalized.Class;
        delete normalized.class;
      }
      
      return normalized;
    }
    return cls;
  });
}

/**
 * Normalize judge data to use standardized field names
 * @param {Array} judges - Array of judge names
 * @returns {Array} - Array of normalized judge objects
 */
function normalizeJudgeData(judges) {
  if (!Array.isArray(judges)) return judges;
  
  return judges.map(judge => {
    if (typeof judge === 'string') {
      return {
        [STANDARD_FIELDS.JUDGE_NAME]: judge,
        name: judge // Keep for backward compatibility
      };
    } else if (typeof judge === 'object') {
      const normalized = { ...judge };
      
      // Judge name normalization
      if (judge.judge || judge.judgeAssigned) {
        normalized[STANDARD_FIELDS.JUDGE_NAME] = judge.judge || judge.judgeAssigned;
        delete normalized.judge;
        delete normalized.judgeAssigned;
      }
      
      return normalized;
    }
    return judge;
  });
}

// ===========================================
// MAIN DATA LOADING AND SETUP
// ===========================================

/**
 * Load trial setup data and populate form elements
 */
async function initializeTrialSetup() {
  try {
    console.log("🚀 Initializing trial setup with standardized fields...");
    
    // Load data from JSON file
    const response = await fetch('js/data.json');
    const data = await response.json();
    
    // Normalize the loaded data
    const normalizedData = {
      classes: normalizeClassData(data.classes || []),
      judges: normalizeJudgeData(data.judges || []),
      dogs: data.dogs ? data.dogs.map(dog => normalizeDogData(dog)) : []
    };
    
    console.log("✅ Data loaded and normalized:", {
      classes: normalizedData.classes.length,
      judges: normalizedData.judges.length,
      dogs: normalizedData.dogs.length
    });
    
    // Populate form elements
    populateClassSelect(normalizedData.classes);
    populateJudgeSelect(normalizedData.judges);
    setupRegistrationAutocomplete(normalizedData.dogs);
    
    // Store normalized data globally for other functions
    window.trialSetupData = normalizedData;
    
  } catch (error) {
    console.error("❌ Error loading trial setup data:", error);
    alert("Error loading trial setup data: " + error.message);
  }
}

/**
 * Populate classes dropdown with standardized field names
 * @param {Array} classes - Array of normalized class objects
 */
function populateClassSelect(classes) {
  const classSelect = document.getElementById('classSelect');
  if (!classSelect) {
    console.warn("⚠️ Class select element not found");
    return;
  }
  
  // Clear existing options (except default/placeholder)
  const defaultOptions = classSelect.querySelectorAll('option[value=""]');
  classSelect.innerHTML = '';
  defaultOptions.forEach(option => classSelect.appendChild(option));
  
  // Add normalized class options
  classes.forEach(cls => {
    const option = document.createElement('option');
    const className = cls[STANDARD_FIELDS.CLASS_NAME] || cls.name || cls;
    option.value = className;
    option.textContent = className;
    option.dataset.standardized = 'true';
    classSelect.appendChild(option);
  });
  
  console.log(`✅ Populated ${classes.length} classes using standardized field names`);
}

/**
 * Populate judges dropdown with standardized field names
 * @param {Array} judges - Array of normalized judge objects
 */
function populateJudgeSelect(judges) {
  const judgeSelect = document.getElementById('judgeSelect');
  if (!judgeSelect) {
    console.warn("⚠️ Judge select element not found");
    return;
  }
  
  // Clear existing options (except default/placeholder)
  const defaultOptions = judgeSelect.querySelectorAll('option[value=""]');
  judgeSelect.innerHTML = '';
  defaultOptions.forEach(option => judgeSelect.appendChild(option));
  
  // Add normalized judge options
  judges.forEach(judge => {
    const option = document.createElement('option');
    const judgeName = judge[STANDARD_FIELDS.JUDGE_NAME] || judge.name || judge;
    option.value = judgeName;
    option.textContent = judgeName;
    option.dataset.standardized = 'true';
    judgeSelect.appendChild(option);
  });
  
  console.log(`✅ Populated ${judges.length} judges using standardized field names`);
}

/**
 * Setup registration number autocomplete with standardized field names
 * @param {Array} dogs - Array of normalized dog objects
 */
function setupRegistrationAutocomplete(dogs) {
  const regInput = document.getElementById('regInput');
  const callNameInput = document.getElementById('callName');
  const handlerNameInput = document.getElementById('handlerName');
  
  // Also check for standardized field IDs
  const callNameInputStd = document.getElementById(STANDARD_FIELDS.DOG_CALL_NAME);
  const handlerNameInputStd = document.getElementById(STANDARD_FIELDS.HANDLER_NAME);
  const cwagsNumberInput = document.getElementById(STANDARD_FIELDS.CWAGS_NUMBER);
  
  if (!regInput) {
    console.warn("⚠️ Registration input element not found");
    return;
  }
  
  console.log(`🔍 Setting up autocomplete for ${dogs.length} dogs with standardized fields`);
  
  regInput.addEventListener('input', (e) => {
    const inputValue = e.target.value.trim();
    
    if (inputValue.length >= 3) {
      // Find matching dog using standardized field
      const matchingDog = dogs.find(dog => {
        const cwagsNumber = dog[STANDARD_FIELDS.CWAGS_NUMBER] || dog.reg || '';
        return cwagsNumber.toString().toLowerCase().includes(inputValue.toLowerCase());
      });
      
      if (matchingDog) {
        console.log("🎯 Found matching dog:", matchingDog[STANDARD_FIELDS.CWAGS_NUMBER]);
        
        // Fill in call name using standardized field
        const dogCallName = matchingDog[STANDARD_FIELDS.DOG_CALL_NAME] || matchingDog.callName || '';
        if (callNameInput) callNameInput.value = dogCallName;
        if (callNameInputStd) callNameInputStd.value = dogCallName;
        
        // Fill in handler name using standardized field
        const handlerName = matchingDog[STANDARD_FIELDS.HANDLER_NAME] || matchingDog.handler || '';
        if (handlerNameInput) handlerNameInput.value = handlerName;
        if (handlerNameInputStd) handlerNameInputStd.value = handlerName;
        
        // Fill in CWAGS number if there's a dedicated field
        const cwagsNumber = matchingDog[STANDARD_FIELDS.CWAGS_NUMBER] || matchingDog.reg || '';
        if (cwagsNumberInput) cwagsNumberInput.value = cwagsNumber;
        
        // Show success indicator
        showLookupSuccess(matchingDog);
      } else {
        // Clear fields if no match
        if (callNameInput) callNameInput.value = '';
        if (callNameInputStd) callNameInputStd.value = '';
        if (handlerNameInput) handlerNameInput.value = '';
        if (handlerNameInputStd) handlerNameInputStd.value = '';
        if (cwagsNumberInput) cwagsNumberInput.value = '';
        
        hideLookupStatus();
      }
    } else {
      // Clear fields if input too short
      if (callNameInput) callNameInput.value = '';
      if (callNameInputStd) callNameInputStd.value = '';
      if (handlerNameInput) handlerNameInput.value = '';
      if (handlerNameInputStd) handlerNameInputStd.value = '';
      if (cwagsNumberInput) cwagsNumberInput.value = '';
      
      hideLookupStatus();
    }
  });
}

// ===========================================
// LOOKUP STATUS INDICATORS
// ===========================================

/**
 * Show success indicator when registration lookup succeeds
 * @param {Object} dogData - The matched dog data
 */
function showLookupSuccess(dogData) {
  const regInput = document.getElementById('regInput');
  if (!regInput) return;
  
  // Remove any existing status indicators
  hideLookupStatus();
  
  // Add success styling
  regInput.classList.add('lookup-success');
  regInput.style.borderColor = '#4CAF50';
  regInput.style.backgroundColor = '#f8fff8';
  
  // Create success message
  const successMsg = document.createElement('div');
  successMsg.className = 'lookup-status lookup-success-msg';
  successMsg.innerHTML = `
    ✅ Found: ${dogData[STANDARD_FIELDS.DOG_CALL_NAME] || dogData.callName || 'Unknown'} 
    (${dogData[STANDARD_FIELDS.HANDLER_NAME] || dogData.handler || 'Unknown Handler'})
  `;
  successMsg.style.cssText = `
    position: absolute;
    background: #4CAF50;
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    margin-top: 2px;
    z-index: 1000;
  `;
  
  // Insert success message after input
  regInput.parentNode.insertBefore(successMsg, regInput.nextSibling);
  
  // Auto-hide after 3 seconds
  setTimeout(hideLookupStatus, 3000);
}

/**
 * Hide lookup status indicators
 */
function hideLookupStatus() {
  const regInput = document.getElementById('regInput');
  if (regInput) {
    regInput.classList.remove('lookup-success', 'lookup-error');
    regInput.style.borderColor = '';
    regInput.style.backgroundColor = '';
  }
  
  // Remove any status messages
  document.querySelectorAll('.lookup-status').forEach(el => el.remove());
}

// ===========================================
// FORM VALIDATION WITH STANDARDIZED FIELDS
// ===========================================

/**
 * Validate form data using standardized field names
 * @param {Object} formData - Form data to validate
 * @returns {Object} - Validation result
 */
function validateTrialSetupData(formData) {
  const errors = [];
  
  // Validate handler name
  const handlerName = formData[STANDARD_FIELDS.HANDLER_NAME] || formData.handlerName || formData.handler;
  if (!handlerName || handlerName.trim() === '') {
    errors.push("Handler name is required");
  }
  
  // Validate dog call name
  const dogCallName = formData[STANDARD_FIELDS.DOG_CALL_NAME] || formData.dogCallName || formData.callName;
  if (!dogCallName || dogCallName.trim() === '') {
    errors.push("Dog call name is required");
  }
  
  // Validate CWAGS number
  const cwagsNumber = formData[STANDARD_FIELDS.CWAGS_NUMBER] || formData.cwagsNumber || formData.reg;
  if (!cwagsNumber || cwagsNumber.toString().trim() === '') {
    errors.push("CWAGS registration number is required");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get form data using standardized field names
 * @returns {Object} - Standardized form data
 */
function getStandardizedFormData() {
  const formData = {};
  
  // Get handler name from various possible inputs
  const handlerName = 
    document.getElementById(STANDARD_FIELDS.HANDLER_NAME)?.value ||
    document.getElementById('handlerName')?.value ||
    document.getElementById('handler')?.value ||
    '';
  formData[STANDARD_FIELDS.HANDLER_NAME] = handlerName.trim();
  
  // Get dog call name from various possible inputs
  const dogCallName = 
    document.getElementById(STANDARD_FIELDS.DOG_CALL_NAME)?.value ||
    document.getElementById('dogCallName')?.value ||
    document.getElementById('callName')?.value ||
    '';
  formData[STANDARD_FIELDS.DOG_CALL_NAME] = dogCallName.trim();
  
  // Get CWAGS number from various possible inputs
  const cwagsNumber = 
    document.getElementById(STANDARD_FIELDS.CWAGS_NUMBER)?.value ||
    document.getElementById('cwagsNumber')?.value ||
    document.getElementById('regInput')?.value ||
    document.getElementById('registration')?.value ||
    '';
  formData[STANDARD_FIELDS.CWAGS_NUMBER] = cwagsNumber.trim();
  
  // Get class name from dropdown
  const classSelect = document.getElementById('classSelect');
  if (classSelect && classSelect.value) {
    formData[STANDARD_FIELDS.CLASS_NAME] = classSelect.value;
  }
  
  // Get judge name from dropdown
  const judgeSelect = document.getElementById('judgeSelect');
  if (judgeSelect && judgeSelect.value) {
    formData[STANDARD_FIELDS.JUDGE_NAME] = judgeSelect.value;
  }
  
  return formData;
}

// ===========================================
// EXPORT FUNCTIONS FOR EXTERNAL USE
// ===========================================

/**
 * Get available classes using standardized field names
 * @returns {Array} - Array of class objects with standardized fields
 */
function getAvailableClasses() {
  const data = window.trialSetupData;
  if (!data || !data.classes) return [];
  
  return data.classes.map(cls => ({
    [STANDARD_FIELDS.CLASS_NAME]: cls[STANDARD_FIELDS.CLASS_NAME] || cls.name || cls,
    name: cls[STANDARD_FIELDS.CLASS_NAME] || cls.name || cls // Backward compatibility
  }));
}

/**
 * Get available judges using standardized field names
 * @returns {Array} - Array of judge objects with standardized fields
 */
function getAvailableJudges() {
  const data = window.trialSetupData;
  if (!data || !data.judges) return [];
  
  return data.judges.map(judge => ({
    [STANDARD_FIELDS.JUDGE_NAME]: judge[STANDARD_FIELDS.JUDGE_NAME] || judge.name || judge,
    name: judge[STANDARD_FIELDS.JUDGE_NAME] || judge.name || judge // Backward compatibility
  }));
}

/**
 * Find dog by CWAGS number using standardized field names
 * @param {string} cwagsNumber - CWAGS registration number to search for
 * @returns {Object|null} - Found dog data with standardized fields, or null
 */
function findDogByCwagsNumber(cwagsNumber) {
  const data = window.trialSetupData;
  if (!data || !data.dogs || !cwagsNumber) return null;
  
  const dog = data.dogs.find(dog => {
    const dogCwagsNumber = dog[STANDARD_FIELDS.CWAGS_NUMBER] || dog.reg || '';
    return dogCwagsNumber.toString().toLowerCase() === cwagsNumber.toString().toLowerCase();
  });
  
  return dog || null;
}

// ===========================================
// INITIALIZATION AND EVENT BINDING
// ===========================================

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Trial setup initializing with standardized fields...");
  initializeTrialSetup();
});

// Legacy support - initialize if called directly
if (typeof window !== 'undefined') {
  // Make functions available globally for backward compatibility
  window.initializeTrialSetup = initializeTrialSetup;
  window.getStandardizedFormData = getStandardizedFormData;
  window.validateTrialSetupData = validateTrialSetupData;
  window.getAvailableClasses = getAvailableClasses;
  window.getAvailableJudges = getAvailableJudges;
  window.findDogByCwagsNumber = findDogByCwagsNumber;
  window.STANDARD_FIELDS = STANDARD_FIELDS;
}

// Auto-initialize if fetch is available (browser environment)
if (typeof fetch !== 'undefined') {
  initializeTrialSetup().catch(error => {
    console.error("❌ Auto-initialization failed:", error);
  });
}
