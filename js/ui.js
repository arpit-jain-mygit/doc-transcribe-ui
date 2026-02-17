// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
function setUIBusy(isBusy) {
  UI_BUSY = isBusy;

  document
    .querySelectorAll("button:not(.account-menu-item):not(#cancelJobBtn):not(#accountChip), input[type='file'], a.history-download")
    .forEach(el => {
      el.disabled = isBusy;
      el.style.pointerEvents = isBusy ? "none" : "auto";
      el.style.opacity = isBusy ? "0.6" : "1";
    });

  document.querySelectorAll(".drop-zone").forEach(z => {
    z.classList.toggle("disabled", isBusy);
  });
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function getDisplayName(email) {
  const raw = String(email || "").trim();
  if (!raw) return "Account";
  return raw.split("@")[0] || raw;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function getAvatarInitials(email) {
  const base = String(email || "").split("@")[0].replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!base) return "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function renderAvatar(picture, email) {
  const wrap = document.querySelector(".user-avatar-wrap");
  const avatar = document.getElementById("userAvatar");
  const fallback = document.getElementById("userAvatarFallback");
  if (!wrap || !avatar || !fallback) return;

  fallback.textContent = getAvatarInitials(email);
  avatar.onerror = () => {
    wrap.classList.add("show-fallback");
  };

  const src = String(picture || "").trim();
  if (src) {
    wrap.classList.remove("show-fallback");
    avatar.src = src;
  } else {
    avatar.removeAttribute("src");
    wrap.classList.add("show-fallback");
  }
}

window.setUserProfileIdentity = function setUserProfileIdentity({ email, picture } = {}) {
  const userEmail = document.getElementById("userEmail");
  const userName = document.getElementById("userName");

  if (userEmail) userEmail.textContent = email || "";
  if (userName) userName.textContent = getDisplayName(email);
  renderAvatar(picture, email);
};

window.WORKSPACE_VIEW = "conversion";

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function applyWorkspaceTabState(view) {
  const conversionTab = document.getElementById("workspaceTabConversion");
  const historyTab = document.getElementById("workspaceTabHistory");
  const conversionView = document.getElementById("workspaceConversionView");
  const historyView = document.getElementById("workspaceHistoryView");

  const conversionActive = view === "conversion";
  if (conversionTab) {
    conversionTab.classList.toggle("active", conversionActive);
    conversionTab.setAttribute("aria-selected", conversionActive ? "true" : "false");
  }
  if (historyTab) {
    historyTab.classList.toggle("active", !conversionActive);
    historyTab.setAttribute("aria-selected", !conversionActive ? "true" : "false");
  }

  if (conversionView) conversionView.style.display = conversionActive ? "block" : "none";
  if (historyView) historyView.style.display = conversionActive ? "none" : "block";
}

window.setWorkspaceView = function setWorkspaceView(view, options = {}) {
  const next = view === "history" ? "history" : "conversion";
  const { loadHistory = true } = options || {};

  window.WORKSPACE_VIEW = next;
  applyWorkspaceTabState(next);

  if (next === "history" && loadHistory && typeof ensureHistoryLoaded === "function") {
    ensureHistoryLoaded();
  }

  window.dispatchEvent(
    new CustomEvent("workspace:view-changed", {
      detail: { view: next },
    })
  );
};

window.initWorkspaceView = function initWorkspaceView() {
  window.setWorkspaceView("conversion", { loadHistory: false });
};

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function closeAccountMenu() {
  const dropdown = document.getElementById("accountDropdown");
  const chip = document.getElementById("accountChip");
  if (dropdown) dropdown.hidden = true;
  if (chip) chip.setAttribute("aria-expanded", "false");
}

window.toggleAccountMenu = function toggleAccountMenu(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById("accountDropdown");
  const chip = document.getElementById("accountChip");
  if (!dropdown || !chip) return;
  const open = dropdown.hidden === false;
  dropdown.hidden = open;
  chip.setAttribute("aria-expanded", open ? "false" : "true");
};

if (!window.__ACCOUNT_MENU_WIRED__) {
  document.addEventListener("click", (event) => {
    const menu = document.getElementById("accountMenu");
    if (!menu || !menu.contains(event.target)) {
      closeAccountMenu();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAccountMenu();
  });
  window.__ACCOUNT_MENU_WIRED__ = true;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function showLoggedInUI() {
  document.body.classList.add("logged-in");   // ✅ ADD THIS

  const userProfile = document.getElementById("userProfile");
  const authBox = document.getElementById("authBox");

  if (authBox) authBox.style.display = "none";
  if (userProfile) userProfile.style.display = "flex";

  if (typeof setUserProfileIdentity === "function") {
    setUserProfileIdentity({
      email: USER_EMAIL || "",
      picture: USER_PICTURE || "",
    });
  }
  closeAccountMenu();
  if (typeof setWorkspaceView === "function") {
    setWorkspaceView("conversion", { loadHistory: false });
  }
}


// User value: This step keeps the user OCR/transcription flow clear and dependable.
function showLoggedOutUI() {
  document.body.classList.remove("logged-in"); // ✅ ADD THIS

  const userProfile = document.getElementById("userProfile");
  const authBox = document.getElementById("authBox");

  if (userProfile) userProfile.style.display = "none";
  if (authBox) authBox.style.display = "block";
  if (typeof setUserProfileIdentity === "function") {
    setUserProfileIdentity({ email: "", picture: "" });
  }
  closeAccountMenu();
}


// User value: This step keeps the user OCR/transcription flow clear and dependable.
function toast(message, type = "info") {
  const box = document.getElementById("toasts");
  if (!box) return;

  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.setAttribute("role", "status");

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent =
    type === "success" ? "✓" :
    type === "error" ? "!" :
    "i";

  const text = document.createElement("span");
  text.className = "toast-text";
  text.textContent = message;

  div.appendChild(icon);
  div.appendChild(text);
  box.appendChild(div);

  const durationMs = type === "error" ? 7000 : 4300;
  setTimeout(() => div.remove(), durationMs);
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function showPending() {
  IS_PENDING = true;
  const banner = document.getElementById("approvalBanner");
  if (banner) banner.style.display = "block";

  document.querySelectorAll(".drop-zone")
    .forEach(z => z.classList.add("disabled"));
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function hidePending() {
  IS_PENDING = false;
  const banner = document.getElementById("approvalBanner");
  if (banner) banner.style.display = "none";

  document.querySelectorAll(".drop-zone")
    .forEach(z => z.classList.remove("disabled"));
}

// AUTH-ONLY SECTION TOGGLE
window.toggleAuthOnly = function (isLoggedIn) {
  const authOnly = document.getElementById("authOnly");
  if (!authOnly) return;
  authOnly.style.display = isLoggedIn ? "block" : "none";
};

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function hideCompletion() {
  const wrapper = document.querySelector(".completion-wrapper");
  if (wrapper) wrapper.style.display = "none";
}

window.hideCompletion = hideCompletion;

window.scrollToHistory = function scrollToHistory(e) {
  if (e) e.preventDefault();
  if (typeof setWorkspaceView === "function") {
    setWorkspaceView("history");
  }
  const target = document.getElementById("historySection");
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

window.toggleFormatChips = function toggleFormatChips(button) {
  if (!button) return;
  const row = button.closest(".format-row");
  if (!row) return;

  row.querySelectorAll(".format-chip-extra").forEach((chip) => {
    chip.hidden = false;
  });
  button.remove();
};

// COMPLETION RENDER
// User value: This step keeps the user OCR/transcription flow clear and dependable.
function parseCompletionDurationSeconds(raw) {
  if (raw === null || raw === undefined || raw === "") return NaN;
  if (typeof raw === "number") return raw;

  const text = String(raw).trim();
  if (!text) return NaN;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric;

  const clock = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const a = Number(clock[1]);
    const b = Number(clock[2]);
    const c = Number(clock[3] || 0);
    if (text.split(":").length === 3) return a * 3600 + b * 60 + c;
    return a * 60 + b;
  }

  const suffix = text.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds)$/i);
  if (suffix) return Number(suffix[1]);

  return NaN;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function formatCompletionCompactDuration(totalSeconds) {
  const rounded = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(" ");
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function formatCompletionMediaDuration(secondsRaw) {
  const total = parseCompletionDurationSeconds(secondsRaw);
  if (!Number.isFinite(total) || total < 0) return "";
  const rounded = Math.max(0, Math.round(total));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hrs > 0) return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function jobContract() {
  return window.JOB_CONTRACT || {};
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function getCompletionTranscriptionMediaDuration(job) {
  const candidates = [
    job.media_duration_sec,
    job.input_duration_sec,
    job.audio_duration_sec,
    job.video_duration_sec,
    job.source_duration_sec,
    job.media_duration,
    job.input_duration,
    job.audio_duration,
    job.video_duration,
    job.source_duration,
    job.duration,
    job.duration_sec,
  ];
  for (const candidate of candidates) {
    const text = formatCompletionMediaDuration(candidate);
    if (text) return text;
  }
  return "";
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function formatCompletionJobTypeLabel(job) {
  const jobType = jobContract().resolveJobType ? jobContract().resolveJobType(job) : String(job?.job_type || "").toUpperCase();
  if (jobType === "OCR") return "PDF / Image to Hindi Text";
  if (jobType === "TRANSCRIPTION") return "Video / Audio to Hindi Text";
  return job?.job_type || "";
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function completionDetailClassToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function getCompletionJobTypeThemeClass(job) {
  const jobType = jobContract().resolveJobType ? jobContract().resolveJobType(job) : String(job?.job_type || "").toUpperCase();
  if (jobType === "OCR") return "completion-job-type-ocr";
  if (jobType === "TRANSCRIPTION") return "completion-job-type-transcription";
  return "completion-job-type-neutral";
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function showCompletion(job) {
  const wrapper = document.querySelector(".completion-wrapper");
  if (wrapper) {
    wrapper.style.display = "block"; // show the card container
  }

  const completionRow = document.getElementById("completionRow");
  if (completionRow) {
    completionRow.style.display = "flex"; // row layout
  }

  const uploadedFileEl = document.getElementById("uploadedFile");
  if (uploadedFileEl) {
    const uploaded = jobContract().resolveUploadedFilename ? jobContract().resolveUploadedFilename(job) : (job.input_filename || job.input_file || "");
    uploadedFileEl.textContent = uploaded || LAST_UPLOADED_FILENAME || "-";
  }

  const completionJobTypeEl = document.getElementById("completionJobType");
  if (completionJobTypeEl) {
    completionJobTypeEl.textContent = formatCompletionJobTypeLabel(job);
    completionJobTypeEl.classList.remove(
      "completion-job-type-ocr",
      "completion-job-type-transcription",
      "completion-job-type-neutral",
    );
    completionJobTypeEl.classList.add(getCompletionJobTypeThemeClass(job));
    completionJobTypeEl.style.display = completionJobTypeEl.textContent ? "inline-flex" : "none";
  }

  const completionMetaEl = document.getElementById("completionMeta");
  if (completionMetaEl) {
    const details = [];

    const resolvedType = jobContract().resolveJobType ? jobContract().resolveJobType(job) : String(job.job_type || "").toUpperCase();
    const isTranscription = resolvedType === "TRANSCRIPTION";
    const isOcr = resolvedType === "OCR";

    const bytes = jobContract().resolveInputSizeBytes ? jobContract().resolveInputSizeBytes(job) : Number(job.input_size_bytes);
    const hasSize = Number.isFinite(bytes) && bytes > 0;
    details.push({
      key: "File Size",
      value: hasSize ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "--",
      placeholder: !hasSize,
    });

    if (isOcr) {
      const pages = jobContract().resolveTotalPages ? jobContract().resolveTotalPages(job) : Number(job.total_pages);
      if (Number.isFinite(pages) && pages > 0) {
        details.push({
          key: "Pages",
          value: `${pages}`,
        });
      }
    } else if (isTranscription) {
      const mediaDuration = getCompletionTranscriptionMediaDuration(job);
      details.push({
        key: "Duration",
        value: mediaDuration || "--",
      });
    }

    const durationSec = jobContract().resolveDurationSec ? jobContract().resolveDurationSec(job) : Number(job.duration_sec);
    details.push({
      key: "Processing Time",
      value: Number.isFinite(durationSec) && durationSec >= 0
        ? formatCompletionCompactDuration(durationSec)
        : "--",
    });

    completionMetaEl.innerHTML = "";
    details.forEach((item, index) => {
      if (index > 0) {
        const sep = document.createElement("span");
        sep.className = "completion-meta-sep";
        sep.textContent = "|";
        completionMetaEl.appendChild(sep);
      }

      const detail = document.createElement("span");
      const keyToken = completionDetailClassToken(item.key);
      detail.className = `completion-meta-item item-key-${keyToken}${item.placeholder ? " is-placeholder" : ""}`;

      const keyEl = document.createElement("span");
      keyEl.className = `completion-meta-key completion-meta-key-${keyToken}`;
      keyEl.textContent = `${item.key}:`;

      const valueEl = document.createElement("span");
      valueEl.className = "completion-meta-value";
      valueEl.textContent = item.value;

      detail.appendChild(keyEl);
      detail.appendChild(valueEl);
      completionMetaEl.appendChild(detail);
    });

    if (details.length > 0) {
      const firstSep = document.createElement("span");
      firstSep.className = "completion-meta-sep";
      firstSep.textContent = "|";
      completionMetaEl.prepend(firstSep);
    }

    completionMetaEl.style.display = details.length ? "inline-flex" : "none";
  }

  const downloadLink = document.getElementById("downloadLink");
  if (downloadLink) {
    const outUrl = jobContract().resolveDownloadUrl ? jobContract().resolveDownloadUrl(job) : job.download_url;
    downloadLink.href = outUrl || "#";
  }
}



// User value: This step keeps the user OCR/transcription flow clear and dependable.
function updateProcessingHeader(job) {
  const header = document.getElementById("processingHeader");
  if (!header || !job) return;

  const fileName =
    (jobContract().resolveUploadedFilename ? jobContract().resolveUploadedFilename(job) : "") ||
    job.input_filename ||
    job.input_file ||
    job.filename ||
    "your file";

  header.innerHTML = "";

  const stack = document.createElement("span");
  stack.className = "processing-head-stack";

  const label = document.createElement("span");
  label.className = "processing-head-label";
  label.textContent = "Processing";

  const name = document.createElement("span");
  name.className = "processing-head-name";
  name.textContent = fileName;
  name.title = fileName;

  stack.appendChild(label);
  stack.appendChild(name);
  header.appendChild(stack);
}
