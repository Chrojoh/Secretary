// ===========================================
// GLOBAL FIELD MAPPING SOLUTION
// Add this to the TOP of your firebase.js file
// ===========================================

/**
 * UNIVERSAL FIELD MAPPER - Works with ANY object transparently
 * This creates a "smart proxy" that automatically maps field names
 */

// Define all possible field name variations
const FIELD_ALIASES = {
  // Judge variations → all point to 'judge'
  'judge': ['judge', 'judgeName', 'judgeAssigned', 'selectedJudge', 'Judge', 'Judges Name', 'judgename'],
  
  // Handler variations → all point to 'handler'  
  'handler': ['handler', 'handlerName', 'Handler', 'Handler Name', 'participantName'],
  
  // Dog variations → all point to 'dog'
  'dog': ['dog', 'dogCallName', 'dogName', 'callName', 'Call Name', 'Dog Name'],
  
  // Class variations → all point to 'class'
  'class': ['class', 'className', 'Class', 'Class Name', 'classType'],
  
  // Registration variations → all point to 'registration'
  'registration': ['registration', 'cwagsNumber', 'Registration', 'regNumber', 'registrationNumber']
};

/**
 * Creates a smart object that automatically maps field names
 * Usage: const smartEntry = createSmartObject(originalEntry);
 *        console.log(smartEntry.judge); // Works regardless of original field name
 */
function createSmartObject(originalObject) {
  if (!originalObject || typeof originalObject !== 'object') {
    return originalObject;
  }
  
  // Create reverse mapping: alias → canonical name
  const reverseMap = {};
  Object.keys(FIELD_ALIASES).forEach(canonical => {
    FIELD_ALIASES[canonical].forEach(alias => {
      reverseMap[alias.toLowerCase()] = canonical;
    });
  });
  
  // Create proxy that intercepts property access
  return new Proxy(originalObject, {
    get(target, prop) {
      const propStr = String(prop).toLowerCase();
      
      // If asking for a canonical field (judge, handler, dog, class, registration)
      if (FIELD_ALIASES[propStr]) {
        // Look for ANY variation of this field in the original object
        for (const variation of FIELD_ALIASES[propStr]) {
          if (target.hasOwnProperty(variation) && target[variation] != null && target[variation] !== '') {
            return target[variation];
          }
        }
        // Return empty string if no variation found
        return '';
      }
      
      // For non-mapped fields, return original value
      return target[prop];
    },
    
    set(target, prop, value) {
      const propStr = String(prop).toLowerCase();
      
      // If setting a canonical field, set it directly
      if (FIELD_ALIASES[propStr]) {
        target[prop] = value;
        return true;
      }
      
      // For other fields, set normally
      target[prop] = value;
      return true;
    },
    
    has(target, prop) {
      const propStr = String(prop).toLowerCase();
      
      // Check if it's a mapped field
      if (FIELD_ALIASES[propStr]) {
        return FIELD_ALIASES[propStr].some(variation => target.hasOwnProperty(variation));
      }
      
      return target.hasOwnProperty(prop);
    }
  });
}

/**
 * Processes an array of objects to make them all "smart"
 */
function createSmartArray(originalArray) {
  if (!Array.isArray(originalArray)) {
    return originalArray;
  }
  
  return originalArray.map(item => createSmartObject(item));
}

/**
 * UNIVERSAL ENTRY PROCESSOR
 * Use this in ANY file that processes entries from Firebase
 */
function processEntriesUniversally(entries) {
  console.log("🔄 Processing entries with universal field mapping...");
  
  const processedEntries = [];
  
  entries.forEach(entryDoc => {
    // Make the main entry document "smart"
    const smartEntry = createSmartObject(entryDoc);
    
    if (entryDoc.selectedEntries && Array.isArray(entryDoc.selectedEntries)) {
      entryDoc.selectedEntries.forEach((selectedEntry, index) => {
        // Make each selected entry "smart" too
        const smartSelected = createSmartObject(selectedEntry);
        
        // Combine both into a final smart object
        const combinedEntry = createSmartObject({
          ...entryDoc,           // Base entry data
          ...selectedEntry,      // Selected entry data
          
          // Now you can access ANY field using the canonical names:
          judge: smartSelected.judge || smartEntry.judge || 'Judge TBD',
          handler: smartSelected.handler || smartEntry.handler || 'Unknown Handler', 
          dog: smartSelected.dog || smartEntry.dog || 'Unknown Dog',
          class: smartSelected.class || 'Unknown Class',
          registration: smartSelected.registration || smartEntry.registration || 'No Reg',
          
          // Preserve metadata
          entryId: entryDoc.id || `entry_${index}`,
          entryIndex: index,
          type: selectedEntry.type || 'regular'
        });
        
        processedEntries.push(combinedEntry);
      });
    } else {
      // Single entry, no selectedEntries array
      processedEntries.push(smartEntry);
    }
  });
  
  console.log(`✅ Processed ${processedEntries.length} entries with universal mapping`);
  return processedEntries;
}

