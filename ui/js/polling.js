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
  console.log("RAW progress value:", data.progress, "typeof:", typeof data.progress);

  const statusEl = document.getElementById("status");
  const progressEl = document.getElementById("progress");

  // 🔑 Normalize backend progress (may arrive as string)
  const rawProgress = Number(data.progress);

  if (progressEl && Number.isFinite(rawProgress)) {
    const target = Math.max(0, Math.min(100, rawProgress));

    // Smooth forward-only movement
    const smoothValue = Math.max(lastProgress, target);
    lastProgress = smoothValue;

    progressEl.max = 100;
    progressEl.value = smoothValue;

    // Keep processings
    document.body.classList.add("processing-active");

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
  console.log("DOWNLOAD URL =>", data.download_url);

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
  // ENABLE DOWNLOAD (FINAL, BROWSER-NATIVE)
  // --------------------------------
  // --------------------------------
  // ENABLE DOWNLOAD (FORCED LOCAL DOWNLOAD)
  // --------------------------------
  // --------------------------------
  // ENABLE DOWNLOAD (REUSE HISTORY LOGIC)
  // --------------------------------
  if (data.download_url) {
    const downloadBox = document.getElementById("downloadBox");
    const link = document.getElementById("downloadLink");

    if (downloadBox) {
      downloadBox.style.display = "block";
    }

    if (link) {
      // Match history downloads exactly
      link.href = "#";
      link.classList.add("history-download");

      // ✅ URL for forceDownload
      link.dataset.url = data.download_url;

      // ✅ Explicit filename (fixes undefined.txt)
      link.dataset.filename = "transcript.txt";

      link.style.pointerEvents = "auto";
      link.style.opacity = "1";

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

