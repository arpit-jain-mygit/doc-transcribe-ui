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


waitForGoogleAndRender();