// ===========================================
// USAGE EXAMPLES - Replace your existing code with these patterns:
// ===========================================

/*
// IN RUNNING-ORDER.HTML - Replace your loadTrialEntries function with:
async function loadTrialEntries(trialId) {
  try {
    const entriesQuery = query(collection(db, 'entries'), where('trialId', '==', trialId));
    const entriesSnapshot = await getDocs(entriesQuery);
    
    const rawEntries = [];
    entriesSnapshot.forEach(doc => {
      rawEntries.push({ id: doc.id, ...doc.data() });
    });
    
    // Use the universal processor
    allEntries = processEntriesUniversally(rawEntries);
    
    console.log("✅ Loaded entries with universal field mapping:", allEntries.length);
    
  } catch (error) {
    console.error("❌ Error loading entries:", error);
    throw error;
  }
}

// IN RUNNING-ORDER.HTML - Your processRoundsData becomes simple:
function processRoundsData() {
  roundsData = [];
  const roundsMap = new Map();

  allEntries.forEach(entry => {
    // Now you can use simple, consistent field names!
    const roundKey = `${entry.date}_${entry.class}_${entry.roundNumber}_${entry.judge}`;
    
    if (!roundsMap.has(roundKey)) {
      roundsMap.set(roundKey, {
        date: entry.date,
        dateDisplay: formatDateForDisplay(entry.date),
        className: entry.class,        // ← Simple!
        roundNumber: entry.roundNumber,
        judgeName: entry.judge,        // ← Simple!
        entries: []
      });
    }
    
    roundsMap.get(roundKey).entries.push(entry);
  });

  roundsData = Array.from(roundsMap.values());
  console.log("✅ Processed rounds with simple field access");
}

// IN RUNNING-ORDER.HTML - Your generateRunningOrder becomes simple:
function generateRunningOrder() {
  // ... existing code ...
  
  const entriesHTML = round.entries.map((entry, entryIndex) => `
    <tr>
      <td style="text-align: center; width: 60px;">
        <div class="entry-number">${entryIndex + 1}</div>
      </td>
      <td>
        <div class="handler-name">${entry.handler}</div>     <!-- Simple! -->
        <div class="dog-name">${entry.dog}</div>             <!-- Simple! -->
      </td>
      <td style="text-align: center; width: 80px;">
        <span class="entry-type ${entry.type}">${entry.type === 'feo' ? 'FEO' : 'REG'}</span>
      </td>
      <td style="width: 120px;">${entry.registration}</td>   <!-- Simple! -->
      <td style="width: 100px; border-right: 2px solid #000;"></td>
      <td style="width: 100px;"></td>
    </tr>
  `).join('');
  
  // ... rest of function ...
}
*/

// ===========================================
// INTEGRATION INSTRUCTIONS:
// ===========================================

/*
1. Add this entire code block to the TOP of your firebase.js file

2. In ANY file that processes entries, replace your entry processing with:
   const processedEntries = processEntriesUniversally(rawEntriesFromFirebase);

3. Then access fields using the simple canonical names:
   - entry.judge    (instead of entry.judgeName || entry.judge || entry.judgeAssigned)
   - entry.handler  (instead of entry.handlerName || entry.Handler || entry.handler)  
   - entry.dog      (instead of entry.dogCallName || entry.dogName || entry['Call Name'])
   - entry.class    (instead of entry.className || entry.Class || entry.class)
   - entry.registration (instead of entry.cwagsNumber || entry.Registration)

4. The mapping works AUTOMATICALLY - you don't need to change your existing data structure!

5. No need to modify create-trial.html or entry-form.html - they can keep saving 
   data however they want. This solution adapts to read ANY field name variation.
*/

// Export for use in other files
if (typeof window !== 'undefined') {
  window.createSmartObject = createSmartObject;
  window.createSmartArray = createSmartArray;
  window.processEntriesUniversally = processEntriesUniversally;
  window.FIELD_ALIASES = FIELD_ALIASES;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbmbWZ2lH9ikUMFPpqH1nRB-czpXzYjDs",
  authDomain: "trial-secretary-cf449.firebaseapp.com",
  projectId: "trial-secretary-cf449",
  storageBucket: "trial-secretary-cf449.appspot.com",
  messagingSenderId: "742305544428",
  appId: "1:742305544428:web:c50b207ec1ae7b54c1cdc9",
  measurementId: "G-W0SP1XJT8X"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
