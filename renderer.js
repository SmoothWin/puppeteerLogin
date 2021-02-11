const ipc = require('electron').ipcRenderer;
const syncSubmit = document.getElementById("omnivox-form");

syncSubmit.addEventListener("submit", sendForm);

function sendForm(event){
    event.preventDefault();
    let studentID = document.getElementById("studentID").value;
    let studentPass = document.getElementById("studentPass").value;
    ipc.send('form-submission', studentId, studentPass);
}   