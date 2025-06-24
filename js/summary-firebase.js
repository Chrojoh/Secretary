// js/summary-firebase.js
// Firebase integration functions for Class Summary system

import { db, auth } from './firebase.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

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

// ========================================
// TIMEZONE-SAFE DATE UTILITIES
// ========================================

function createLocalDate(dateStr) {
  if (!dateStr) return null;
  const dateWithTime = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00';
  return new Date(dateWithTime);
}

function formatLocalDate(date) {
  if (!date || !(date instanceof Date)) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function prepareDateForFirebase(dateStr) {
  if (!dateStr) return null;
  const date = createLocalDate(dateStr);
  return date ? Timestamp.fromDate(date) : null;
}

function getDateFromFirebase(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return formatLocalDate(timestamp.toDate());
  }
  return null;
}

// ========================================
// DATA NORMALIZATION FUNCTIONS
// ========================================

/**
 * Normalize entry data to use standardized field names
 * @param {Object} entry - Entry data to normalize
 * @returns {Object} - Normalized entry data
 */
function normalizeEntry(entry) {
  if (!entry) return entry;
  
  const normalized = { ...entry };
  
  // Handler name normalization
  if (entry.handler || entry.Handler) {
    normalized[STANDARD_FIELDS.HANDLER_NAME] = entry.handler || entry.Handler;
    delete normalized.handler;
    delete normalized.Handler;
  }
  
  // Dog call name normalization
  if (entry.dogName || entry['Call Name'] || entry.callName) {
    normalized[STANDARD_FIELDS.DOG_CALL_NAME] = entry.dogName || entry['Call Name'] || entry.callName;
    delete normalized.dogName;
    delete normalized['Call Name'];
    delete normalized.callName;
  }
  
  // Judge name normalization
  if (entry.judge || entry.judgeAssigned) {
    normalized[STANDARD_FIELDS.JUDGE_NAME] = entry.judge || entry.judgeAssigned;
    delete normalized.judge;
    delete normalized.judgeAssigned;
  }
  
  // Class name normalization
  if (entry.Class || entry.class) {
    normalized[STANDARD_FIELDS.CLASS_NAME] = entry.Class || entry.class;
    delete normalized.Class;
    delete normalized.class;
  }
  
  // CWAGS number normalization
  if (entry.Registration || entry.registration || entry.registrationNumber) {
    normalized[STANDARD_FIELDS.CWAGS_NUMBER] = entry.Registration || entry.registration || entry.registrationNumber;
    delete normalized.Registration;
    delete normalized.registration;
    delete normalized.registrationNumber;
  }
  
  return normalized;
}

/**
 * Normalize class data to use standardized field names
 * @param {Object} classItem - Class data to normalize
 * @returns {Object} - Normalized class data
 */
function normalizeClassData(classItem) {
  if (!classItem) return classItem;
  
  const normalized = { ...classItem };
  
  // Class name normalization
  if (classItem.name && !normalized[STANDARD_FIELDS.CLASS_NAME]) {
    normalized[STANDARD_FIELDS.CLASS_NAME] = classItem.name;
  }
  if (classItem.Class || classItem.class) {
    normalized[STANDARD_FIELDS.CLASS_NAME] = classItem.Class || classItem.class;
    delete normalized.Class;
    delete normalized.class;
  }
  
  // Normalize entries within the class
  if (normalized.entries && Array.isArray(normalized.entries)) {
    normalized.entries = normalized.entries.map(entry => normalizeEntry(entry));
  }
  
  // Normalize dates with judge information
  if (normalized.dates && Array.isArray(normalized.dates)) {
    normalized.dates = normalized.dates.map(dateItem => {
      const normalizedDate = { ...dateItem };
      
      // Judge name normalization in date items
      if (dateItem.judge || dateItem.judgeAssigned) {
        normalizedDate[STANDARD_FIELDS.JUDGE_NAME] = dateItem.judge || dateItem.judgeAssigned;
        delete normalizedDate.judge;
        delete normalizedDate.judgeAssigned;
      }
      
      return normalizedDate;
    });
  }
  
  return normalized;
}

