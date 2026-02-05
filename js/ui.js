function setUIBusy(isBusy) {
  UI_BUSY = isBusy;

  document
    .querySelectorAll("button:not(.logout-link), input[type='file'], a.history-download")
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
  const card = document.getElementById("completionCard");
  if (!card) return;

  card.style.display = "block";

  document.getElementById("sourceType").textContent =
    job.source === "youtube" ? "YouTube URL" : "File";

  if (job.source === "youtube") {
    document.getElementById("uploadedFileRow").style.display = "none";
    document.getElementById("uploadedUrlRow").style.display = "flex";
    document.getElementById("uploadedUrl").href = job.url;
    document.getElementById("uploadedUrl").textContent = job.url;
  } else {
    document.getElementById("uploadedFileRow").style.display = "flex";
    document.getElementById("uploadedUrlRow").style.display = "none";
    document.getElementById("uploadedFile").textContent =
      job.input_file || "";
  }

  document.getElementById("generatedFile").textContent =
    job.output_file || "";

  document.getElementById("downloadLink").href =
    job.download_url || "#";
}
