/* =========================================================
   POLLING — SINGLE SOURCE OF TRUTH
   ========================================================= */

let POLL_INTERVAL = null;

/**
 * Start polling job status
 */
function startPolling() {
  if (!JOB_ID) return;

  // Prevent duplicate intervals
  stopPolling();

  window.POLLING_ACTIVE = true;

  // Poll immediately, then on interval
  pollStatus();
  POLL_INTERVAL = setInterval(pollStatus, 3000);
}

/**
 * Stop polling safely
 */
function stopPolling() {
  if (POLL_INTERVAL) {
    clearInterval(POLL_INTERVAL);
    POLL_INTERVAL = null;
  }
}

/**
 * Poll backend for job status
 */
async function pollStatus() {
  if (!JOB_ID || !ID_TOKEN) return;

  let res;
  try {
    res = await fetch(`${API}/status/${JOB_ID}`, {
      headers: {
        Authorization: "Bearer " + ID_TOKEN
      }
    });
  } catch (err) {
    console.error("Polling network error", err);
    return;
  }

  if (res.status === 401) {
    logout();
    return;
  }

  if (!res.ok) {
    console.error("Polling failed", res.status);
    return;
  }

  const data = await res.json();

  /*
    Expected backend payload (example):
    {
      status: "RUNNING" | "COMPLETED" | "FAILED",
      stage: "Transcribing audio",
      progress: 42,
      download_url: "https://..."
    }
  */

  updateProcessingUI(data);

  if (data.status === "COMPLETED") {
    handleJobCompleted(data);
  }

  if (data.status === "FAILED") {
    handleJobFailed(data);
  }
}

/* =========================================================
   UI UPDATE HELPERS
   ========================================================= */

/**
 * Update status text, stage, progress bar
 */
function updateProcessingUI(data) {
  const statusEl = document.getElementById("status");
  const stageEl = document.getElementById("stage");
  const progressEl = document.getElementById("progress");

  if (statusEl && data.status) {
    // Show meaningful status only
    statusEl.textContent =
      data.status === "RUNNING" ? "" : data.status;
  }

  if (stageEl && data.stage) {
    stageEl.textContent = data.stage;
  }

  if (progressEl && typeof data.progress === "number") {
    progressEl.value = Math.max(0, Math.min(100, data.progress));
  }
}

/* =========================================================
   COMPLETION / FAILURE HANDLERS
   ========================================================= */

/**
 * Job completed successfully
 */
function handleJobCompleted(data) {
  if (typeof stopThoughts === "function") {
  stopThoughts();
}
  stopPolling();

  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  document.body.classList.remove("processing-active");

  // -------------------------------
  // SHOW FILE INFO
  // -------------------------------
  const fileInfo = document.getElementById("fileInfo");
  const uploadedFile = document.getElementById("uploadedFile");
  const generatedFile = document.getElementById("generatedFile");

  if (uploadedFile && LAST_UPLOADED_FILENAME) {
    uploadedFile.textContent = LAST_UPLOADED_FILENAME;
  }

  if (generatedFile) {
    generatedFile.textContent = "transcript.txt";
  }

  if (fileInfo) {
    fileInfo.style.display = "block";
  }

  // -------------------------------
  // ENABLE DOWNLOAD
  // -------------------------------
  if (data.download_url) {
    setupDownload(data.download_url, "transcript.txt");

    const downloadBox = document.getElementById("downloadBox");
    if (downloadBox) {
      downloadBox.style.display = "block";
    }
  }

  // -------------------------------
  // CLEANUP
  // -------------------------------
  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  toast("Processing completed", "success");

  if (typeof loadJobs === "function") {
    loadJobs();
  }
}


/**
 * Job failed
 */
function handleJobFailed(data) {
  if (typeof stopThoughts === "function") {
  stopThoughts();
}
  stopPolling();

  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  document.body.classList.remove("processing-active");

  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = "Failed";
  }

  toast("Processing failed. Please try again.", "error");
}

/* =========================================================
   RESUME AFTER REFRESH (OPTIONAL BUT SAFE)
   ========================================================= */

(function resumePollingIfNeeded() {
  const savedJobId = localStorage.getItem("active_job_id");
  if (savedJobId && ID_TOKEN) {
    JOB_ID = savedJobId;
    window.POLLING_ACTIVE = true;
    document.body.classList.add("processing-active");
    startPolling();
  }
})();
