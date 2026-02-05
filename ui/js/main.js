document.addEventListener("DOMContentLoaded", () => {
  stopPolling();
  restoreSession();

  attachDragDrop("ocrDrop", "ocrFile", "ocrFilename");
  attachDragDrop("transcribeDrop", "transcribeFile", "transcribeFilename");
});

document.addEventListener("click", e => {
  const link = e.target.closest(".history-download");
  if (!link) return;
  e.preventDefault();

  if (!link.dataset.filename) {
    console.warn("Missing filename for download", link.dataset.url);
    return;
  }

  forceDownload(
    link.dataset.url,
    link.dataset.filename
  );

});

// ---------------------------------------------
// WARN USER ON REFRESH / TAB CLOSE DURING PROCESSING
// ---------------------------------------------
window.addEventListener("beforeunload", (e) => {
  if (window.POLLING_ACTIVE) {
    e.preventDefault();

    // Required for Chrome / Edge / Firefox
    e.returnValue =
      "Processing is still in progress. If you leave or refresh, the task may be interrupted.";

    return e.returnValue;
  }
});

// ---------------------------------------------
// HIDE PROCESSING PANEL (CLOSE BUTTON)
// ---------------------------------------------
window.hideProcessing = function () {
  // Stop polling safely (UI only)
  if (typeof stopPolling === "function") {
    stopPolling();
  }

  // Exit processing mode (UI only)
  document.body.classList.remove("processing-active");

  // Hide processing panel
  const statusBox = document.getElementById("statusBox");
  if (statusBox) {
    statusBox.style.display = "none";
  }

  // Hide polite processing hint
  const hint = document.getElementById("processingHint");
  if (hint) {
    hint.style.display = "none";
  }

  // Clear progress bar visually (safe)
  const progress = document.getElementById("progress");
  if (progress) {
    progress.value = 0;
  }

  // Clear status text
  const status = document.getElementById("status");
  if (status) {
    status.textContent = "";
  }

  const stage = document.getElementById("stage");
  if (stage) {
    stage.textContent = "";
  }

  // ⚠️ IMPORTANT:
  // Do NOT clear JOB_ID here.
  // Backend job continues safely.
};



waitForGoogleAndRender();