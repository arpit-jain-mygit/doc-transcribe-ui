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

function setupDownload(downloadUrl, filename) {
  const link = document.getElementById("downloadLink");
  if (!link || !downloadUrl) return;

  // Make link look enabled
  link.style.pointerEvents = "auto";
  link.style.opacity = "1";
  link.href = "javascript:void(0)";

  link.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: "Bearer " + ID_TOKEN
        }
      });

      if (!res.ok) {
        throw new Error("Download failed: " + res.status);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "download";
      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error", err);
      toast("Download failed. Please try again.", "error");
    }
  };
}
