function startPolling() {
  if (POLLER) clearInterval(POLLER);
  if (!JOB_ID || typeof JOB_ID !== "string") return;

  if (!UNLOAD_BOUND) {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    UNLOAD_BOUND = true;
  }

  POLLER = setInterval(() => {
    if (JOB_ID) pollStatus();
  }, 4000);
}

function stopPolling() {
  if (POLLER) clearInterval(POLLER);
  POLLER = null;

  window.removeEventListener("beforeunload", beforeUnloadHandler);
  UNLOAD_BOUND = false;

  setUIBusy(false);
  document.body.classList.remove("processing-active");

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.classList.remove("processing-focus");
}

/* ===============================
   JOB STATUS POLLER (MOVED HERE)
   =============================== */
async function pollStatus() {
  // ⛔ hard stop
  if (window.JOB_COMPLETED) return;
  if (!JOB_ID || !ID_TOKEN) return;

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

  const statusEl = document.getElementById("status");
  const stageEl = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const downloadBox = document.getElementById("downloadBox");
  const downloadLink = document.getElementById("downloadLink");

  const pct = Number(s.progress) || 0;

  const isCompleted =
    s.status?.toUpperCase() === "COMPLETED" ||
    s.stage === "Completed" ||
    Boolean(s.output_path) ||
    pct >= 100;

  /* ===============================
     ✅ COMPLETED (TERMINAL STATE)
     =============================== */
  if (isCompleted) {
    window.JOB_COMPLETED = true;

    stopPolling();
    stopThoughtSlider();
    localStorage.removeItem("active_job_id");

    if (statusEl) {
      statusEl.textContent = "Ready";
      statusEl.className = "status-ready";
    }

    if (stageEl) stageEl.textContent = "Just now";

    if (progressEl) progressEl.style.display = "none";

    document.body.classList.add("processing-complete");

    // File info
    const fileInfo = document.getElementById("fileInfo");
    const uploadedEl = document.getElementById("uploadedFile");
    const generatedEl = document.getElementById("generatedFile");

    if (fileInfo && uploadedEl && generatedEl && s.output_path) {
      uploadedEl.textContent = LAST_UPLOADED_FILENAME || "Uploaded file";

      let name = "transcript.txt";
      try {
        name = new URL(s.output_path).pathname.split("/").pop() || name;
      } catch {}

      generatedEl.textContent = name;
      generatedEl.dataset.url = s.output_path;
      fileInfo.style.display = "block";
    }

    if (downloadBox && downloadLink && s.output_path) {
      downloadLink.dataset.url = s.output_path;
      downloadBox.style.display = "block";
    }

    toast("Ready ✨", "success");
    loadJobs();
    return;
  }

  /* ===============================
     ⏳ STILL PROCESSING
     =============================== */
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

function beforeUnloadHandler(e) {
  if (JOB_ID && POLLER) {
    e.preventDefault();
    e.returnValue = "";
  }
}
