import data from './data.json' assert { type: "json" };

window.generateDays = function () {
  const numDays = parseInt(document.getElementById("numDays").value);
  const container = document.getElementById("daysContainer");
  container.innerHTML = ""; // reset

  for (let d = 0; d < numDays; d++) {
    const dayBox = document.createElement("div");
    dayBox.classList.add("day-box");

    dayBox.innerHTML = `
      <h3>Day ${d + 1}</h3>
      <label>Date:</label>
      <input type="date" name="date${d}">

      <label>How many classes this day?</label>
      <input type="number" min="1" max="10" onchange="generateClasses(this, ${d})">
      <div class="classes-container"></div>
    `;

    container.appendChild(dayBox);
  }
};

window.generateClasses = function (input, dayIndex) {
  const numClasses = parseInt(input.value);
  const classContainer = input.nextElementSibling;
  classContainer.innerHTML = "";

  for (let c = 0; c < numClasses; c++) {
    const classBox = document.createElement("div");
    classBox.classList.add("class-box");

    const classOptions = data.classes.map(cls => `<option value="${cls}">${cls}</option>`).join("");

    classBox.innerHTML = `
      <h4>Class ${c + 1}</h4>
      <label>Select Class:</label>
      <input list="classList${dayIndex}_${c}" placeholder="Select a Class">
      <datalist id="classList${dayIndex}_${c}">
        ${classOptions}
      </datalist>

      <label>How many rounds?</label>
      <select onchange="generateRounds(this, '${dayIndex}_${c}')">
        ${[...Array(10).keys()].map(n => `<option value="${n + 1}">${n + 1}</option>`).join("")}
      </select>

      <div class="rounds-container"></div>
    `;

    classContainer.appendChild(classBox);
  }
};

window.generateRounds = function (select, id) {
  const numRounds = parseInt(select.value);
  const container = select.nextElementSibling;
  container.innerHTML = "";

  for (let r = 0; r < numRounds; r++) {
    const judgeOptions = data.judges.map(j => `<option value="${j}">${j}</option>`).join("");

    const roundBox = document.createElement("div");
    roundBox.classList.add("round-box");

    roundBox.innerHTML = `
      <label>Round ${r + 1} Judge:</label>
      <input list="judgeList${id}_${r}" placeholder="Enter your Judge">
      <datalist id="judgeList${id}_${r}">
        ${judgeOptions}
      </datalist>

      <label>FEO Offered?</label>
      <input type="checkbox" name="feo${id}_${r}">
    `;

    container.appendChild(roundBox);
  }
};
