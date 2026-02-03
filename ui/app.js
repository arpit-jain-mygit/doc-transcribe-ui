const API = "https://doc-transcribe-api.onrender.com";
let ID_TOKEN = null;
let JOB_ID = null;
let POLLER = null;
let USER_EMAIL = null;
let IS_PENDING = false;
let SESSION_RESTORED = false;

let UI_BUSY = false;
let UNLOAD_BOUND = false;

let LAST_PROGRESS = null;
let LAST_STATUS = null;
let LAST_STAGE = null;

window.JOB_COMPLETED = false;

let LAST_UPLOADED_FILENAME = null;


function setUIBusy(isBusy) {
  UI_BUSY = isBusy;

  document
    .querySelectorAll(
      "button, input[type='file'], a.history-download"
    )
    .forEach(el => {
      el.disabled = isBusy;
      el.style.pointerEvents = isBusy ? "none" : "auto";
      el.style.opacity = isBusy ? "0.6" : "1";
    });

  document
    .querySelectorAll(".drop-zone")
    .forEach(z => {
      z.classList.toggle("disabled", isBusy);
    });
}


function stopPolling() {
  if (POLLER) {
    clearInterval(POLLER);
    POLLER = null;
  }

  // Remove refresh warning
  window.removeEventListener("beforeunload", beforeUnloadHandler);
  UNLOAD_BOUND = false;

  // Unlock UI
  setUIBusy(false);

  // Exit processing focus mode (UX cleanup)
  document.body.classList.remove("processing-active");
  const statusBox = document.getElementById("statusBox");
  if (statusBox) {
    statusBox.classList.remove("processing-focus");
  }
}

function hideProcessing() {
  const statusBox = document.getElementById("statusBox");
  if (!statusBox) return;

  // Just hide UI — DO NOT stop polling
  statusBox.style.display = "none";
  statusBox.classList.remove("processing-focus");

  // Re-enable rest of UI visuals (but keep job running)
  document.body.classList.remove("processing-active");

  toast("Processing is running in background", "info");
}


function startPolling() {
  if (POLLER) {
    clearInterval(POLLER);
    POLLER = null;
  }

  if (!JOB_ID || typeof JOB_ID !== "string") return;

  if (!UNLOAD_BOUND) {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    UNLOAD_BOUND = true;
  }

  POLLER = setInterval(() => {
    if (JOB_ID && typeof JOB_ID === "string") {
      pollStatus();
    }
  }, 4000);
}



/* ===============================
   AUTH PERSISTENCE (ADD)
   =============================== */
const AUTH_STORAGE_KEY = "doc_app_auth";

/* 🔐 UI STATE HELPERS */
function formatDate(value) {
  const d = parseBackendTime(value);
  if (!d) return "";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }) + " IST";
}



function parseBackendTime(value) {
  if (!value || typeof value !== "string") return null;

  // If backend forgot timezone, FORCE UTC
  if (!value.endsWith("Z") && !value.includes("+")) {
    value = value + "Z";
  }

  const d = new Date(value);
  return isNaN(d) ? null : d;
}

function formatRelativeTime(value) {
  const past = parseBackendTime(value);
  if (!past) return "";

  const now = new Date();
  let diffMs = now - past;

  if (diffMs < 0) diffMs = 0;

  const sec = Math.floor(diffMs / 1000);
  if (sec < 30) return "Just now";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;

  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
}




function formatStatus(status) {
  if (!status) return "";
  return status
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(" — ", " ");
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
    {
      theme: "outline",
      size: "medium",
      text: "signin_with",
      shape: "pill"
    }
  );
}

function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;

  let payload = {};
  try {
    payload = JSON.parse(atob(resp.credential.split(".")[1]));
    USER_EMAIL = payload.email || "";
  } catch { }

  /* ===============================
     AUTH PERSIST (ADD)
     =============================== */
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: ID_TOKEN,
      email: USER_EMAIL,
      picture: payload.picture || null, // ✅ ADD
    })
  );

  userEmail.innerText = USER_EMAIL;
  userAvatar.src = payload.picture || "https://www.gravatar.com/avatar?d=mp";

  showLoggedInUI();
  hidePending();
  toast("Signed in successfully", "success");
  loadJobs();
}

function logout() {
  localStorage.removeItem("active_job_id");

  // STOP polling exactly once
  stopPolling();

  // CLEAR AUTH / JOB STATE
  ID_TOKEN = null;
  USER_EMAIL = null;
  JOB_ID = null;

  // CLEAR PERSISTED AUTH
  localStorage.removeItem(AUTH_STORAGE_KEY);

  // RESET UI
  hidePending();
  showLoggedOutUI();

  toast("Logged out", "info");
  SESSION_RESTORED = false;

  // RE-RENDER SIGN-IN
  renderGoogleButton();
}



/* ===============================
   AUTH RESTORE (ADD)
   =============================== */