/**
 * Normalize summary data to use standardized field names
 * @param {Object} summaryData - Summary data to normalize
 * @returns {Object} - Normalized summary data
 */
function normalizeSummaryData(summaryData) {
  if (!summaryData) return summaryData;
  
  const normalized = { ...summaryData };
  
  // Normalize classes array
  if (normalized.classes && Array.isArray(normalized.classes)) {
    normalized.classes = normalized.classes.map(classItem => normalizeClassData(classItem));
  }
  
  return normalized;
}

// ========================================
// SUMMARY DATA MANAGEMENT
// ========================================

/**
 * Save a class summary to Firebase
 * @param {Object} summaryData - The summary data to save
 * @returns {Promise<string>} - Document ID of saved summary
 */
export async function saveSummary(summaryData) {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to save summaries");
  }

  try {
    // Normalize data before saving
    const normalizedData = normalizeSummaryData(summaryData);
    
    // Prepare data for Firebase storage
    const firebaseData = {
      ...normalizedData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Process classes to handle dates properly
      classes: normalizedData.classes ? normalizedData.classes.map(classItem => ({
        ...classItem,
        dates: classItem.dates ? classItem.dates.map(dateItem => ({
          ...dateItem,
          date: prepareDateForFirebase(dateItem.date)
        })) : []
      })) : []
    };

    const docRef = await addDoc(collection(db, "classSummaries"), firebaseData);
    console.log("Summary saved with ID (standardized fields):", docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error("Error saving summary:", error);
    throw new Error("Failed to save summary: " + error.message);
  }
}

/**
 * Update an existing class summary
 * @param {string} summaryId - ID of summary to update
 * @param {Object} summaryData - Updated summary data
 * @returns {Promise<void>}
 */
export async function updateSummary(summaryId, summaryData) {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to update summaries");
  }

  try {
    // Normalize data before updating
    const normalizedData = normalizeSummaryData(summaryData);
    
    // Prepare data for Firebase storage
    const firebaseData = {
      ...normalizedData,
      updatedAt: Timestamp.now(),
      // Process classes to handle dates properly
      classes: normalizedData.classes ? normalizedData.classes.map(classItem => ({
        ...classItem,
        dates: classItem.dates ? classItem.dates.map(dateItem => ({
          ...dateItem,
          date: prepareDateForFirebase(dateItem.date)
        })) : []
      })) : []
    };

    await updateDoc(doc(db, "classSummaries", summaryId), firebaseData);
    console.log("Summary updated (standardized fields):", summaryId);
    
  } catch (error) {
    console.error("Error updating summary:", error);
    throw new Error("Failed to update summary: " + error.message);
  }
}

/**
 * Load a specific class summary by ID
 * @param {string} summaryId - ID of summary to load
 * @returns {Promise<Object>} - Summary data
 */
export async function loadSummary(summaryId) {
  try {
    const docSnap = await getDoc(doc(db, "classSummaries", summaryId));
    
    if (!docSnap.exists()) {
      throw new Error("Summary not found");
    }

    const data = docSnap.data();
    
    // Process dates back from Firebase and normalize
    const processedData = {
      ...data,
      classes: data.classes ? data.classes.map(classItem => normalizeClassData({
        ...classItem,
        dates: classItem.dates ? classItem.dates.map(dateItem => ({
          ...dateItem,
          date: getDateFromFirebase(dateItem.date)
        })) : []
      })) : []
    };

    return {
      id: docSnap.id,
      ...processedData
    };
    
  } catch (error) {
    console.error("Error loading summary:", error);
    throw new Error("Failed to load summary: " + error.message);
  }
}

/**
 * Load all summaries for current user
 * @returns {Promise<Array>} - Array of summary objects
 */
export async function loadUserSummaries() {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const summariesQuery = query(
      collection(db, "classSummaries"),
      where("createdBy", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );
    
    const querySnapshot = await getDocs(summariesQuery);
    
    const summaries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Process dates back from Firebase and normalize
      const processedData = {
        ...data,
        classes: data.classes ? data.classes.map(classItem => normalizeClassData({
          ...classItem,
          dates: classItem.dates ? classItem.dates.map(dateItem => ({
            ...dateItem,
            date: getDateFromFirebase(dateItem.date)
          })) : []
        })) : []
      };

      return {
        id: doc.id,
        ...processedData
      };
    });

    return summaries;
    
  } catch (error) {
    console.error("Error loading user summaries:", error);
    throw new Error("Failed to load summaries: " + error.message);
  }
}

