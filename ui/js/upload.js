function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) {
    toast("Please select a file", "error");
    return;
  }
  upload(type, input.files[0]);
}

async function upload(type, file) {

  // 🚫 Block only if a job is ACTUALLY running
  if (JOB_ID && !window.JOB_COMPLETED) {
    toast("A job is already running", "info");
    return;
  }

  if (!file || file.size === 0) {
    toast("Please select a valid file", "error");
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

  // ===============================
  // RESET STATE FOR NEW JOB
  // ===============================
  window.JOB_COMPLETED = false;
  JOB_ID = null;
  LAST_UPLOADED_FILENAME = file.name;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);

  let res;
  try {
    res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ID_TOKEN },
      body: fd
    });
  } catch {
    toast("Network error during upload", "error");
    return;
  }

  if (res.status === 401) {
    logout();
    return;
  }

  if (res.status === 403) {
    showPending();
    toast("Your account is pending approval", "info");
    return;
  }

  const data = await res.json();
  JOB_ID = data.job_id;
  localStorage.setItem("active_job_id", JOB_ID);

  // ===============================
  // ✅ ENTER PROCESSING MODE (FORCED)
  // ===============================

  // Defensive: ensure no leftover thoughts
  if (typeof stopThoughts === "function") {
    stopThoughts();
  }

  setUIBusy(true);


  const statusBox = document.getElementById("statusBox");
  const anchor = document.getElementById("processingAnchor");
  const downloadBox = document.getElementById("downloadBox");

  if (statusBox) {
    if (anchor) anchor.appendChild(statusBox);
    statusBox.style.display = "block";
    statusBox.classList.add("processing-focus");
  }

  if (downloadBox) {
    downloadBox.style.display = "none";
  }
  // Ensure file info is hidden at job start
  const fileInfo = document.getElementById("fileInfo");
  if (fileInfo) {
    fileInfo.style.display = "none";
  }

  document.body.classList.add("processing-active");
  const header = document.getElementById("processingHeader");
  if (header) {
    header.textContent = `PROCESSING ${LAST_UPLOADED_FILENAME}`;
  }

  const processingFilename = document.getElementById("processingFilename");
  if (processingFilename) {
    processingFilename.textContent = LAST_UPLOADED_FILENAME || "";
  }


  // Start thoughts slider
  if (typeof startThoughts === "function") {
    startThoughts();
  }


  // ===============================
  // START POLLING
  // ===============================
  pollStatus();
  startPolling();
}


function forceDownload(url, filename) {
  if (!filename) {
  throw new Error("forceDownload called without filename");
}

  try {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  } catch (e) {
    console.error("forceDownload failed", e);
  }
}


