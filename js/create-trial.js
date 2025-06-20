import { db, auth } from './firebase.js';
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let data = null;
let classes = [];
let judges = [];

fetch('./js/data.json')
  .then(res => res.json())
  .then(json => { 
    data = json;
    console.log("Data loaded:", data);
    
    // Extract unique classes and judges from the data
    if (Array.isArray(data)) {
      // Get unique classes (filter out empty strings)
      classes = [...new Set(data.map(item => item.Class).filter(cls => cls && cls.trim() !== ""))];
      
      // Get unique judges (filter out empty strings)
      judges = [...new Set(data.map(item => item.Judges).filter(judge => judge && judge.trim() !== ""))];
      
      console.log("Classes found:", classes);
      console.log("Judges found:", judges);
      
      // If no classes/judges found in data, use defaults
      if (classes.length === 0) {
        classes = ["Novice A", "Novice B", "Open A", "Open B", "Utility A", "Utility B", "Graduate Novice", "Graduate Open"];
      }
      if (judges.length === 0) {
        judges = ["Judge 1", "Judge 2", "Judge 3", "Judge 4"];
      }
    }
  })
  .catch(err => {
    console.error('Error loading data:', err);
    // Use default values if loading fails
    classes = ["Novice A", "Novice B", "Open A", "Open B", "Utility A", "Utility B"];
    judges = ["Judge 1", "Judge 2", "Judge 3", "Judge 4"];
  });

window.generateDays = function () {
  const numDays = parseInt(document.getElementById("numDays").value);
  const container = document.getElementById("daysContainer");
  container.innerHTML = "";

  for (let d = 0; d < numDays; d++) {
    const dayBox = document.createElement("div");
    dayBox.innerHTML = `
      <h3>Day ${d + 1}</h3>
      <input type="date" name="date${d}">
      <label>How many classes?</label>
      <input type="number" min="1" onchange="generateClasses(this, ${d})">
      <div class="classes-container"></div>
    `;
    container.appendChild(dayBox);
  }
};

window.generateClasses = function (input, dayIndex) {
  const num = parseInt(input.value);
  const container = input.nextElementSibling;
  container.innerHTML = "";

  // Check if we have classes available
  if (classes.length === 0) {
    console.log("Classes not loaded yet, please wait and try again");
    input.value = ""; // Reset the input
    return;
  }

  console.log("Generating", num, "classes with options:", classes);

  const classOpts = classes.map(c => `<option value="${c}">${c}</option>`).join("");

  for (let i = 0; i < num; i++) {
    const cls = document.createElement("div");
    cls.innerHTML = `
      <h4>Class ${i + 1}</h4>
      <input list="classList${dayIndex}_${i}" placeholder="Select Class">
      <datalist id="classList${dayIndex}_${i}">${classOpts}</datalist>
      <label>Rounds:</label>
      <select onchange="generateRounds(this, '${dayIndex}_${i}')">
        ${[...Array(10).keys()].map(n => `<option>${n + 1}</option>`).join("")}
      </select>
      <div class="rounds-container"></div>
    `;
    container.appendChild(cls);
  }
};

window.generateRounds = function (select, id) {
  const container = select.nextElementSibling;
  const num = parseInt(select.value);
  container.innerHTML = "";
  
  // Check if we have judges available
  if (judges.length === 0) {
    console.log("Judges not loaded yet, please wait and try again");
    return;
  }

  console.log("Generating", num, "rounds with judge options:", judges);

  const judgeOpts = judges.map(j => `<option value="${j}">${j}</option>`).join("");

  for (let i = 0; i < num; i++) {
    const round = document.createElement("div");
    round.innerHTML = `
      <input list="judgeList${id}_${i}" placeholder="Judge">
      <datalist id="judgeList${id}_${i}">${judgeOpts}</datalist>
      <label>FEO?</label>
      <input type="checkbox">
    `;
    container.appendChild(round);
  }
};

// Add form submit handler
document.getElementById('trialForm').addEventListener('submit', function(e) {
  e.preventDefault();
  console.log("Form submitted");
  // Add your save logic here
});
