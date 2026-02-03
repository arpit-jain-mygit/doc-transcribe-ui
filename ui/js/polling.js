function startPolling() {
  if (POLLER) clearInterval(POLLER);
  if (!JOB_ID) return;

  if (!UNLOAD_BOUND) {
    window.addEventListener("beforeunload", beforeUnloadHandler);
    UNLOAD_BOUND = true;
  }

  POLLER = setInterval(pollStatus, 4000);
}

function stopPolling() {
  if (POLLER) clearInterval(POLLER);
  POLLER = null;
  window.removeEventListener("beforeunload", beforeUnloadHandler);
  UNLOAD_BOUND = false;
  setUIBusy(false);
}

function beforeUnloadHandler(e) {
  if (JOB_ID && POLLER) {
    e.preventDefault();
    e.returnValue = "";
  }
}