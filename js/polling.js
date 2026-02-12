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

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = false;

  // Start Jain thoughts as soon as processing begins
  if (typeof startThoughts === "function") startThoughts();

  if (progressEl) {
    progressEl.max = 100;
    progressEl.value = value;
    lastProgress = value;
  }

  if (stageEl) {
    stageEl.textContent = stageText;
    stageEl.classList.remove("error");
  }
}

window.bootstrapProgress = bootstrapProgress;

async function cancelJobById(jobId, { silent = false } = {}) {
  if (!jobId || !ID_TOKEN) return false;

  try {
    const res = await fetch(`${API}/jobs/${jobId}/cancel`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ID_TOKEN },
    });

    if (res.status === 401) {
      logout();
      return false;
    }

    if (!res.ok) {
      if (!silent) toast("Unable to cancel job", "error");
      return false;
    }

    if (!silent) toast("Cancellation requested", "info");

    if (jobId === JOB_ID) {
      handleJobCancelled({ stage: "Cancelled by user" });
    }

    if (typeof loadJobs === "function") {
      loadJobs();
    }

    return true;
  } catch {
    if (!silent) toast("Network error while cancelling", "error");
    return false;
  }
}

window.cancelJobById = cancelJobById;

window.cancelCurrentJob = async function cancelCurrentJob() {
  if (!JOB_ID) {
    toast("No running job to cancel", "info");
    return;
  }

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = true;

  await cancelJobById(JOB_ID);
};

function startPolling() {
  if (!JOB_ID) return;

  stopPolling();
  window.POLLING_ACTIVE = true;

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.style.display = "block";

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = false;

  document.body.classList.add("processing-active");

  const progressEl = document.getElementById("progress");
  if (progressEl) {
    progressEl.max = 100;
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
  } else if (data.status === "CANCELLED") {
    handleJobCancelled(data);
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

    const header = document.querySelector(".processing-panel h2");

    if (header) {
      let pulseSpeed;

      if (target < 50) {
        pulseSpeed = 1.6;
      } else if (target < 80) {
        pulseSpeed = 2.2;
      } else if (target < 95) {
        pulseSpeed = 3.2;
      } else {
        pulseSpeed = 4.5;
      }

      header.style.setProperty("--pulse-speed", `${pulseSpeed}s`);
    }
  }

  if (stageEl && data.stage) {
    stageEl.textContent = data.stage;
    stageEl.classList.toggle("error", data.status === "FAILED");
  }
}

function completeAndResetUI() {
  if (typeof stopThoughts === "function") stopThoughts();

  const header = document.querySelector(".processing-panel h2");
  if (header) header.style.setProperty("--pulse-speed", "0s");

  stopPolling();
  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  document.body.classList.remove("processing-active");

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.style.display = "none";

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = true;

  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  if (typeof setUIBusy === "function") setUIBusy(false);
}

function handleJobCompleted(data) {
  completeAndResetUI();

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
        data.output_filename || data.output_file || "transcript.txt"
      );
    };
  }

  toast("Processing completed", "success");

  if (typeof loadJobs === "function") {
    loadJobs();
  }
}

function handleJobFailed(data) {
  completeAndResetUI();

  if (data && data.stage) {
    const stageEl = document.getElementById("stage");
    if (stageEl) {
      stageEl.textContent = data.stage;
      stageEl.classList.add("error");
    }
    toast("Processing failed", "error");
    return;
  }

  toast("Processing failed. Please try again.", "error");
}

function handleJobCancelled(data) {
  completeAndResetUI();
  toast(data?.stage || "Job cancelled", "info");

  if (typeof loadJobs === "function") {
    loadJobs();
  }
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