/**
 * Delete a class summary
 * @param {string} summaryId - ID of summary to delete
 * @returns {Promise<void>}
 */
export async function deleteSummary(summaryId) {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to delete summaries");
  }

  try {
    // Verify ownership before deleting
    const docSnap = await getDoc(doc(db, "classSummaries", summaryId));
    
    if (!docSnap.exists()) {
      throw new Error("Summary not found");
    }

    const data = docSnap.data();
    if (data.createdBy !== auth.currentUser.uid) {
      throw new Error("You don't have permission to delete this summary");
    }

    await deleteDoc(doc(db, "classSummaries", summaryId));
    console.log("Summary deleted:", summaryId);
    
  } catch (error) {
    console.error("Error deleting summary:", error);
    throw new Error("Failed to delete summary: " + error.message);
  }
}

// ========================================
// GENERATED REPORTS MANAGEMENT
// ========================================

/**
 * Save a generated report reference to Firebase
 * @param {Object} reportData - Report metadata and data
 * @returns {Promise<string>} - Document ID of saved report
 */
export async function saveGeneratedReport(reportData) {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to save reports");
  }

  try {
    // Normalize report data
    const normalizedData = normalizeSummaryData(reportData);
    
    const firebaseData = {
      ...normalizedData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, "generatedReports"), firebaseData);
    console.log("Report saved with ID (standardized fields):", docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error("Error saving report:", error);
    throw new Error("Failed to save report: " + error.message);
  }
}

/**
 * Load all generated reports for current user
 * @returns {Promise<Array>} - Array of report objects
 */
export async function loadUserReports() {
  if (!auth.currentUser) {
    return [];
  }

  try {
    const reportsQuery = query(
      collection(db, "generatedReports"),
      where("createdBy", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(reportsQuery);
    
    const reports = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...normalizeSummaryData(data)
      };
    });

    return reports;
    
  } catch (error) {
    console.error("Error loading user reports:", error);
    throw new Error("Failed to load reports: " + error.message);
  }
}

/**
 * Delete a generated report
 * @param {string} reportId - ID of report to delete
 * @returns {Promise<void>}
 */
