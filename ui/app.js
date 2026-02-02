const API = "https://doc-transcribe-api.onrender.com";
let ID_TOKEN = null;
let JOB_ID = null;
let POLLER = null;
let USER_EMAIL = null;
let IS_PENDING = false;

/* 🔐 UI STATE HELPERS */
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function formatStatus(status) {
  if (!status) return "";
  return status.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).replace(" — ", " ");
}

function showLoggedInUI() {
  userProfile.style.display = "flex";
  authBox.style.display = "none";
}

function showLoggedOutUI() {
  userProfile.style.display = "none";
  authBox.style.display = "flex";
}

/* helpers */
function toast(message, type = "info") {
  const box = document.getElementById("toasts");
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = message;
  box.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function showPending() {
  IS_PENDING = true;
  approvalBanner.style.display = "block";
  document.querySelectorAll(".drop-zone")
    .forEach(z => z.classList.add("disabled"));
}

function hidePending() {
  IS_PENDING = false;
  approvalBanner.style.display = "none";
  document.querySelectorAll(".drop-zone")
    .forEach(z => z.classList.remove("disabled"));
}

/* auth */
function renderGoogleButton() {
  showLoggedOutUI();

  google.accounts.id.initialize({
    client_id: "320763587900-18ptqosdb8b5esc8845oc82ul4qf8m9k.apps.googleusercontent.com",
    callback: onGoogleSignIn,
    auto_select: false
  });

  google.accounts.id.renderButton(
    document.getElementById("google-signin-btn"),
    { theme: "outline", size: "large" }
  );
}

function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;

  let payload = {};
  try {
    payload = JSON.parse(atob(resp.credential.split(".")[1]));
    USER_EMAIL = payload.email || "";
  } catch {}

  userEmail.innerText = USER_EMAIL;
  userAvatar.src = payload.picture || "https://www.gravatar.com/avatar?d=mp";

  showLoggedInUI();
  hidePending();
  toast("Signed in successfully", "success");
  loadJobs();
}


function logout() {
  ID_TOKEN = null;
  USER_EMAIL = null;
  JOB_ID = null;

  hidePending();
  showLoggedOutUI();

  toast("Logged out", "info");
  renderGoogleButton();
}


/* upload */
function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input.files.length) {
    toast("Please select a file", "error");
    return;
  }
  upload(type, input.files[0]);
}

async function upload(type, file) {
  if (!ID_TOKEN) return toast("Please sign in first", "error");
  if (IS_PENDING) return toast("Account pending approval", "info");

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: "Bearer " + ID_TOKEN },
    body: fd
  });

  if (res.status === 401) return logout();
  if (res.status === 403) {
    showPending();
    return toast("Your account is pending approval", "info");
  }

  hidePending();
  const data = await res.json();
  JOB_ID = data.job_id;

  statusBox.style.display = "block";
  downloadBox.style.display = "none";

  pollStatus();
  POLLER = setInterval(pollStatus, 4000);
}

/* status */
async function pollStatus() {
  if (!JOB_ID) return;

  const res = await fetch(`${API}/status/${JOB_ID}`, {
    headers: { Authorization: "Bearer " + ID_TOKEN }
  });

  const s = await res.json();

  status.innerText = formatStatus(s.status) || "";
  stage.innerText = formatDate(s.stage) || "";
  progress.value = s.progress || 0;

  if (s.output_path) {
    clearInterval(POLLER);

    // ✅ Store URL for manual download
    downloadLink.dataset.url = s.output_path;

    downloadBox.style.display = "block";
    toast("Completed 🎉", "success");
    loadJobs();
  }
}


async function forceDownload(url) {
  const res = await fetch(url);

  // 1️⃣ Try Content-Disposition (if present)
  let filename = "transcript.txt";
  const cd = res.headers.get("Content-Disposition");

  if (cd) {
    const match = cd.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  } else {
    // 2️⃣ Fallback: extract from GCS URL path
    try {
      const pathname = new URL(url).pathname;
      filename = pathname.split("/").pop() || filename;
    } catch { }
  }

  const blob = await res.blob();

  const a = document.createElement("a");
  const objectUrl = URL.createObjectURL(blob);

  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(objectUrl);
  a.remove();
}