function restoreSession() {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!saved) return false;

  try {
    const { token, email, picture } = JSON.parse(saved);
    if (!token || !email) return false;

    ID_TOKEN = token;
    USER_EMAIL = email;

    userEmail.innerText = USER_EMAIL;
    userAvatar.src = picture || "https://www.gravatar.com/avatar?d=mp";

    SESSION_RESTORED = true;

    showLoggedInUI();
    loadJobs();

    const savedJob = localStorage.getItem("active_job_id");
    if (savedJob) {
      JOB_ID = savedJob;

      document.body.classList.add("processing-active");
      const statusBox = document.getElementById("statusBox");
      if (statusBox) {
        statusBox.style.display = "block";
        statusBox.classList.add("processing-focus");
      }

      startPolling();
    }

    return true;
  } catch {
    return false;
  }
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
  if (UI_BUSY) return;

  if (!file || file.size === 0) {
    toast("Please reselect the file and try again", "error");
    return;
  }

  if (!ID_TOKEN) {
    toast("Please sign in first", "error");
    return;
  }

  if (IS_PENDING) {
    toast("Account pending approval", "info");
    return;
  }

  const statusBox = getStatusBox();
  const downloadBox = getDownloadBox();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);

  LAST_UPLOADED_FILENAME = file.name;


  setUIBusy(true);
  document.body.classList.remove("processing-complete");

  let res;
  try {
    res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ID_TOKEN },
      body: fd
    });
  } catch {
    setUIBusy(false);
    toast("Network error during upload", "error");
    return;
  }

  // 🔐 AUTH / PERMISSION HANDLING
  if (res.status === 401) {
    setUIBusy(false);
    logout();
    return;
  }

  if (res.status === 403) {
    setUIBusy(false);
    showPending();
    toast("Your account is pending approval", "info");
    return;
  }

  hidePending();

  const data = await res.json();
  JOB_ID = data.job_id;

  /* 🔒 RESET TERMINAL STATE FOR NEW JOB */
  window.JOB_COMPLETED = false;

  // ⏳ One-time processing hint (Hindi)
  toast(
    "⏳ 20 मिनट के ऑडियो के लिए लगभग 2–3 मिनट लग सकते हैं। कृपया प्रतीक्षा करें।",
    "info"
  );

  // 🔐 persist active job for refresh recovery
  localStorage.setItem("active_job_id", JOB_ID);

  /* ===============================
     ✅ SAFE UI MUTATIONS (NO CRASH)
     =============================== */

  if (statusBox) {
const anchor = document.getElementById("processingAnchor");
if (anchor && statusBox) {
  anchor.appendChild(statusBox);   // ✅ hard anchor
}
statusBox.style.display = "block";

statusBox.classList.add("processing-focus");
  }

  document.body.classList.add("processing-active");
  document.body.classList.add("processing-enter");

  requestAnimationFrame(() => {
    document.body.classList.remove("processing-enter");
  });

  if (downloadBox) {
    downloadBox.style.display = "none";
  }

  // Kick polling
  pollStatus();
  startPolling();
}



async function pollStatus() {
  // ⛔ HARD STOP — once completed, nothing ever runs again
  if (window.JOB_COMPLETED) return;

  if (!JOB_ID || typeof JOB_ID !== "string") return;

  let res;
  try {
    res = await fetch(`${API}/status/${JOB_ID}`, {
      headers: { Authorization: "Bearer " + ID_TOKEN }
    });
  } catch {
    stopPolling();
    toast("Network issue while checking status", "error");
    return;
  }

  if (res.status === 401) {
    stopPolling();
    logout();
    return;
  }

  if (!res.ok) {
    stopPolling();
    toast("Failed to fetch job status", "error");
    return;
  }

  const s = await res.json();
  console.log("POLL STATUS", s);

  const statusEl = document.getElementById("status");
  const stageEl = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const downloadBoxEl = document.getElementById("downloadBox");
  const downloadLinkEl = document.getElementById("downloadLink");

  const pct = Number(s.progress) || 0;

  const isCompleted =
    s.status?.toUpperCase() === "COMPLETED" ||
    s.stage === "Completed" ||
    Boolean(s.output_path) ||
    pct >= 100;

  /* =================================================
     ✅ COMPLETED — ONE-WAY TERMINAL STATE
     ================================================= */
  if (isCompleted) {
    window.JOB_COMPLETED = true; // 🔒 HARD LOCK

    stopPolling();
    stopThoughtSlider();
    localStorage.removeItem("active_job_id");

    // Status
    if (statusEl) {
      statusEl.textContent = "Ready";

      // ===============================
      // 📁 FILE INFO — SHOW NOW ONLY
      // ===============================
      const fileInfo = document.getElementById("fileInfo");
      const uploadedEl = document.getElementById("uploadedFile");
      const generatedEl = document.getElementById("generatedFile");

      if (fileInfo && uploadedEl && generatedEl && s.output_path) {
        // Uploaded filename
        uploadedEl.textContent =
          LAST_UPLOADED_FILENAME || "Uploaded file";

        // Extract filename from signed URL
        let generatedName = "transcript.txt";
        try {
          const url = new URL(s.output_path);
          generatedName = url.pathname.split("/").pop() || generatedName;
        } catch { }

        generatedEl.textContent = generatedName;
        generatedEl.dataset.url = s.output_path;

        fileInfo.style.display = "block";
      }


      statusEl.className = "status-ready";
    }

    // Time — static, never updates again
    if (stageEl) {
      stageEl.textContent = "Just now";
    }

    // Progress — permanently gone
    if (progressEl) {
      progressEl.value = 100;
      progressEl.style.display = "none";
    }

    document.body.classList.remove("progress-near", "progress-final");
    document.body.classList.add("processing-complete");

    // File names — ONLY after completion
    const uploadedEl = document.getElementById("uploadedFile");
    const generatedEl = document.getElementById("generatedFile");

    if (uploadedEl) uploadedEl.textContent = "Uploaded file";
    if (generatedEl) generatedEl.textContent = "transcript.txt";

    // Download
    if (s.output_path && downloadLinkEl && downloadBoxEl) {
      downloadLinkEl.dataset.url = s.output_path;
      downloadBoxEl.style.display = "block";
    }

    toast("Ready ✨", "success");
    loadJobs();

    return; // ⛔ ABSOLUTE STOP
  }

  /* =================================================
     ⏳ STILL PROCESSING
     ================================================= */
  if (statusEl) {
    statusEl.textContent = formatStatus(s.status);
    statusEl.className = "";
  }

  if (stageEl && s.updated_at) {
    stageEl.textContent = `(${formatRelativeTime(s.updated_at)})`;
  }

  if (progressEl) {
    progressEl.style.display = "block";
    progressEl.value = pct;
  }

  document.body.classList.remove("progress-near", "progress-final");
  if (pct >= 95) document.body.classList.add("progress-final");
  else if (pct >= 80) document.body.classList.add("progress-near");
}







