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
  forceDownload(link.dataset.url);
});

waitForGoogleAndRender();