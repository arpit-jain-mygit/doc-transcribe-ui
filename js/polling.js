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
const COMPLETION_DWELL_MS = 2200;
const QUEUE_HEALTH_REFRESH_MS = 12000;
let QUEUE_HEALTH_LAST_TS = 0;
let QUEUE_HEALTH_CACHE = null;

// User value: hides assist panel when no contextual guidance is available.
function clearAssistPanel() {
  const panel = document.getElementById("assistPanel");
  const title = document.getElementById("assistTitle");
  const message = document.getElementById("assistMessage");
  const actionBtn = document.getElementById("assistActionBtn");
  if (!panel || !title || !message || !actionBtn) return;
  panel.style.display = "none";
  title.textContent = "";
  message.textContent = "";
  actionBtn.style.display = "none";
  actionBtn.textContent = "";
  actionBtn.onclick = null;
}

// User value: executes assist actions so users can recover quickly from queue/failure states.
function runAssistAction(actionType) {
  const action = String(actionType || "").toUpperCase();
  if (action === "RELOGIN") {
    if (typeof logout === "function") logout();
    return;
  }
  if (action === "REUPLOAD") {
    const input = document.getElementById("unifiedFile");
    if (input) input.focus();
    const anchor = document.getElementById("uploadGrid");
    if (anchor && typeof anchor.scrollIntoView === "function") {
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }
  if (action === "OPEN_HISTORY" || action === "RETRY_JOB") {
    if (typeof setActiveTab === "function") setActiveTab("history");
    if (typeof setJobsFilter === "function") {
      setJobsFilter(action === "RETRY_JOB" ? "FAILED" : "PROCESSING");
    }
    if (typeof loadJobs === "function") {
      loadJobs({ reset: true, append: false });
    }
    return;
  }
}

// User value: renders a Hindi assist panel with one clear next step when guidance is available.
function renderAssistPanel(data) {
  const panel = document.getElementById("assistPanel");
  const title = document.getElementById("assistTitle");
  const message = document.getElementById("assistMessage");
  const actionBtn = document.getElementById("assistActionBtn");
  if (!panel || !title || !message || !actionBtn) return;

  const assist = data && typeof data === "object" ? data.assist : null;
  if (!assist || typeof assist !== "object") {
    clearAssistPanel();
    return;
  }

  const textTitle = String(assist.title || "").trim();
  const textMessage = String(assist.message || "").trim();
  if (!textTitle && !textMessage) {
    clearAssistPanel();
    return;
  }
  title.textContent = textTitle || "सहायता संदेश";
  message.textContent = textMessage || "";
  panel.style.display = "flex";

  const actionLabel = String(assist.action_label || "").trim();
  const actionType = String(assist.action_type || "").trim().toUpperCase();
  if (actionLabel && actionType) {
    actionBtn.style.display = "inline-flex";
    actionBtn.textContent = actionLabel;
    actionBtn.onclick = () => runAssistAction(actionType);
  } else {
    actionBtn.style.display = "none";
    actionBtn.textContent = "";
    actionBtn.onclick = null;
  }
}

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

// User value: adds a short pre-complete dwell so users can perceive finalization without changing backend timings.
function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
}
// User value: updates user-visible OCR/transcription state accurately.
function updateProcessingMetrics({ progressValue }) {
  const pctEl = document.getElementById("progressPct");
  if (!pctEl) return;

  const pct = Number.isFinite(progressValue) ? Math.max(0, Math.min(100, Math.round(progressValue))) : 0;
  pctEl.textContent = `${pct}%`;
}

// User value: formats queued wait so users can clearly see how long worker pickup is taking.
function formatQueueWait(secRaw) {
  const sec = Math.max(0, Math.floor(Number(secRaw) || 0));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  if (mins <= 0) return `${rem}s`;
  return `${mins}m ${rem}s`;
}

// User value: updates queue signals so users understand scheduler state while job is queued.
function updateQueueSignals(data) {
  const wrap = document.getElementById("queueSignals");
  const timerEl = document.getElementById("queueTimer");
  const hintEl = document.getElementById("queueHint");
  if (!wrap || !timerEl || !hintEl) return;

  const status = String(data?.status || "").toUpperCase();
  if (status !== "QUEUED") {
    wrap.style.display = "none";
    timerEl.textContent = "";
    hintEl.textContent = "";
    return;
  }

  let queuedSec = 0;
  const created = (typeof parseBackendTime === "function")
    ? parseBackendTime(data?.created_at)
    : null;
  if (created instanceof Date && !Number.isNaN(created.getTime())) {
    queuedSec = Math.max(0, Math.floor((Date.now() - created.getTime()) / 1000));
  }

  timerEl.textContent = `Queued for ${formatQueueWait(queuedSec)}`;
  const queueHealth = (window.QUEUE_HEALTH_STATE && typeof window.QUEUE_HEALTH_STATE === "object")
    ? window.QUEUE_HEALTH_STATE
    : null;
  const queueDepthTotal = Array.isArray(queueHealth?.queues)
    ? queueHealth.queues.reduce((sum, q) => sum + Math.max(0, Number(q?.depth) || 0), 0)
    : 0;
  const schedulerPolicy = String(queueHealth?.scheduler_policy || "adaptive").toUpperCase();
  if (queueDepthTotal <= 1 && queuedSec < 20) {
    hintEl.textContent = `कतार सामान्य है (${schedulerPolicy}); आपका काम शीघ्र शुरू होगा।`;
  } else if (queueDepthTotal <= 3 && queuedSec < 60) {
    hintEl.textContent = `कतार व्यस्त है (${schedulerPolicy}); निष्पक्ष क्रम से काम आगे बढ़ रहे हैं।`;
  } else {
    hintEl.textContent = `कतार पर अधिक लोड है (${schedulerPolicy}); आपके काम को प्राथमिकता क्रम में जल्द उठाया जाएगा।`;
  }
  wrap.style.display = "inline-flex";
}

