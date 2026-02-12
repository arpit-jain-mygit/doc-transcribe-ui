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

// COMPLETION RENDER (FILE + YOUTUBE READY)
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
    uploadedFileEl.textContent =
      job.source === "youtube" && (job.url || job.video_url)
        ? (job.url || job.video_url)
        : (job.input_filename || job.input_file || LAST_UPLOADED_FILENAME || "-");
  }

  const completionMetaEl = document.getElementById("completionMeta");
  if (completionMetaEl) {
    const details = [];

    const isTranscription = String(job.job_type || "").toUpperCase() === "TRANSCRIPTION";
    const isOcr = String(job.job_type || "").toUpperCase() === "OCR";

    if (isTranscription) {
      const bytes = Number(job.input_size_bytes);
      if (Number.isFinite(bytes) && bytes > 0) {
        details.push(`${(bytes / (1024 * 1024)).toFixed(2)} MB`);
      }
    }

    if (isOcr) {
      const pages = Number(job.total_pages);
      if (Number.isFinite(pages) && pages > 0) {
        details.push(`${pages} page${pages === 1 ? "" : "s"}`);
      }
    }

    const durationSec = Number(job.duration_sec);
    if (Number.isFinite(durationSec) && durationSec >= 0) {
      const mins = Math.floor(durationSec / 60);
      const secs = Math.round(durationSec % 60);
      details.push(`${mins}m ${secs}s`);
    }

    completionMetaEl.textContent = details.join(" • ");
    completionMetaEl.style.display = details.length ? "block" : "none";
  }

  const downloadLink = document.getElementById("downloadLink");
  if (downloadLink) {
    downloadLink.href = job.download_url || "#";
  }
}



function updateProcessingHeader(job) {
  const header = document.getElementById("processingHeader");
  if (!header || !job) return;

  if (job.source === "youtube") {
    header.textContent = "PROCESSING YouTube URL";
  } else if (job.input_file) {
    header.textContent = `PROCESSING ${job.input_file}`;
  }
}
