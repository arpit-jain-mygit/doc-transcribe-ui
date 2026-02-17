// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
// =====================================================
// APP BOOTSTRAP (AFTER HTML PARTIALS ARE LOADED)
// =====================================================

document.addEventListener("partials:loaded", () => {
  if (typeof initWorkspaceView === "function") {
    initWorkspaceView();
  }

  const restored =
    typeof restoreSession === "function" && restoreSession();

  // ✅ Drag & drop must be attached in ALL cases
  if (typeof attachDragDrop === "function") {
    attachDragDrop("unifiedDrop", "unifiedFile", "unifiedFilename");
  }
  if (typeof initUnifiedUpload === "function") {
    initUnifiedUpload();
  }

  // Logged-out path
  if (!restored) {
    bootstrapLoggedOutUI();
  }
});



// =====================================================
// WARN USER ON REFRESH / TAB CLOSE DURING PROCESSING
// =====================================================

window.addEventListener("beforeunload", (e) => {
  if (window.POLLING_ACTIVE) {
    e.preventDefault();

    // Required for Chrome / Edge / Firefox
    e.returnValue =
      "Processing is still in progress. If you leave or refresh, the task may be interrupted.";

    return e.returnValue;
  }
});

window.addEventListener("keydown", (e) => {
  const isUploadShortcut = (e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "u";
  if (!isUploadShortcut) return;

  const tag = (document.activeElement?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  e.preventDefault();

  const picker = document.getElementById("unifiedFile");
  if (picker) picker.click();
});

// =====================================================
// HIDE PROCESSING PANEL (CLOSE BUTTON)
// =====================================================

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

  // Clear progress bar visually
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

// User value: prepares a stable OCR/transcription experience before user actions.
function bootstrapLoggedOutUI() {
  // Ensure logged-out UI is visible
  showLoggedOutUI();

  // Reset Google render guard (safe on logout only)
  if (typeof resetGoogleAuth === "function") {
    resetGoogleAuth();
  }

  // Render Google Sign-In
  if (typeof renderGoogleButton === "function") {
    renderGoogleButton();
  }

  // Reattach drag & drop
  if (typeof attachDragDrop === "function") {
    attachDragDrop("unifiedDrop", "unifiedFile", "unifiedFilename");
  }
  if (typeof initUnifiedUpload === "function") {
    initUnifiedUpload();
  }
}