// User value: fetches queue health periodically so queued users see real scheduler and depth signals.
async function refreshQueueHealth() {
  if (!window.ApiClient || !window.ApiClient.getQueueHealth || !ID_TOKEN) return;
  const now = Date.now();
  if ((now - QUEUE_HEALTH_LAST_TS) < QUEUE_HEALTH_REFRESH_MS && QUEUE_HEALTH_CACHE) {
    window.QUEUE_HEALTH_STATE = QUEUE_HEALTH_CACHE;
    return;
  }
  try {
    const { res, data } = await window.ApiClient.getQueueHealth({
      requestId: window.ACTIVE_REQUEST_ID || "",
    });
    if (res && res.ok && data && !data._nonJson) {
      QUEUE_HEALTH_CACHE = data;
      QUEUE_HEALTH_LAST_TS = now;
      window.QUEUE_HEALTH_STATE = data;
    }
  } catch {
    // ignore queue-health fetch failures; status polling remains source of truth.
  }
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
  clearAssistPanel();

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

    if (String(data.status || "").toUpperCase() === "QUEUED") {
      await refreshQueueHealth();
    }

    updateProcessingUI(data);

    if (data.status === "COMPLETED") {
      await handleJobCompleted(data);
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
  updateQueueSignals(data);
  renderAssistPanel(data);

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
        pulseSpeed = 5.2; // slowest warm-up phase
      } else if (target <= 90) {
        pulseSpeed = 1.1; // faster: active processing phase
      } else {
        pulseSpeed = 5.0; // slowest finalization phase
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
  updateQueueSignals({});
  clearAssistPanel();

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = true;

  JOB_ID = null;
  window.ACTIVE_JOB_TYPE = null;
  window.ACTIVE_REQUEST_ID = null;
  window.ACTIVE_INTAKE_PRECHECK = null;
  window.QUEUE_HEALTH_STATE = null;
  QUEUE_HEALTH_CACHE = null;
  QUEUE_HEALTH_LAST_TS = 0;
  localStorage.removeItem("active_job_id");
  CANCEL_REQUESTED = false;

  if (typeof setUIBusy === "function") setUIBusy(false);
  if (typeof clearUploadInputState === "function") clearUploadInputState("unifiedFile");
}

// User value: handles user/system events to keep OCR/transcription flow stable.
async function handleJobCompleted(data) {
  if (CANCEL_REQUESTED) {
    completeAndResetUI();
    return;
  }

  const stageEl = document.getElementById("stage");
  const header = document.querySelector(".processing-panel h2");
  const progressEl = document.getElementById("progress");

  if (stageEl && lastProgress >= 90) {
    stageEl.textContent = "Finalizing output...";
  }
  if (header && lastProgress >= 90) {
    header.style.setProperty("--pulse-speed", "5.8s");
  }
  if (progressEl && lastProgress >= 90) {
    progressEl.value = Math.max(Number(progressEl.value || 0), 99);
  }

  if (lastProgress >= 90) {
    await sleepMs(COMPLETION_DWELL_MS);
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
  const statusBox = document.getElementById("statusBox");
  const statusEl = document.getElementById("status");
  const stageEl = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const cancelBtn = document.getElementById("cancelJobBtn");
  if (statusBox) statusBox.style.display = "block";
  if (statusEl) statusEl.textContent = "असफल";
  if (stageEl) {
    stageEl.textContent = detail;
    stageEl.classList.add("error");
  }
  if (progressEl) progressEl.value = Math.max(0, Number(data?.progress) || 0);
  if (cancelBtn) cancelBtn.disabled = true;
  if (typeof updateProcessingHeader === "function") updateProcessingHeader(data || {});
  renderAssistPanel(data || {});
  toast(`प्रोसेसिंग असफल रही: ${detail}`, "error");
}

// User value: lets users stop running OCR/transcription jobs quickly.
function handleJobCancelled(data) {
  CANCEL_REQUESTED = false;
  completeAndResetUI();
  const statusBox = document.getElementById("statusBox");
  const statusEl = document.getElementById("status");
  const stageEl = document.getElementById("stage");
  const progressEl = document.getElementById("progress");
  const cancelBtn = document.getElementById("cancelJobBtn");
  if (statusBox) statusBox.style.display = "block";
  if (statusEl) statusEl.textContent = "रद्द";
  if (stageEl) {
    stageEl.textContent = String(data?.stage || "कार्य रद्द किया गया");
    stageEl.classList.remove("error");
  }
  if (progressEl) progressEl.value = Math.max(0, Number(data?.progress) || 0);
  if (cancelBtn) cancelBtn.disabled = true;
  if (typeof updateProcessingHeader === "function") updateProcessingHeader(data || {});
  renderAssistPanel(data || {});
  toast("कार्य रद्द किया गया", "info");
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
