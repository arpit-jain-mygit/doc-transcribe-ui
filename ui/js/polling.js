/* =========================================================
   POLLING — SINGLE SOURCE OF TRUTH (FINAL)
   ========================================================= */

let POLL_INTERVAL = null;
let lastProgress = 0;

function startPolling() {
  if (!JOB_ID) return;

  stopPolling();
  window.POLLING_ACTIVE = true;

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.style.display = "block";

  document.body.classList.add("processing-active");

  lastProgress = 0;
  const progressEl = document.getElementById("progress");
  if (progressEl) {
    progressEl.max = 100;
    progressEl.value = 0;
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

  const raw = Number(data.progress);
  if (progressEl && Number.isFinite(raw)) {
    const target = Math.max(0, Math.min(100, raw));
    lastProgress = Math.max(lastProgress, target);
    progressEl.value = lastProgress;
  }

  if (stageEl && data.stage) {
    stageEl.textContent = data.stage;
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
  if (typeof showCompletion === "function") showCompletion(data);

  toast("Processing completed", "success");
  if (typeof loadJobs === "function") loadJobs();
}

function handleJobFailed() {
  if (typeof stopThoughts === "function") stopThoughts();

  stopPolling();
  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = true;

  document.body.classList.remove("processing-active");

  JOB_ID = null;
  localStorage.removeItem("active_job_id");

  if (typeof setUIBusy === "function") setUIBusy(false);

  toast("Processing failed. Please try again.", "error");
}

// Resume after refresh
document.addEventListener("partials:loaded", () => {
  const savedJobId = localStorage.getItem("active_job_id");
  if (savedJobId && ID_TOKEN) {
    JOB_ID = savedJobId;
    window.POLLING_ACTIVE = true;
    document.body.classList.add("processing-active");
    startPolling();
  }
});
