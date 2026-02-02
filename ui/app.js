const API = "https://doc-transcribe-api.onrender.com";

let ID_TOKEN = null;
let JOB_ID = null;
let POLLER = null;
let IS_PROCESSING = false;

/* =======================
   TOASTS
======================= */
function toast(msg, type="info") {
  const box = document.getElementById("toasts");
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = msg;
  box.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

/* =======================
   PROCESSING MODE
======================= */
function setProcessing(on) {
  IS_PROCESSING = on;
  document.body.classList.toggle("processing-active", on);

  if (on) {
    window.onbeforeunload = () =>
      "Processing is in progress. Are you sure you want to leave?";
  } else {
    window.onbeforeunload = null;
  }
}

/* =======================
   AUTH
======================= */
function renderGoogleButton() {
  google.accounts.id.initialize({
    client_id: "320763587900-18ptqosdb8b5esc8845oc82ul4qf8m9k.apps.googleusercontent.com",
    callback: onGoogleSignIn
  });

  google.accounts.id.renderButton(
    document.getElementById("google-signin-btn"),
    { theme: "outline", size: "large" }
  );
}

function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;
  document.getElementById("welcomeBanner").innerText = "Welcome";
  document.getElementById("welcomeBanner").style.display = "block";
}

/* =======================
   UPLOAD
======================= */
function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input.files.length) return toast("Select a file", "error");
  upload(type, input.files[0]);
}

async function upload(type, file) {
  setProcessing(true);

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: "Bearer " + ID_TOKEN },
    body: fd
  });

  const data = await res.json();
  JOB_ID = data.job_id;

  document.getElementById("statusBox").style.display = "block";
  pollStatus();
  POLLER = setInterval(pollStatus, 4000);
}

/* =======================
   STATUS
======================= */
async function pollStatus() {
  const res = await fetch(`${API}/status/${JOB_ID}`, {
    headers: { Authorization: "Bearer " + ID_TOKEN }
  });
  const s = await res.json();

  status.innerText = s.status || "";
  stage.innerText = s.stage || "";
  progress.value = s.progress || 0;

  if (s.output_path) {
    downloadLink.href = s.output_path;
    downloadBox.style.display = "block";
    clearInterval(POLLER);
    setProcessing(false);
  }
}

/* =======================
   DRAG & DROP
======================= */
function attach(zoneId, inputId, nameId) {
  const z = document.getElementById(zoneId);
  const i = document.getElementById(inputId);
  const n = document.getElementById(nameId);

  z.onclick = () => i.click();
  i.onchange = () => n.textContent = i.files[0]?.name || "";
}

document.addEventListener("DOMContentLoaded", () => {
  renderGoogleButton();
  attach("ocrDrop","ocrFile","ocrFilename");
  attach("transcribeDrop","transcribeFile","transcribeFilename");
});
