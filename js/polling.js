/* =========================================================
   POLLING — SINGLE SOURCE OF TRUTH (FINAL)
   ========================================================= */

let POLL_INTERVAL = null;
let lastProgress = 0;
let CANCEL_REQUESTED = false;
function updateProcessingMetrics({ progressValue }) {
  const pctEl = document.getElementById("progressPct");
  if (!pctEl) return;

  const pct = Number.isFinite(progressValue) ? Math.max(0, Math.min(100, Math.round(progressValue))) : 0;
  pctEl.textContent = `${pct}%`;
}

function humanizeStage(stage) {
  if (!stage) return "";

  const chunkMatch = /^Transcribing chunk (\d+)\/(\d+)$/i.exec(stage.trim());
  if (chunkMatch) {
    const current = chunkMatch[1];
    const total = chunkMatch[2];
    return `Transcribing your audio: part ${current} of ${total}`;
  }

  const ocrMatch = /^OCR page (\d+)\/(\d+)$/i.exec(stage.trim());
  if (ocrMatch) {
    const current = ocrMatch[1];
    const total = ocrMatch[2];
    return `Reading your document: page ${current} of ${total}`;
  }

  return stage;
}

/* ---------------------------------------------------------
   IMMEDIATE PROGRESS BOOTSTRAP (UI ONLY)
   --------------------------------------------------------- */
function bootstrapProgress(stageText = "Preparing…", value = 3) {
  const statusBox = document.getElementById("statusBox");
  const progressEl = document.getElementById("progress");
  const stageEl = document.getElementById("stage");

  if (typeof hideCompletion === "function") hideCompletion();

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

  updateProcessingMetrics({ progressValue: value });
}

window.bootstrapProgress = bootstrapProgress;

async function cancelJobById(jobId, { silent = false } = {}) {
  if (!jobId || !ID_TOKEN) return false;
  const activeType = String(window.ACTIVE_JOB_TYPE || "").toUpperCase();

  try {
    const reqHeaders = authHeadersWithRequestId({
      requestId: window.ACTIVE_REQUEST_ID || "",
      includeAuth: true,
    }).headers;
    const res = await fetch(`${API}/jobs/${jobId}/cancel`, {
      method: "POST",
      headers: reqHeaders,
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
      if (activeType && typeof setJobsTypeFilter === "function") {
        setJobsTypeFilter(activeType);
      }
      if (typeof setJobsFilter === "function") {
        setJobsFilter("CANCELLED");
      }
      handleJobCancelled({ stage: "Cancelled by user" });
    }
    if (typeof setJobsFilter === "function") {
      setJobsFilter("CANCELLED");
    }
    if (typeof loadJobs === "function") {
      loadJobs({ reset: true, append: false });
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

  const confirmed = window.confirm(
    "Cancel this running job?\n\nCurrent processing will stop and the job will move to Cancelled history."
  );
  if (!confirmed) return;
  CANCEL_REQUESTED = true;

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = true;

  const ok = await cancelJobById(JOB_ID);
  if (!ok && cancelBtn) {
    cancelBtn.disabled = false;
  }
  if (!ok) {
    CANCEL_REQUESTED = false;
  }
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

  updateProcessingMetrics({ progressValue: lastProgress });

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
    const reqHeaders = authHeadersWithRequestId({
      requestId: window.ACTIVE_REQUEST_ID || "",
      includeAuth: true,
    }).headers;
    res = await fetch(`${API}/status/${JOB_ID}`, {
      headers: reqHeaders
    });
  } catch {
    return;
  }

  if (res.status === 401) {
    logout();
    return;
  }

  if (!res.ok) return;

  const data = await safeJson(res);
  if (!data || data._nonJson) return;
  if (data.request_id) {
    window.ACTIVE_REQUEST_ID = String(data.request_id).trim();
  }

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
  let effectiveProgress = lastProgress;
  if (progressEl && Number.isFinite(raw)) {
    const target = Math.max(0, Math.min(100, raw));
    lastProgress = Math.max(lastProgress, target);
    progressEl.value = lastProgress;
    effectiveProgress = lastProgress;

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
    stageEl.textContent = humanizeStage(data.stage);
    stageEl.classList.toggle("error", data.status === "FAILED");
  }

  updateProcessingMetrics({ progressValue: effectiveProgress });
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
  window.ACTIVE_JOB_TYPE = null;
  window.ACTIVE_REQUEST_ID = null;
  localStorage.removeItem("active_job_id");
  CANCEL_REQUESTED = false;

  if (typeof setUIBusy === "function") setUIBusy(false);
  if (typeof clearUploadInputState === "function") clearUploadInputState("unifiedFile");
}

function handleJobCompleted(data) {
  if (CANCEL_REQUESTED) {
    completeAndResetUI();
    return;
  }

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
}

function handleJobFailed(data) {
  completeAndResetUI();

  if (data && data.stage) {
    const stageEl = document.getElementById("stage");
    if (stageEl) {
      stageEl.textContent = data.stage;
      stageEl.classList.add("error");
    }
  }

  const detail = typeof getJobFailureMessage === "function"
    ? getJobFailureMessage(data)
    : ((data && (data.error_message || data.error || data.stage)) || "Please try again.");

  toast(`Processing failed: ${detail}`, "error");
}

function handleJobCancelled(data) {
  CANCEL_REQUESTED = false;
  completeAndResetUI();
  toast(data?.stage || "Job cancelled", "info");
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
