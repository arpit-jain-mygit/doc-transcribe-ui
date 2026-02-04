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


waitForGoogleAndRender();