export async function deleteGeneratedReport(reportId) {
  if (!auth.currentUser) {
    throw new Error("User must be logged in to delete reports");
  }

  try {
    // Verify ownership before deleting
    const docSnap = await getDoc(doc(db, "generatedReports", reportId));
    
    if (!docSnap.exists()) {
      throw new Error("Report not found");
    }

    const data = docSnap.data();
    if (data.createdBy !== auth.currentUser.uid) {
      throw new Error("You don't have permission to delete this report");
    }

    await deleteDoc(doc(db, "generatedReports", reportId));
    console.log("Report deleted:", reportId);
    
  } catch (error) {
    console.error("Error deleting report:", error);
    throw new Error("Failed to delete report: " + error.message);
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Calculate statistics for a summary
 * @param {Object} summaryData - Summary data
 * @returns {Object} - Statistics object
 */
export function calculateSummaryStatistics(summaryData) {
  const normalizedData = normalizeSummaryData(summaryData);
  
  if (!normalizedData.classes) {
    return {
      totalClasses: 0,
      totalEntries: 0,
      totalRuns: 0,
      qualifyingRuns: 0
    };
  }

  let totalEntries = 0;
  let totalRuns = 0;
  let qualifyingRuns = 0;

  normalizedData.classes.forEach(classItem => {
    if (classItem.entries) {
      totalEntries += classItem.entries.length;
      
      classItem.entries.forEach(entry => {
        if (entry.results) {
          entry.results.forEach(result => {
            if (result && result !== '' && result !== 'XX') {
              totalRuns++;
              if (result === 'Pass') {
                qualifyingRuns++;
              }
            }
          });
        }
      });
    }
  });

  return {
    totalClasses: normalizedData.classes.length,
    totalEntries,
    totalRuns,
    qualifyingRuns
  };
}

/**
 * Validate summary data before saving
 * @param {Object} summaryData - Summary data to validate
 * @returns {Object} - Validation result
 */
export function validateSummaryData(summaryData) {
  const normalizedData = normalizeSummaryData(summaryData);
  const errors = [];
  
  if (!normalizedData.hostName || normalizedData.hostName.trim() === '') {
    errors.push("Host name is required");
  }
  
  if (!normalizedData.dateRange || normalizedData.dateRange.trim() === '') {
    errors.push("Date range is required");
  }
  
  if (!normalizedData.classes || normalizedData.classes.length === 0) {
    errors.push("At least one class is required");
  } else {
    normalizedData.classes.forEach((classItem, index) => {
      // Check for class name using standardized field
      const className = classItem[STANDARD_FIELDS.CLASS_NAME] || classItem.name;
      if (!className || className.trim() === '') {
        errors.push(`Class ${index + 1} name is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ========================================
// INTEGRATION WITH EXISTING FORMS
// ========================================

/**
 * Create a summary from trial data using standardized field names
 * @param {Object} trialData - Trial data from your existing system
 * @returns {Object} - Summary data structure
 */
export function createSummaryFromTrial(trialData) {
  const summary = {
    hostName: trialData.clubName || '',
    dateRange: formatDateRange(trialData.days),
    classes: []
  };

  if (trialData.days && trialData.days.length > 0) {
    // Extract unique classes across all days
    const classMap = new Map();
    
    trialData.days.forEach(day => {
      if (day.classes) {
        day.classes.forEach(classItem => {
          // Use standardized class name field
          const className = classItem[STANDARD_FIELDS.CLASS_NAME] || classItem.className || classItem.Class || classItem.class;
          
          if (!classMap.has(className)) {
            classMap.set(className, {
              id: classMap.size + 1,
              [STANDARD_FIELDS.CLASS_NAME]: className,
              name: className, // Keep for backward compatibility
              dates: [],
              entries: []
            });
          }
          
          const summaryClass = classMap.get(className);
          
          // Add date/judge information using standardized fields
          if (classItem.rounds) {
            classItem.rounds.forEach(round => {
              const judgeName = round[STANDARD_FIELDS.JUDGE_NAME] || round.judge || round.judgeAssigned || '';
              summaryClass.dates.push({
                date: day.date,
                [STANDARD_FIELDS.JUDGE_NAME]: judgeName,
                judge: judgeName // Keep for backward compatibility
              });
            });
          }
        });
      }
    });
    
    summary.classes = Array.from(classMap.values());
  }

  return summary;
}

/**
 * Create entry data using standardized field names
 * @param {Object} entryData - Raw entry data
 * @returns {Object} - Standardized entry data
 */
export function createStandardizedEntry(entryData) {
  const normalized = normalizeEntry(entryData);
  
  return {
    id: normalized.id || Date.now(),
    [STANDARD_FIELDS.HANDLER_NAME]: normalized[STANDARD_FIELDS.HANDLER_NAME] || '',
    [STANDARD_FIELDS.DOG_CALL_NAME]: normalized[STANDARD_FIELDS.DOG_CALL_NAME] || '',
    [STANDARD_FIELDS.CWAGS_NUMBER]: normalized[STANDARD_FIELDS.CWAGS_NUMBER] || '',
    results: normalized.results || []
  };
}

/**
 * Format date range from days array
 * @param {Array} days - Array of day objects
 * @returns {string} - Formatted date range
 */
function formatDateRange(days) {
  if (!days || days.length === 0) return '';
  
  const dates = days
    .map(day => day.date)
    .filter(date => date)
    .sort();
    
  if (dates.length === 0) return '';
  if (dates.length === 1) return dates[0];
  
  return `${dates[0]} - ${dates[dates.length - 1]}`;
}

// ========================================
// EXPORT FOR BACKWARD COMPATIBILITY
// ========================================

// Export standard fields for use in other modules
export { STANDARD_FIELDS };
