import { db, auth } from './firebase.js';
import { addDoc, collection } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

let data = null;

fetch('./js/data.json')
  .then(res => res.json())
  .then(json => { data = json; });

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

  for (let i = 0; i < num; i++) {
    const cls = document.createElement("div");
    const classOpts = data.classes.map(c => `<option value="${c}">${c}</option>`).join("");
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
  const judgeOpts = data.judges.map(j => `<option value="${j}">${j}</option>`).join("");

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