async function forceDownload(url) {
  const res = await fetch(url);

  let filename = "transcript.txt";
  const cd = res.headers.get("Content-Disposition");

  if (cd) {
    const match = cd.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  } else {
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

  if (res.status === 401) return logout();

  const jobs = await res.json();
  const box = document.getElementById("jobs");
  box.innerHTML = "";

  jobs.forEach(j => {
    const div = document.createElement("div");
    div.className = "job";

    div.innerHTML = `
      <div class="job-title">${j.job_type} — ${formatStatus(j.status)}</div>
      <div class="job-meta">${formatRelativeTime(j.updated_at) || ""}</div>
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
  if (SESSION_RESTORED) return; // 🔧 ADD
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

function beforeUnloadHandler(e) {
  // Only warn if a job is actively processing
  if (JOB_ID && POLLER) {
    e.preventDefault();
    e.returnValue = ""; // Required for Chrome / Safari
    return "";
  }
}

function getStatusBox() {
  return document.getElementById("statusBox");
}
function getDownloadBox() {
  return document.getElementById("downloadBox");
}

document.addEventListener("DOMContentLoaded", () => {
  stopPolling();

  /* ===============================
     AUTH RESTORE FIRST (ADD)
     =============================== */
  const restored = restoreSession();
  if (restored && window.google?.accounts?.id) {
    google.accounts.id.cancel();
  }



  const downloadLink = document.getElementById("downloadLink");
  if (downloadLink) {
    downloadLink.addEventListener("click", (e) => {
      e.preventDefault();
      const url = downloadLink.dataset.url;
      if (!url) return;
      forceDownload(url);
    });
  }

  attachDragDrop("ocrDrop", "ocrFile", "ocrFilename");
  attachDragDrop("transcribeDrop", "transcribeFile", "transcribeFilename");



  const observer = new MutationObserver(() => {
    const statusBox = getStatusBox();
    const downloadBox = getDownloadBox();

    if (statusBox && statusBox.style.display !== "none") {
      startThoughtSlider();
    }

    if (downloadBox && downloadBox.style.display !== "none") {
      stopThoughtSlider();
    }
  });

  const statusBox = getStatusBox();
  const downloadBox = getDownloadBox();

  if (statusBox) {
    observer.observe(statusBox, {
      attributes: true,
      attributeFilter: ["style"]
    });
  }

  if (downloadBox) {
    observer.observe(downloadBox, {
      attributes: true,
      attributeFilter: ["style"]
    });
  }


  if (statusBox) observer.observe(statusBox, { attributes: true, attributeFilter: ["style"] });
  if (downloadBox) observer.observe(downloadBox, { attributes: true, attributeFilter: ["style"] });
});

document.addEventListener("click", function (e) {
  if (UI_BUSY) return;

  const link = e.target.closest(".history-download");
  if (!link) return;

  e.preventDefault();
  const url = link.dataset.url;
  if (!url) {
    console.warn("History download clicked but no data-url found");
    return;
  }

  forceDownload(url);
});

// Ensure Google Sign-In renders even on slow mobile loads
waitForGoogleAndRender();