/* jobs */
async function loadJobs() {
  if (!ID_TOKEN) return;

  const res = await fetch(`${API}/jobs`, {
    headers: { Authorization: "Bearer " + ID_TOKEN }
  });

  const jobs = await res.json();
  const box = document.getElementById("jobs");
  box.innerHTML = "";

  jobs.forEach(j => {
    const div = document.createElement("div");
    div.className = "job";

    div.innerHTML = `
  <div class="job-title">${j.job_type} — ${formatStatus(j.status)}</div>
  <div class="job-meta">${formatDate(j.updated_at) || ""}</div>
  ${j.output_path
        ? `<a href="#" class="history-download" data-url="${j.output_path}">
           ⬇ Download
         </a>`
        : ""
      }
`;

    box.appendChild(div);
  });
}


/* ✅ SAFE INITIAL RENDER — ADDED (NO CUTS) */
function waitForGoogleAndRender() {
  if (window.google && google.accounts && google.accounts.id) {
    renderGoogleButton();
  } else {
    setTimeout(waitForGoogleAndRender, 50);
  }
}

function attachDragDrop(zoneId, inputId, nameId) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);
  const name = document.getElementById(nameId);
  if (!zone || !input) return;

  zone.addEventListener("click", () => {
    if (!zone.classList.contains("disabled")) input.click();
  });

  input.addEventListener("change", () => {
    if (input.files.length) {
      name.textContent = input.files[0].name;
    }
  });

  zone.addEventListener("dragover", e => {
    if (zone.classList.contains("disabled")) return;
    e.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("dragover");
  });

  zone.addEventListener("drop", e => {
    if (zone.classList.contains("disabled")) return;
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      input.dispatchEvent(new Event("change"));
    }
  });
}

const THOUGHTS = [
  "🪔 शब्दों की शुद्धता ही ज्ञान की रक्षा है।",
  "📜 हर अक्षर श्रद्धा से संजोया जा रहा है।",
  "🧘‍♂️ यह प्रक्रिया साधना के समान है।",
  "🔍 मूल भाव बदले बिना लिप्यंतरण किया जा रहा है।",
  "⏳ महान ग्रंथ समय लेकर ही प्रकट होते हैं।",
  "🌸 आपका कार्य सुरक्षित रूप से संसाधित हो रहा है।"
];

let THOUGHT_TIMER = null;
let THOUGHT_INDEX = 0;

function startThoughtSlider() {
  const box = document.getElementById("thoughtBox");
  const text = document.getElementById("thoughtText");
  if (!box || THOUGHT_TIMER) return;

  box.style.display = "block";
  text.textContent = THOUGHTS[0];
  THOUGHT_INDEX = 1;

  THOUGHT_TIMER = setInterval(() => {
    text.textContent = THOUGHTS[THOUGHT_INDEX % THOUGHTS.length];
    text.classList.remove("thought-text");
    void text.offsetWidth;
    text.classList.add("thought-text");
    THOUGHT_INDEX++;
  }, 4500);
}

function stopThoughtSlider() {
  const box = document.getElementById("thoughtBox");
  if (box) box.style.display = "none";
  if (THOUGHT_TIMER) clearInterval(THOUGHT_TIMER);
  THOUGHT_TIMER = null;
}

document.addEventListener("DOMContentLoaded", () => {
  waitForGoogleAndRender();

  const downloadLink = document.getElementById("downloadLink");
  if (downloadLink) {
    downloadLink.addEventListener("click", (e) => {
      e.preventDefault(); // ⛔ stop anchor navigation

      const url = downloadLink.dataset.url;
      if (!url) return;
      forceDownload(url);
    });
  }

  attachDragDrop("ocrDrop", "ocrFile", "ocrFilename");
  attachDragDrop("transcribeDrop", "transcribeFile", "transcribeFilename");

  const statusBox = document.getElementById("statusBox");
  const downloadBox = document.getElementById("downloadBox");

  const observer = new MutationObserver(() => {
    if (statusBox && statusBox.style.display !== "none") {
      startThoughtSlider();
    }
    if (downloadBox && downloadBox.style.display !== "none") {
      stopThoughtSlider();
    }
  });

  if (statusBox) observer.observe(statusBox, { attributes: true, attributeFilter: ["style"] });
  if (downloadBox) observer.observe(downloadBox, { attributes: true, attributeFilter: ["style"] });
});


document.addEventListener("click", function (e) {
  const link = e.target.closest(".history-download");
  if (!link) return;

  e.preventDefault(); // stop new tab navigation

  const url = link.dataset.url;
  if (!url) {
    console.warn("History download clicked but no data-url found");
    return;
  }

  forceDownload(url);
});
