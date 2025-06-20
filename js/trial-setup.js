// trial-setup.js
fetch('js/data.json')
  .then(res => res.json())
  .then(data => {
    // Populate classes dropdown
    const classSelect = document.getElementById('classSelect');
    data.classes.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });

    // Populate judges dropdown
    const judgeSelect = document.getElementById('judgeSelect');
    data.judges.forEach(judge => {
      const option = document.createElement('option');
      option.value = judge;
      option.textContent = judge;
      judgeSelect.appendChild(option);
    });

    // Autocomplete for registration # in entry form
    const regInput = document.getElementById('regInput');
    regInput.addEventListener('input', () => {
      const dog = data.dogs.find(d => d.reg === regInput.value);
      if (dog) {
        document.getElementById('callName').value = dog.callName;
        document.getElementById('handlerName').value = dog.handler;
      }
    });
  });
