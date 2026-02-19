// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
/* =========================================================
   POLLING — SINGLE SOURCE OF TRUTH (FINAL)
   ========================================================= */

let POLL_INTERVAL = null;
let POLL_IN_FLIGHT = false;
let POLL_SESSION_ID = 0;
let ACTIVE_POLLED_JOB_ID = null;
let lastProgress = 0;
let CANCEL_REQUESTED = false;
const POLL_INTERVAL_ACTIVE_MS = 3000;
const POLL_INTERVAL_BACKGROUND_MS = 10000;
const POLL_INTERVAL_RETRY_MS = 5000;

// User value: keeps users updated with live OCR/transcription progress.
function currentPollDelayMs() {
  return document.hidden ? POLL_INTERVAL_BACKGROUND_MS : POLL_INTERVAL_ACTIVE_MS;
}

// User value: keeps users updated with live OCR/transcription progress.
function scheduleNextPoll(sessionId, delayMs) {
  if (!window.POLLING_ACTIVE || !JOB_ID || sessionId !== POLL_SESSION_ID) return;
  if (POLL_INTERVAL) clearTimeout(POLL_INTERVAL);
  const nextDelay = Number.isFinite(delayMs) ? Math.max(0, delayMs) : currentPollDelayMs();
  POLL_INTERVAL = setTimeout(() => {
    pollStatus(sessionId);
  }, nextDelay);
}
// User value: updates user-visible OCR/transcription state accurately.
function updateProcessingMetrics({ progressValue }) {
  const pctEl = document.getElementById("progressPct");
  if (!pctEl) return;

  const pct = Number.isFinite(progressValue) ? Math.max(0, Math.min(100, Math.round(progressValue))) : 0;
  pctEl.textContent = `${pct}%`;
}

// User value: supports humanizeStage so the OCR/transcription journey stays clear and reliable.
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
// User value: prepares a stable OCR/transcription experience before user actions.
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

// User value: lets users stop running OCR/transcription jobs quickly.
async function cancelJobById(jobId, { silent = false } = {}) {
  if (!jobId || !ID_TOKEN) return false;
  const activeType = String(window.ACTIVE_JOB_TYPE || "").toUpperCase();

  try {
    const { res } = await window.ApiClient.cancelJob(jobId, {
      requestId: window.ACTIVE_REQUEST_ID || "",
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

// User value: keeps users updated with live OCR/transcription progress.
function startPolling() {
  if (!JOB_ID) return;
  if (
    window.POLLING_ACTIVE &&
    ACTIVE_POLLED_JOB_ID === JOB_ID &&
    (POLL_IN_FLIGHT || POLL_INTERVAL)
  ) {
    return;
  }

  stopPolling();
  window.POLLING_ACTIVE = true;
  POLL_SESSION_ID += 1;
  const sessionId = POLL_SESSION_ID;
  ACTIVE_POLLED_JOB_ID = JOB_ID;

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

  pollStatus(sessionId);
}

// User value: keeps users updated with live OCR/transcription progress.
function stopPolling() {
  if (POLL_INTERVAL) {
    clearTimeout(POLL_INTERVAL);
    POLL_INTERVAL = null;
  }
  POLL_IN_FLIGHT = false;
  ACTIVE_POLLED_JOB_ID = null;
}

// User value: keeps users updated with live OCR/transcription progress.
async function pollStatus(sessionId = POLL_SESSION_ID) {
  if (sessionId !== POLL_SESSION_ID) return;
  if (!JOB_ID || !ID_TOKEN) return;
  if (POLL_IN_FLIGHT) return;

  let res;
  let data;
  POLL_IN_FLIGHT = true;
  try {
    const { res: statusRes, data: statusData } = await window.ApiClient.getStatus(JOB_ID, {
      requestId: window.ACTIVE_REQUEST_ID || "",
    });
    res = statusRes;
    data = statusData;
  } catch {
    POLL_IN_FLIGHT = false;
    scheduleNextPoll(sessionId, POLL_INTERVAL_RETRY_MS);
    return;
  }

  try {
    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      scheduleNextPoll(sessionId, POLL_INTERVAL_RETRY_MS);
      return;
    }

    if (!data || data._nonJson) {
      scheduleNextPoll(sessionId, POLL_INTERVAL_RETRY_MS);
      return;
    }
    if (data.request_id) {
      window.ACTIVE_REQUEST_ID = String(data.request_id).trim();
    }

    updateProcessingUI(data);

    if (data.status === "COMPLETED") {
      handleJobCompleted(data);
      return;
    }
    if (data.status === "FAILED") {
      handleJobFailed(data);
      return;
    }
    if (data.status === "CANCELLED") {
      handleJobCancelled(data);
      return;
    }
    scheduleNextPoll(sessionId);
  } catch {
    scheduleNextPoll(sessionId, POLL_INTERVAL_RETRY_MS);
  } finally {
    POLL_IN_FLIGHT = false;
  }
}

// User value: updates user-visible OCR/transcription state accurately.
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
      if (target < 10) {
        pulseSpeed = 4.4; // slower warm-up phase
      } else if (target <= 90) {
        pulseSpeed = 1.1; // faster: active processing phase
      } else {
        pulseSpeed = 4.2; // slower finalization phase
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

// User value: supports completeAndResetUI so the OCR/transcription journey stays clear and reliable.
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

// User value: handles user/system events to keep OCR/transcription flow stable.
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

// User value: handles user/system events to keep OCR/transcription flow stable.
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

// User value: lets users stop running OCR/transcription jobs quickly.
function handleJobCancelled(data) {
  CANCEL_REQUESTED = false;
  completeAndResetUI();
  toast(data?.stage || "Job cancelled", "info");
}

document.addEventListener("partials:loaded", () => {
  const savedJobId = localStorage.getItem("active_job_id");
  if (savedJobId && ID_TOKEN) {
    if (window.POLLING_ACTIVE && JOB_ID === savedJobId) return;
    JOB_ID = savedJobId;
    window.POLLING_ACTIVE = true;
    document.body.classList.add("processing-active");
    startPolling();
  }
});

if (!window.__POLLING_VISIBILITY_WIRED__) {
  document.addEventListener("visibilitychange", () => {
    if (!window.POLLING_ACTIVE || !JOB_ID) return;
    const currentSession = POLL_SESSION_ID;
    if (!document.hidden && !POLL_IN_FLIGHT) {
      scheduleNextPoll(currentSession, 250);
      return;
    }
    scheduleNextPoll(currentSession);
  });
  window.__POLLING_VISIBILITY_WIRED__ = true;
}
