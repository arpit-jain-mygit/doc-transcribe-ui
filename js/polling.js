/* =========================================================
   POLLING — SINGLE SOURCE OF TRUTH (FINAL)
   ========================================================= */

let POLL_INTERVAL = null;
let lastProgress = 0;

/* ---------------------------------------------------------
   IMMEDIATE PROGRESS BOOTSTRAP (UI ONLY)
   --------------------------------------------------------- */
function bootstrapProgress(stageText = "Preparing…", value = 3) {
  const statusBox = document.getElementById("statusBox");
  const progressEl = document.getElementById("progress");
  const stageEl = document.getElementById("stage");

  if (statusBox) statusBox.style.display = "block";
  document.body.classList.add("processing-active");

  if (progressEl) {
    progressEl.max = 100;
    progressEl.value = value;
    lastProgress = value; // prevent backward jump
  }

  if (stageEl) {
    stageEl.textContent = stageText;
    stageEl.classList.remove("error");
  }
}

// expose for upload.js
window.bootstrapProgress = bootstrapProgress;

function startPolling() {
  if (!JOB_ID) return;

  stopPolling();
  window.POLLING_ACTIVE = true;

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.style.display = "block";

  document.body.classList.add("processing-active");

  const progressEl = document.getElementById("progress");
  if (progressEl) {
    progressEl.max = 100;
    // DO NOT reset progress — bootstrap already set it
    progressEl.value = Math.max(progressEl.value || 0, lastProgress);
  }

  pollStatus();
  POLL_INTERVAL = setInterval(pollStatus, 3000);
}

function stopPolling() {
  if (POLL_INTERVAL) {
    clearInterval(POLL_INTERVAL);
    POLL_INTERVAL = null;
  }
}

async function pollStatus() {
  if (!JOB_ID || !ID_TOKEN) return;

  let res;
  try {
    res = await fetch(`${API}/status/${JOB_ID}`, {
      headers: { Authorization: "Bearer " + ID_TOKEN }
    });
  } catch {
    return;
  }

  if (res.status === 401) {
    logout();
    return;
  }

  if (!res.ok) return;

  const data = await res.json();

  updateProcessingUI(data);

  if (data.status === "COMPLETED") {
    handleJobCompleted(data);
  } else if (data.status === "FAILED") {
    handleJobFailed(data);
  }
}

function updateProcessingUI(data) {
  const progressEl = document.getElementById("progress");
  const stageEl = document.getElementById("stage");

  if (typeof updateProcessingHeader === "function") {
    updateProcessingHeader(data);
  }

  const raw = Number(data.progress);
  if (progressEl && Number.isFinite(raw)) {
    const target = Math.max(0, Math.min(100, raw));
    lastProgress = Math.max(lastProgress, target);
    progressEl.value = lastProgress;
  }

  if (stageEl && data.stage) {
    stageEl.textContent = data.stage;
    stageEl.classList.remove("error");
  }
}

function handleJobCompleted(data) {
  if (typeof stopThoughts === "function") stopThoughts();

  stopPolling();
  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  document.body.classList.remove("processing-active");

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.style.display = "none";

  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  if (typeof setUIBusy === "function") setUIBusy(false);

  if (typeof showCompletion === "function") {
    showCompletion(data);
  }

  const link = document.getElementById("downloadLink");
  if (link && data.download_url) {
    link.href = "javascript:void(0)";
    link.style.pointerEvents = "auto";
    link.style.opacity = "1";

    link.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (typeof forceDownload !== "function") {
        console.error("forceDownload is not defined");
        return;
      }

      forceDownload(
        data.download_url,
        data.output_file || "transcript.txt"
      );
    };
  }

  toast("Processing completed", "success");

  if (typeof loadJobs === "function") {
    loadJobs();
  }
}

function handleJobFailed(data) {
  if (typeof stopThoughts === "function") stopThoughts();

  stopPolling();
  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  document.body.classList.remove("processing-active");

  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  if (typeof setUIBusy === "function") setUIBusy(false);

  if (data && data.stage) {
    const stageEl = document.getElementById("stage");
    if (stageEl) {
      stageEl.textContent = data.stage;
      stageEl.classList.add("error");
    }
    return;
  }

  toast("Processing failed. Please try again.", "error");
}

document.addEventListener("partials:loaded", () => {
  const savedJobId = localStorage.getItem("active_job_id");
  if (savedJobId && ID_TOKEN) {
    JOB_ID = savedJobId;
    window.POLLING_ACTIVE = true;
    document.body.classList.add("processing-active");
    startPolling();
  }
});
