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

function getDisplayName(email) {
  const raw = String(email || "").trim();
  if (!raw) return "Account";
  return raw.split("@")[0] || raw;
}

function getAvatarInitials(email) {
  const base = String(email || "").split("@")[0].replace(/[^a-zA-Z0-9]+/g, " ").trim();
  if (!base) return "U";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

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
};

window.initWorkspaceView = function initWorkspaceView() {
  window.setWorkspaceView("conversion", { loadHistory: false });
};

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

  setTimeout(() => div.remove(), 4300);
}

function showPending() {
  IS_PENDING = true;
  const banner = document.getElementById("approvalBanner");
  if (banner) banner.style.display = "block";

  document.querySelectorAll(".drop-zone")
    .forEach(z => z.classList.add("disabled"));
}

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
function formatCompletionMediaDuration(secondsRaw) {
  const total = Number(secondsRaw);
  if (!Number.isFinite(total) || total < 0) return "";

  const rounded = Math.round(total);
  const hours = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getCompletionTranscriptionMediaDuration(job) {
  const candidates = [
    job.media_duration_sec,
    job.input_duration_sec,
    job.audio_duration_sec,
    job.video_duration_sec,
    job.source_duration_sec,
    job.duration_sec,
  ];
  for (const candidate of candidates) {
    const text = formatCompletionMediaDuration(candidate);
    if (text) return text;
  }
  return "";
}

function formatCompletionJobTypeLabel(job) {
  const jobType = String(job?.job_type || "").toUpperCase();
  if (jobType === "OCR") return "PDF / Image to Hindi Text";
  if (jobType === "TRANSCRIPTION") return "Video / Audio to Hindi Text";
  return job?.job_type || "";
}

function getCompletionJobTypeThemeClass(job) {
  const jobType = String(job?.job_type || "").toUpperCase();
  if (jobType === "OCR") return "completion-job-type-ocr";
  if (jobType === "TRANSCRIPTION") return "completion-job-type-transcription";
  return "completion-job-type-neutral";
}

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
    uploadedFileEl.textContent = (job.input_filename || job.input_file || LAST_UPLOADED_FILENAME || "-");
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

    const isTranscription = String(job.job_type || "").toUpperCase() === "TRANSCRIPTION";
    const isOcr = String(job.job_type || "").toUpperCase() === "OCR";

    const bytes = Number(job.input_size_bytes);
    const hasSize = Number.isFinite(bytes) && bytes > 0;
    details.push({
      key: "Size",
      value: hasSize ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "--",
      placeholder: !hasSize,
    });

    if (isOcr) {
      const pages = Number(job.total_pages);
      if (Number.isFinite(pages) && pages > 0) {
        details.push({
          key: "Pages",
          value: `${pages}`,
        });
      }
    }

    const durationSec = Number(job.duration_sec);
    if (Number.isFinite(durationSec) && durationSec >= 0) {
      const rounded = Math.round(durationSec);
      const hrs = Math.floor(rounded / 3600);
      const mins = Math.floor((rounded % 3600) / 60);
      const secs = rounded % 60;
      details.push({
        key: "Time",
        value: hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : (mins > 0 ? `${mins}m ${secs}s` : `${secs}s`),
      });
    }

    completionMetaEl.innerHTML = "";
    details.forEach((item, index) => {
      if (index > 0) {
        const sep = document.createElement("span");
        sep.className = "completion-meta-sep";
        sep.textContent = "|";
        completionMetaEl.appendChild(sep);
      }

      const detail = document.createElement("span");
      detail.className = `completion-meta-item item-key-${String(item.key).toLowerCase()}${item.placeholder ? " is-placeholder" : ""}`;

      const keyEl = document.createElement("span");
      keyEl.className = `completion-meta-key completion-meta-key-${String(item.key).toLowerCase()}`;
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
    downloadLink.href = job.download_url || "#";
  }
}



function updateProcessingHeader(job) {
  const header = document.getElementById("processingHeader");
  if (!header || !job) return;

  const fileName =
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
