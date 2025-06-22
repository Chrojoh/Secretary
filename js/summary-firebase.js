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

// ========================================
// TIMEZONE-SAFE DATE UTILITIES (from your existing code)
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
    // Prepare data for Firebase storage
    const firebaseData = {
      ...summaryData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      // Process classes to handle dates properly
      classes: summaryData.classes ? summaryData.classes.map(classItem => ({
        ...classItem,
        dates: classItem.dates ? classItem.dates.map(dateItem => ({
          ...dateItem,
          date: prepareDateForFirebase(dateItem.date)
        })) : []
      })) : []
    };

    const docRef = await addDoc(collection(db, "classSummaries"), firebaseData);
    console.log("Summary saved with ID:", docRef.id);
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
    // Prepare data for Firebase storage
    const firebaseData = {
      ...summaryData,
      updatedAt: Timestamp.now(),
      // Process classes to handle dates properly
      classes: summaryData.classes ? summaryData.classes.map(classItem => ({
        ...classItem,
        dates: classItem.dates ? classItem.dates.map(dateItem => ({
          ...dateItem,
          date: prepareDateForFirebase(dateItem.date)
        })) : []
      })) : []
    };

    await updateDoc(doc(db, "classSummaries", summaryId), firebaseData);
    console.log("Summary updated:", summaryId);
    
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
    const summariesQuery = query(
      collection(db, "classSummaries"),
      where("createdBy", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );
    
    const querySnapshot = await getDocs(summariesQuery);
    
    const summaries = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Process dates back from Firebase
      const processedData = {
        ...data,
        classes: data.classes ? data.classes.map(classItem => ({
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
    const firebaseData = {
      ...reportData,
      createdBy: auth.currentUser.uid,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, "generatedReports"), firebaseData);
    console.log("Report saved with ID:", docRef.id);
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
    
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

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
  if (!summaryData.classes) {
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

  summaryData.classes.forEach(classItem => {
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
    totalClasses: summaryData.classes.length,
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
  const errors = [];
  
  if (!summaryData.hostName || summaryData.hostName.trim() === '') {
    errors.push("Host name is required");
  }
  
  if (!summaryData.dateRange || summaryData.dateRange.trim() === '') {
    errors.push("Date range is required");
  }
  
  if (!summaryData.classes || summaryData.classes.length === 0) {
    errors.push("At least one class is required");
  } else {
    summaryData.classes.forEach((classItem, index) => {
      if (!classItem.name || classItem.name.trim() === '') {
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
 * Create a summary from trial data
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
          if (!classMap.has(classItem.className)) {
            classMap.set(classItem.className, {
              id: classMap.size + 1,
              name: classItem.className,
              dates: [],
              entries: []
            });
          }
          
          const summaryClass = classMap.get(classItem.className);
          
          // Add date/judge information
          if (classItem.rounds) {
            classItem.rounds.forEach(round => {
              summaryClass.dates.push({
                date: day.date,
                judge: round.judge || ''
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
} docSnap = await getDoc(doc(db, "classSummaries", summaryId));
    
    if (!docSnap.exists()) {
      throw new Error("Summary not found");
    }

    const data = docSnap.data();
    
    // Process dates back from Firebase
    const processedData = {
      ...data,
      classes: data.classes ? data.classes.map(classItem => ({
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
    const
