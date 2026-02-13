async function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) {
    toast("Please select a file", "error");
    return;
  }
  const picked = input.files[0];
  try {
    await upload(type, picked);
  } finally {
    clearUploadInputState(inputId);
  }
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

function createUploadFormData(file, type) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  return fd;
}

function uploadViaXhr(url, token, formData) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.responseType = "text";
    xhr.timeout = 240000;

    xhr.onload = () => {
      let data = null;
      const raw = xhr.responseText || "";
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { _nonJson: true, _raw: raw };
        }
      }
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        data,
      });
    };

    xhr.onerror = () => reject(new Error("xhr_upload_failed"));
    xhr.ontimeout = () => reject(new Error("xhr_upload_timeout"));

    xhr.send(formData);
  });
}

function isLikelyInAppBrowser() {
  const ua = String(navigator.userAgent || "");
  return /FBAN|FBAV|Instagram|Line|LinkedInApp|Snapchat|Twitter|wv\)|; wv\)/i.test(ua);
}

function isMobileBrowser() {
  const ua = String(navigator.userAgent || "");
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

function resetAfterUploadError() {
  if (typeof stopPolling === "function") stopPolling();
  if (typeof stopThoughts === "function") stopThoughts();

  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = false;
  JOB_ID = null;
  window.ACTIVE_JOB_TYPE = null;
  localStorage.removeItem("active_job_id");

  document.body.classList.remove("processing-active");

  const statusBox = document.getElementById("statusBox");
  if (statusBox) statusBox.style.display = "none";

  const cancelBtn = document.getElementById("cancelJobBtn");
  if (cancelBtn) cancelBtn.disabled = true;

  const progress = document.getElementById("progress");
  if (progress) progress.value = 0;

  const stage = document.getElementById("stage");
  if (stage) {
    stage.textContent = "";
    stage.classList.remove("error");
  }

  if (typeof setUIBusy === "function") setUIBusy(false);
}

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

  let res;
  const preferXhrPrimary = isMobileBrowser() && !isLikelyInAppBrowser();
  try {
    if (preferXhrPrimary) {
      const xhrRes = await uploadViaXhr(`${API}/upload`, ID_TOKEN, createUploadFormData(file, type));
      if (xhrRes.ok && xhrRes.data && !xhrRes.data._nonJson && xhrRes.data.job_id) {
        JOB_ID = xhrRes.data.job_id;
        localStorage.setItem("active_job_id", JOB_ID);
        startPolling();
        return;
      }
      if (xhrRes.ok) {
        toast("Upload failed: invalid server response", "error");
        resetAfterUploadError();
        return;
      }
      res = {
        ok: false,
        status: xhrRes.status,
        _fromXhr: true,
        _payload: xhrRes.data || null,
      };
    } else {
      const fd = createUploadFormData(file, type);
      res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: { Authorization: "Bearer " + ID_TOKEN },
        body: fd
      });
    }
  } catch (err) {
    try {
      const xhrRes = await uploadViaXhr(`${API}/upload`, ID_TOKEN, createUploadFormData(file, type));
      if (xhrRes.ok && xhrRes.data && !xhrRes.data._nonJson && xhrRes.data.job_id) {
        JOB_ID = xhrRes.data.job_id;
        localStorage.setItem("active_job_id", JOB_ID);
        startPolling();
        return;
      }
      if (!xhrRes.ok) {
        toast(
          responseErrorMessage({ status: xhrRes.status }, xhrRes.data, "Upload failed"),
          "error"
        );
        resetAfterUploadError();
        return;
      }
    } catch {
      // Fall through to diagnostics below.
    }

    const isHostedUi = /\.vercel\.app$/i.test(window.location.hostname);
    const inLocalMode = typeof getApiMode === "function" && getApiMode() === "local";
    const sizeMb = (file?.size || 0) / (1024 * 1024);
    const errMsg = String(err?.message || "").toLowerCase();
    let apiReachable = false;
    let authReachable = false;
    let authUnauthorized = false;
    let uploadProbeReachable = false;
    let uploadProbeStatus = 0;

    try {
      const healthRes = await fetch(`${API}/health`, { method: "GET" });
      apiReachable = healthRes.ok;
    } catch {
      apiReachable = false;
    }

    if (apiReachable && ID_TOKEN) {
      try {
        const authRes = await fetch(`${API}/jobs?limit=1&offset=0`, {
          method: "GET",
          headers: { Authorization: "Bearer " + ID_TOKEN },
        });
        authReachable = authRes.ok;
        authUnauthorized = authRes.status === 401;
      } catch {
        authReachable = false;
      }
    }

    if (apiReachable && authReachable && ID_TOKEN) {
      try {
        const probeFd = new FormData();
        probeFd.append("type", "OCR");
        const probeRes = await fetch(`${API}/upload`, {
          method: "POST",
          headers: { Authorization: "Bearer " + ID_TOKEN },
          body: probeFd,
        });
        uploadProbeReachable = true;
        uploadProbeStatus = probeRes.status;
      } catch {
        uploadProbeReachable = false;
      }
    }

    if (isHostedUi && inLocalMode) {
      toast("Upload failed: hosted UI cannot use local API mode. Switch to render mode.", "error");
    } else if (authUnauthorized) {
      toast("Upload failed: session expired. Please sign in again and retry.", "error");
    } else if (apiReachable && authReachable && !uploadProbeReachable) {
      toast("Upload failed: POST /upload is blocked before reaching API (browser/CORS/network policy).", "error");
    } else if (apiReachable && authReachable && uploadProbeReachable) {
      if (uploadProbeStatus === 413) {
        toast("Upload failed: request body too large for current network/API limits.", "error");
      } else if (uploadProbeStatus >= 500) {
        toast("Upload failed: upload route is reachable but server returned an internal error.", "error");
      } else if (isLikelyInAppBrowser()) {
        toast("Upload failed in in-app browser. Please open this link in Safari/Chrome and retry.", "error");
      } else if (isMobileBrowser()) {
        toast("Upload failed on mobile during file transfer. Please retry once; if it repeats, switch network (Wi-Fi/mobile data).", "error");
      } else {
        toast("Upload failed: upload route is reachable. Likely file body transfer/network interruption on this device.", "error");
      }
    } else if (apiReachable) {
      toast("Upload failed: API is reachable but authenticated request failed. Please re-login and retry.", "error");
    } else if (sizeMb > 80) {
      toast(`Upload failed on network. File is ${sizeMb.toFixed(1)} MB; try a smaller file or more stable network.`, "error");
    } else if (errMsg.includes("failed to fetch")) {
      toast("Upload failed: unable to reach API endpoint from this browser/session. Please retry and check API status.", "error");
    } else {
      toast("Network error during upload", "error");
    }
    resetAfterUploadError();
    return;
  }

  if (!res.ok) {
    const payload = res._fromXhr ? (res._payload || null) : await safeJson(res);
    toast(responseErrorMessage(res, payload, "Upload failed"), "error");
    resetAfterUploadError();
    return;
  }

  const data = await safeJson(res);
  if (!data || data._nonJson || !data.job_id) {
    toast("Upload failed: invalid server response", "error");
    resetAfterUploadError();
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
