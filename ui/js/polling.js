/* =========================================================
   POLLING — SINGLE SOURCE OF TRUTH
   ========================================================= */

let POLL_INTERVAL = null;

/**
 * Start polling job status
 */
function startPolling() {
  if (!JOB_ID) return;

  stopPolling();
  window.POLLING_ACTIVE = true;

  // ✅ FORCE SHOW processing section (THIS WAS MISSING)
  const processingSection =
    document.getElementById("processingSection") ||
    document.getElementById("processingContainer") ||
    document.getElementById("processingPanel");

  if (processingSection) {
    processingSection.style.display = "block";
  }

  // ✅ Enter processing mode
  document.body.classList.add("processing-active");

  // ✅ Reset progress deterministically
  const progressEl = document.getElementById("progress");
  if (progressEl) {
    progressEl.max = 100;
    progressEl.value = 0;
  }

  // Start polling
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
let lastProgress = 0;

function updateProcessingUI(data) {
  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");

  if (statusEl && data.stage) {
    statusEl.textContent = data.stage;
  }

  if (
  progressEl &&
  typeof data.progress === "number" &&
  !Number.isNaN(data.progress)
) {
  const target = Math.max(0, Math.min(100, data.progress));

  // 🔧 Smooth jump (visual only)
  const smoothValue = Math.max(lastProgress, target);
  lastProgress = smoothValue;

  // ✅ REQUIRED for determinate progress bar
  progressEl.max = 100;
  progressEl.value = smoothValue;

  // ✅ ENSURE progress bar is visible while running
  if (smoothValue < 100) {
    document.body.classList.add("processing-active");
  }

  // Optional: data attribute for debugging / CSS hooks
  progressEl.setAttribute("data-progress", smoothValue);
}

}




/* =========================================================
   COMPLETION / FAILURE HANDLERS
   ========================================================= */

/**
 * Job completed successfully
 */
function handleJobCompleted(data) {
  // --------------------------------
  // STOP PROCESSING UI IMMEDIATELY
  // --------------------------------
  if (typeof stopThoughts === "function") {
    stopThoughts();
  }

  const completionStatus = document.getElementById("completionStatus");
  if (completionStatus) {
    completionStatus.style.display = "block";
  }

  const downloadBox = document.getElementById("downloadBox");
  if (downloadBox) {
    downloadBox.style.display = "block";
  }

  stopPolling();

  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  // Exit processing mode FIRST (hides progress bar)
  document.body.classList.remove("processing-active");

  // --------------------------------
  // CLEAR PROCESSING HEADER
  // --------------------------------
  const header = document.getElementById("processingHeader");
  if (header) {
    header.textContent = "";
  }

  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = "";
  }

  // --------------------------------
  // SHOW FILE INFO (POST-COMPLETION ONLY)
  // --------------------------------
  const fileInfo = document.getElementById("fileInfo");
  const uploadedFile = document.getElementById("uploadedFile");
  const generatedFile = document.getElementById("generatedFile");

  if (uploadedFile) {
    uploadedFile.textContent = LAST_UPLOADED_FILENAME || "";
  }

  if (generatedFile) {
    generatedFile.textContent = "transcript.txt";
  }

  if (fileInfo) {
    fileInfo.style.display = "block";
  }

  // --------------------------------
  // ENABLE DOWNLOAD
  // --------------------------------
  if (data.download_url) {
    setupDownload(data.download_url, "transcript.txt");

    const downloadBox = document.getElementById("downloadBox");
    if (downloadBox) {
      downloadBox.style.display = "block";
    }
  }

  // --------------------------------
  // CLEANUP JOB STATE
  // --------------------------------
  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  // --------------------------------
  // USER FEEDBACK
  // --------------------------------
  toast("Processing completed", "success");

  // Refresh history safely
  if (typeof loadJobs === "function") {
    loadJobs();
  }
}





/**
 * Job failed
 */
function handleJobFailed(data) {
  // --------------------------------
  // STOP PROCESSING UI IMMEDIATELY
  // --------------------------------
  if (typeof stopThoughts === "function") {
    stopThoughts();
  }

  stopPolling();

  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  // Exit processing mode
  document.body.classList.remove("processing-active");

  // --------------------------------
  // CLEAR PROCESSING HEADER
  // --------------------------------
  const header = document.getElementById("processingHeader");
  if (header) {
    header.textContent = "";
  }

  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = "";
  }

  // --------------------------------
  // CLEANUP JOB STATE
  // --------------------------------
  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  // --------------------------------
  // USER FEEDBACK
  // --------------------------------
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
