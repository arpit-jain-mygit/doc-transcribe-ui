function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) {
    toast("Please select a file", "error");
    return;
  }
  const picked = input.files[0];
  upload(type, picked);
  clearUploadInputState(inputId);
}

const OCR_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"];
const AV_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".mov", ".webm"];
const ALL_EXTENSIONS = OCR_EXTENSIONS.concat(AV_EXTENSIONS).join(",");
let UPLOAD_MODE = "OCR";

function detectModeForFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (OCR_EXTENSIONS.some((ext) => name.endsWith(ext))) return "OCR";
  if (AV_EXTENSIONS.some((ext) => name.endsWith(ext))) return "TRANSCRIPTION";
  return UPLOAD_MODE;
}

function applyUploadMode(mode) {
  const next = String(mode || "").toUpperCase() === "TRANSCRIPTION" ? "TRANSCRIPTION" : "OCR";
  UPLOAD_MODE = next;

  const input = document.getElementById("unifiedFile");
  const label = document.getElementById("unifiedDropLabel");

  if (input) {
    input.dataset.autoUploadType = next;
    input.accept = ALL_EXTENSIONS;
  }
  if (label) label.textContent = "Files start processing automatically after selection.";
}

function clearUploadInputState(inputId = "unifiedFile") {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = "";
  delete input.dataset.lastAutoUploadToken;

  const name = document.getElementById("unifiedFilename");
  if (name) name.textContent = "";
}

window.clearUploadInputState = clearUploadInputState;

window.autoselectUploadModeForFile = function autoselectUploadModeForFile(file) {
  const detected = detectModeForFile(file);
  applyUploadMode(detected);
  return detected;
};

window.initUnifiedUpload = function initUnifiedUpload() {
  applyUploadMode(UPLOAD_MODE);
};

async function upload(type, file) {
  if (JOB_ID && !window.JOB_COMPLETED) {
    toast("A job is already running", "info");
    return;
  }

  if (!ID_TOKEN) {
    toast("Please sign in first", "error");
    return;
  }

  if (IS_PENDING) {
    toast("Account pending approval", "info");
    return;
  }

  window.JOB_COMPLETED = false;
  JOB_ID = null;
  window.ACTIVE_JOB_TYPE = String(type || "").toUpperCase();
  LAST_UPLOADED_FILENAME = file.name;

  setUIBusy(true);
  document.body.classList.add("processing-active");

  if (typeof bootstrapProgress === "function") {
    bootstrapProgress("Uploading file…", 5);
  }

  const header = document.getElementById("processingHeader");
  if (header) header.textContent = `PROCESSING ${file.name}`;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);

  let res;
  try {
    res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ID_TOKEN },
      body: fd
    });
  } catch (err) {
    const isHostedUi = /\.vercel\.app$/i.test(window.location.hostname);
    const inLocalMode = typeof getApiMode === "function" && getApiMode() === "local";
    const sizeMb = (file?.size || 0) / (1024 * 1024);
    const errMsg = String(err?.message || "").toLowerCase();
    let apiReachable = false;

    try {
      const healthRes = await fetch(`${API}/health`, { method: "GET" });
      apiReachable = healthRes.ok;
    } catch {
      apiReachable = false;
    }

    if (isHostedUi && inLocalMode) {
      toast("Upload failed: hosted UI cannot use local API mode. Switch to render mode.", "error");
    } else if (apiReachable) {
      toast("Upload failed: API is reachable, but upload request was blocked (auth/CORS/browser policy). Please re-login and retry.", "error");
    } else if (sizeMb > 80) {
      toast(`Upload failed on network. File is ${sizeMb.toFixed(1)} MB; try a smaller file or more stable network.`, "error");
    } else if (errMsg.includes("failed to fetch")) {
      toast("Upload failed: unable to reach API endpoint from this browser/session. Please retry and check API status.", "error");
    } else {
      toast("Network error during upload", "error");
    }
    setUIBusy(false);
    return;
  }

  if (!res.ok) {
    const payload = await safeJson(res);
    toast(responseErrorMessage(res, payload, "Upload failed"), "error");
    setUIBusy(false);
    return;
  }

  const data = await safeJson(res);
  if (!data || data._nonJson || !data.job_id) {
    toast("Upload failed: invalid server response", "error");
    setUIBusy(false);
    return;
  }
  JOB_ID = data.job_id;
  localStorage.setItem("active_job_id", JOB_ID);

  startPolling();
}

function forceDownload(url, filename) {
  if (!filename) {
    throw new Error("forceDownload called without filename");
  }

  try {
    const resolved = new URL(url, window.location.href);
    const isSameOrigin = resolved.origin === window.location.origin;

    if (!isSameOrigin) {
      // Cross-origin signed URLs cannot be fetched due to CORS.
      // Navigate directly; API will set attachment headers.
      window.location.assign(resolved.href);
      return;
    }

    fetch(resolved.href)
      .then(res => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      })
      .catch(e => {
        console.error("forceDownload failed", e);
        window.open(resolved.href, "_blank", "noopener,noreferrer");
      });
  } catch (e) {
    console.error("forceDownload failed", e);
  }
}
