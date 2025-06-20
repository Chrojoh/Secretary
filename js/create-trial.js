import { db, auth } from './firebase.js';
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let dataLoaded = false;
let availableClasses = [];
let availableJudges = [];

// Load the data and extract classes and judges
fetch('./js/data.json')
  .then(res => res.json())
  .then(data => { 
    console.log("Data loaded successfully");
    console.log("Sample records:", data.slice(0, 3));
    
    if (Array.isArray(data)) {
      // Extract unique classes (filter out empty strings)
      const classSet = new Set();
      const judgeSet = new Set();
      
      data.forEach(record => {
        if (record.Class && record.Class.trim() !== "") {
          classSet.add(record.Class.trim());
        }
        if (record.Judges && record.Judges.trim() !== "") {
          judgeSet.add(record.Judges.trim());
        }
      });
      
      availableClasses = Array.from(classSet).sort();
      availableJudges = Array.from(judgeSet).sort();
      
      console.log("Classes found:", availableClasses);
      console.log("Judges found:", availableJudges);
      console.log(`Extracted ${availableClasses.length} classes and ${availableJudges.length} judges`);
      
      // If no classes/judges found, use fallbacks
      if (availableClasses.length === 0) {
        availableClasses = ["Class TBD", "Novice", "Open", "Utility"];
        console.log("No classes found in data, using fallbacks");
      }
      if (availableJudges.length === 0) {
        availableJudges = ["Judge TBD", "Judge 1", "Judge 2"];
        console.log("No judges found in data, using fallbacks");
      }
    }
    
    dataLoaded = true;
  })
  .catch(err => {
    console.error('Error loading data:', err);
    // Use fallback data if loading fails
    availableClasses = ["Class TBD", "Novice", "Open", "Utility"];
    availableJudges = ["Judge TBD", "Judge 1", "Judge 2"];
    dataLoaded = true;
  });

window.generateDays = function () {
  console.log("generateDays called");
  
  const numDaysInput = document.getElementById("numDays");
  const numDays = parseInt(numDaysInput.value);
  
  if (isNaN(numDays) || numDays < 1) {
    alert("Please enter a valid number of days (1 or more)");
    return;
  }
  
  const container = document.getElementById("daysContainer");
  container.innerHTML = "";

  for (let d = 0; d < numDays; d++) {
    const dayBox = document.createElement("div");
    dayBox.style.border = "1px solid #ccc";
    dayBox.style.padding = "10px";
    dayBox.style.marginBottom = "10px";
    
    dayBox.innerHTML = `
      <h3>Day ${d + 1}</h3>
      <label>Date:</label>
      <input type="date" name="date${d}" style="margin-bottom: 10px;">
      <br>
      <label>How many classes?</label>
      <input type="number" min="1" max="20" style="margin-left: 10px;" onchange="generateClasses(this, ${d})">
      <div class="classes-container" style="margin-top: 10px;"></div>
    `;
    container.appendChild(dayBox);
  }
  
  console.log(`Generated ${numDays} day boxes`);
};

window.generateClasses = function (input, dayIndex) {
  console.log(`generateClasses called for day ${dayIndex}`);
  
  // Check if data is loaded
  if (!dataLoaded) {
    alert("Data is still loading, please wait a moment and try again");
    input.value = "";
    return;
  }
  
  try {
    const num = parseInt(input.value);
    
    if (isNaN(num) || num < 1) {
      console.log("Invalid number of classes");
      return;
    }
    
    const container = input.nextElementSibling;
    if (!container) {
      console.error("Container not found");
      return;
    }
    
    container.innerHTML = "";
    
    console.log(`Creating ${num} classes with ${availableClasses.length} class options`);
    console.log("Available classes:", availableClasses);
    
    const classOpts = availableClasses.map(c => `<option value="${c}">${c}</option>`).join("");
    
    for (let i = 0; i < num; i++) {
      const cls = document.createElement("div");
      cls.style.border = "1px solid #eee";
      cls.style.padding = "8px";
      cls.style.marginBottom = "8px";
      cls.style.backgroundColor = "#f9f9f9";
      
      cls.innerHTML = `
        <h4>Class ${i + 1}</h4>
        <label>Class Type:</label>
        <input list="classList${dayIndex}_${i}" placeholder="Select Class" style="margin-left: 10px; width: 200px;">
        <datalist id="classList${dayIndex}_${i}">${classOpts}</datalist>
        <br><br>
        <label>Number of Rounds:</label>
        <select style="margin-left: 10px;" onchange="generateRounds(this, '${dayIndex}_${i}')">
          <option value="">Select rounds</option>
          ${[...Array(10).keys()].map(n => `<option value="${n + 1}">${n + 1}</option>`).join("")}
        </select>
        <div class="rounds-container" style="margin-top: 10px;"></div>
      `;
      container.appendChild(cls);
    }
    
    console.log(`Successfully created ${num} classes`);
    
  } catch (error) {
    console.error("Error in generateClasses:", error);
    alert("An error occurred while generating classes. Please try again.");
  }
};

window.generateRounds = function (select, id) {
  console.log(`generateRounds called for ${id}`);
  
  try {
    const container = select.nextElementSibling;
    if (!container) {
      console.error("Rounds container not found");
      return;
    }
    
    const num = parseInt(select.value);
    if (isNaN(num) || num < 1) {
      container.innerHTML = "";
      return;
    }
    
    container.innerHTML = "";
    
    console.log(`Creating ${num} rounds with ${availableJudges.length} judge options`);
    console.log("Available judges:", availableJudges.slice(0, 5), "...");
    
    const judgeOpts = availableJudges.map(j => `<option value="${j}">${j}</option>`).join("");

    for (let i = 0; i < num; i++) {
      const round = document.createElement("div");
      round.style.padding = "5px";
      round.style.marginBottom = "5px";
      round.style.backgroundColor = "#f0f0f0";
      
      round.innerHTML = `
        <strong>Round ${i + 1}:</strong>
        <label>Judge:</label>
        <input list="judgeList${id}_${i}" placeholder="Select Judge" style="margin-left: 10px; width: 150px;">
        <datalist id="judgeList${id}_${i}">${judgeOpts}</datalist>
        <label style="margin-left: 15px;">
          <input type="checkbox"> FEO (For Exhibition Only)
        </label>
      `;
      container.appendChild(round);
    }
    
    console.log(`Successfully created ${num} rounds`);
    
  } catch (error) {
    console.error("Error in generateRounds:", error);
    alert("An error occurred while generating rounds. Please try again.");
  }
};

// Add form submit handler
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('trialForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Form submitted");
      
      // Collect all form data
      const formData = new FormData(form);
      const trialData = {
        clubName: formData.get('clubName'),
        secretary: formData.get('secretary'),
        numDays: document.getElementById('numDays').value,
        days: []
      };
      
      console.log("Trial data collected:", trialData);
      alert("Trial data would be saved here. Check console for details.");
    });
  }
  
  console.log("Create trial page loaded successfully");
});
