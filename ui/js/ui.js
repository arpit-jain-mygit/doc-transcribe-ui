function setUIBusy(isBusy) {
  UI_BUSY = isBusy;

  // ⚠️ DO NOT disable auth UI
  document.querySelectorAll(
    "button:not(.logout-link):not(#google-signin-btn button), input[type='file'], a.history-download"
  ).forEach(el => {
    el.disabled = isBusy;
    el.style.pointerEvents = isBusy ? "none" : "auto";
    el.style.opacity = isBusy ? "0.6" : "1";
  });

  document.querySelectorAll(".drop-zone").forEach(z => {
    z.classList.toggle("disabled", isBusy);
  });
}


function showLoggedInUI() {
  userProfile.style.display = "flex";
  authBox.style.display = "none";
}

function showLoggedOutUI() {
  userProfile.style.display = "none";
  authBox.style.display = "flex";
}

function toast(message, type = "info") {
  const box = document.getElementById("toasts");
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.textContent = message;
  box.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

function showPending() {
  IS_PENDING = true;
  approvalBanner.style.display = "block";
  document.querySelectorAll(".drop-zone").forEach(z => z.classList.add("disabled"));
}

function hidePending() {
  IS_PENDING = false;
  approvalBanner.style.display = "none";
  document.querySelectorAll(".drop-zone").forEach(z => z.classList.remove("disabled"));
}

function getStatusBox() {
  return document.getElementById("statusBox");
}
function getDownloadBox() {
  return document.getElementById("downloadBox");
}

function setupDownload(downloadUrl, filename = "transcript.txt") {
  const downloadLink = document.getElementById("downloadLink");

  if (!downloadUrl) {
    downloadLink.onclick = null;
    return;
  }

  downloadLink.onclick = (e) => {
    e.preventDefault();
    forceDownload(downloadUrl, filename);
  };
}
