function setUIBusy(isBusy) {
  UI_BUSY = isBusy;

  document
    .querySelectorAll("button:not(.logout-link):not(#cancelJobBtn), input[type='file'], a.history-download")
    .forEach(el => {
      el.disabled = isBusy;
      el.style.pointerEvents = isBusy ? "none" : "auto";
      el.style.opacity = isBusy ? "0.6" : "1";
    });

  document.querySelectorAll(".drop-zone").forEach(z => {
    z.classList.toggle("disabled", isBusy);
  });
}

function showLoggedInUI() {
  document.body.classList.add("logged-in");   // ✅ ADD THIS

  const userProfile = document.getElementById("userProfile");
  const authBox = document.getElementById("authBox");
  const userEmail = document.getElementById("userEmail");
  const userAvatar = document.getElementById("userAvatar");

  if (authBox) authBox.style.display = "none";
  if (userProfile) userProfile.style.display = "flex";

  if (userEmail) userEmail.textContent = USER_EMAIL || "";
  if (userAvatar) {
    userAvatar.src = "https://www.gravatar.com/avatar?d=mp";
  }
}


function showLoggedOutUI() {
  document.body.classList.remove("logged-in"); // ✅ ADD THIS

  const userProfile = document.getElementById("userProfile");
  const authBox = document.getElementById("authBox");

  if (userProfile) userProfile.style.display = "none";
  if (authBox) authBox.style.display = "block";
}


function toast(message, type = "info") {
  const box = document.getElementById("toasts");
  if (!box) return;

  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = message;
  box.appendChild(div);

  setTimeout(() => div.remove(), 4000);
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
  const target = document.getElementById("historySection");
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
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

  if (job.input_file) {
    header.textContent = `PROCESSING ${job.input_file}`;
  }
}
