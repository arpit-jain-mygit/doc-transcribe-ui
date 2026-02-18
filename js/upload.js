// User value: submits user files safely for OCR/transcription processing.
async function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) {
    toast("Please select a file", "error");
    return;
  }
  const picked = input.files[0];
  try {
    if (typeof runIntakePrecheckForFile === "function") {
      await runIntakePrecheckForFile(type, picked);
    }
    await upload(type, picked);
  } finally {
    clearUploadInputState(inputId);
  }
}

const OCR_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"];
const AV_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".mov", ".webm"];
const ALL_EXTENSIONS = OCR_EXTENSIONS.concat(AV_EXTENSIONS).join(",");
let UPLOAD_MODE = "OCR";
const DROPZONE_HINT_HI = "फ़ाइल चुनें या यहाँ ड्रॉप करें    ·    20 मिनट का ऑडियो/वीडियो: लगभग 2-3 मिनट    ·    PDF/Image: समय पेज संख्या और गुणवत्ता पर निर्भर";
const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000;
const IDEMPOTENCY_CACHE = Object.create(null);

// User value: supports detectModeForFile so the OCR/transcription journey stays clear and reliable.
function detectModeForFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (OCR_EXTENSIONS.some((ext) => name.endsWith(ext))) return "OCR";
  if (AV_EXTENSIONS.some((ext) => name.endsWith(ext))) return "TRANSCRIPTION";
  return UPLOAD_MODE;
}

// User value: submits user files safely for OCR/transcription processing.
function applyUploadMode(mode) {
  const next = String(mode || "").toUpperCase() === "TRANSCRIPTION" ? "TRANSCRIPTION" : "OCR";
  UPLOAD_MODE = next;

  const input = document.getElementById("unifiedFile");
  const label = document.getElementById("unifiedDropLabel");

  if (input) {
    input.dataset.autoUploadType = next;
    input.accept = ALL_EXTENSIONS;
  }
  if (label) label.textContent = DROPZONE_HINT_HI;
}

// User value: submits user files safely for OCR/transcription processing.
function clearUploadInputState(inputId = "unifiedFile") {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.value = "";
  delete input.dataset.lastAutoUploadToken;

  const name = document.getElementById("unifiedFilename");
  if (name) name.textContent = "";
  if (typeof clearIntakePrecheckView === "function") clearIntakePrecheckView();
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

// User value: submits user files safely for OCR/transcription processing.
function createUploadFormData(file, type) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  return fd;
}

// User value: submits user files safely for OCR/transcription processing.
async function normalizeUploadFile(file) {
  if (!file) return file;
  try {
    const bytes = await file.arrayBuffer();
    return new File([bytes], file.name || "upload.bin", {
      type: file.type || "application/octet-stream",
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    return file;
  }
}

// User value: submits user files safely for OCR/transcription processing.
function uploadFingerprint(type, file) {
  const t = String(type || "").toUpperCase();
  const n = String(file?.name || "").trim();
  const s = String(Number(file?.size || 0));
  const m = String(Number(file?.lastModified || 0));
  return `${t}|${n}|${s}|${m}`;
}

// User value: loads latest OCR/transcription data so users see current status.
function getUploadIdempotencyKey(type, file) {
  const fp = uploadFingerprint(type, file);
  const now = Date.now();
  const cached = IDEMPOTENCY_CACHE[fp];
  if (cached && (now - cached.ts) <= IDEMPOTENCY_WINDOW_MS) {
    return cached.key;
  }
  const key = `idem_${now}_${Math.random().toString(36).slice(2, 10)}`;
  IDEMPOTENCY_CACHE[fp] = { key, ts: now };
  return key;
}

// User value: supports estimateProcessingHint so the OCR/transcription journey stays clear and reliable.
function estimateProcessingHint(type, file, mediaDurationSec = null) {
  const sizeMb = Math.max(0, Number(file?.size || 0) / (1024 * 1024));
  if (String(type).toUpperCase() === "TRANSCRIPTION") {
    if (Number.isFinite(mediaDurationSec) && mediaDurationSec > 0) {
      const mins = Math.max(1, Math.round(mediaDurationSec / 60));
      return `अनुमानित समय: ${mins} मिनट मीडिया के लिए लगभग ${Math.max(1, Math.round(mins * 0.15))}-${Math.max(2, Math.round(mins * 0.25))} मिनट।`;
    }
    return "अनुमानित समय: ऑडियो/वीडियो की अवधि पर निर्भर (आमतौर पर 15-25%).";
  }
  const bands = sizeMb <= 2 ? "1-2" : sizeMb <= 10 ? "2-4" : "4-8";
  return `अनुमानित समय: PDF/Image के लिए लगभग ${bands} मिनट (गुणवत्ता/पेज पर निर्भर)।`;
}

// User value: clears pre-upload precheck hints so users always see relevant guidance for current file.
function clearIntakePrecheckView() {
  const box = document.getElementById("intakePrecheckBox");
  const summary = document.getElementById("intakePrecheckSummary");
  const warnings = document.getElementById("intakePrecheckWarnings");
  if (summary) summary.textContent = "";
  if (warnings) warnings.innerHTML = "";
  if (box) box.style.display = "none";
}

// User value: renders route/warning/ETA hints before upload so users can make better submission decisions.
function renderIntakePrecheckView(precheck) {
  const box = document.getElementById("intakePrecheckBox");
  const summary = document.getElementById("intakePrecheckSummary");
  const warnings = document.getElementById("intakePrecheckWarnings");
  if (!box || !summary || !warnings) return;

  const detected = String(precheck?.detected_job_type || "UNKNOWN");
  const etaSec = Number(precheck?.eta_sec || 0);
  const etaMin = etaSec > 0 ? Math.max(1, Math.round(etaSec / 60)) : null;
  summary.textContent = etaMin
    ? `सुझाव: ${detected} • अनुमानित समय: लगभग ${etaMin} मिनट`
    : `सुझाव: ${detected}`;

  warnings.innerHTML = "";
  const items = Array.isArray(precheck?.warnings) ? precheck.warnings : [];
  items.forEach((w) => {
    const li = document.createElement("li");
    li.textContent = String(w?.message || "");
    warnings.appendChild(li);
  });

  box.style.display = (summary.textContent || items.length) ? "block" : "none";
}

// User value: runs precheck safely before upload so users get guidance without blocking current upload flow.
async function runIntakePrecheckForFile(type, file) {
  clearIntakePrecheckView();
  if (!window.ApiClient || typeof window.ApiClient.precheckIntake !== "function") return;
  if (typeof window.isSmartIntakeEnabled === "function" && !window.isSmartIntakeEnabled()) {
    if (typeof window.ApiClient.refreshSmartIntakeCapability === "function") {
      try {
        await window.ApiClient.refreshSmartIntakeCapability();
      } catch {}
    }
    if (!window.isSmartIntakeEnabled()) return;
  }

  const mediaDurationSec = await getMediaDurationSec(file);
  const payload = {
    filename: String(file?.name || ""),
    mime_type: String(file?.type || ""),
    file_size_bytes: Number(file?.size || 0),
    media_duration_sec: Number.isFinite(mediaDurationSec) ? Math.round(mediaDurationSec) : null,
    pdf_page_count: null,
  };

  try {
    const { res, data } = await window.ApiClient.precheckIntake(payload, {
      requestId: window.ACTIVE_REQUEST_ID || "",
    });
    if (!res || !res.ok || !data || data._nonJson) return;
    renderIntakePrecheckView(data);
  } catch {
    // Best-effort UX enhancement; upload flow should not be blocked on precheck.
  }
}

// User value: shows clear processing timing so users can set expectations.
async function getMediaDurationSec(file) {
  if (!file) return null;
  const name = String(file.name || "").toLowerCase();
  const isMedia = AV_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!isMedia) return null;
  return new Promise((resolve) => {
    const el = document.createElement("audio");
    el.preload = "metadata";
    const url = URL.createObjectURL(file);
    // User value: supports cleanup so the OCR/transcription journey stays clear and reliable.
    const cleanup = () => {
      try { URL.revokeObjectURL(url); } catch {}
      el.src = "";
      el.remove();
    };
    el.onloadedmetadata = () => {
      const d = Number(el.duration);
      cleanup();
      resolve(Number.isFinite(d) && d > 0 ? d : null);
    };
    el.onerror = () => {
      cleanup();
      resolve(null);
    };
    el.src = url;
  });
}

// User value: submits user files safely for OCR/transcription processing.
function uploadViaXhr(url, token, formData, requestId = "", idempotencyKey = "", extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.setRequestHeader("X-Request-ID", resolveRequestId(requestId));
    if (idempotencyKey) {
      xhr.setRequestHeader("X-Idempotency-Key", idempotencyKey);
    }
    Object.entries(extraHeaders || {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") {
        xhr.setRequestHeader(String(k), String(v));
      }
    });
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
        requestId: xhr.getResponseHeader("X-Request-ID") || "",
      });
    };

    xhr.onerror = () => reject(new Error("xhr_upload_failed"));
    xhr.ontimeout = () => reject(new Error("xhr_upload_timeout"));

    xhr.send(formData);
  });
}

// User value: supports isLikelyInAppBrowser so the OCR/transcription journey stays clear and reliable.
function isLikelyInAppBrowser() {
  const ua = String(navigator.userAgent || "");
  return /FBAN|FBAV|Instagram|Line|LinkedInApp|Snapchat|Twitter|wv\)|; wv\)/i.test(ua);
}

// User value: supports isMobileBrowser so the OCR/transcription journey stays clear and reliable.
function isMobileBrowser() {
  const ua = String(navigator.userAgent || "");
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

// User value: submits user files safely for OCR/transcription processing.
function resetAfterUploadError() {
  if (typeof stopPolling === "function") stopPolling();
  if (typeof stopThoughts === "function") stopThoughts();

  window.POLLING_ACTIVE = false;
  window.JOB_COMPLETED = false;
  JOB_ID = null;
  window.ACTIVE_JOB_TYPE = null;
  window.ACTIVE_REQUEST_ID = null;
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

// User value: submits user files safely for OCR/transcription processing.
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
  const uploadRequestId = resolveRequestId(generateRequestId());
  const uploadFile = await normalizeUploadFile(file);
  const mediaDurationSec = await getMediaDurationSec(uploadFile);
  const idempotencyKey = getUploadIdempotencyKey(type, uploadFile);
  window.ACTIVE_REQUEST_ID = uploadRequestId;
  LAST_UPLOADED_FILENAME = uploadFile.name;

  setUIBusy(true);
  document.body.classList.add("processing-active");

  if (typeof bootstrapProgress === "function") {
    bootstrapProgress("Uploading file…", 5);
  }
  if (window.FEATURE_COST_HINTS) {
    toast(estimateProcessingHint(type, uploadFile, mediaDurationSec), "info");
  }

  const header = document.getElementById("processingHeader");
  if (header) header.textContent = `PROCESSING ${file.name}`;

  let res;
  const preferXhrPrimary = isMobileBrowser() && !isLikelyInAppBrowser();
  try {
    if (preferXhrPrimary) {
      const xhrRes = await uploadViaXhr(
        `${API}/upload`,
        ID_TOKEN,
        createUploadFormData(uploadFile, type),
        uploadRequestId,
        idempotencyKey,
        { "X-Media-Duration-Sec": mediaDurationSec ?? "" }
      );
      if (xhrRes.ok && xhrRes.data && !xhrRes.data._nonJson && xhrRes.data.job_id) {
        JOB_ID = xhrRes.data.job_id;
        window.ACTIVE_REQUEST_ID = String(xhrRes.data.request_id || xhrRes.requestId || uploadRequestId || "").trim();
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
      const fd = createUploadFormData(uploadFile, type);
      const reqHeaders = authHeadersWithRequestId({ requestId: uploadRequestId, includeAuth: true }).headers;
      reqHeaders["X-Idempotency-Key"] = idempotencyKey;
      if (Number.isFinite(mediaDurationSec) && mediaDurationSec > 0) {
        reqHeaders["X-Media-Duration-Sec"] = String(Math.round(mediaDurationSec));
      }
      res = await fetch(`${API}/upload`, {
        method: "POST",
        headers: reqHeaders,
        body: fd
      });
    }
  } catch (err) {
    try {
      const xhrRes = await uploadViaXhr(
        `${API}/upload`,
        ID_TOKEN,
        createUploadFormData(uploadFile, type),
        uploadRequestId,
        idempotencyKey,
        { "X-Media-Duration-Sec": mediaDurationSec ?? "" }
      );
      if (xhrRes.ok && xhrRes.data && !xhrRes.data._nonJson && xhrRes.data.job_id) {
        JOB_ID = xhrRes.data.job_id;
        window.ACTIVE_REQUEST_ID = String(xhrRes.data.request_id || xhrRes.requestId || uploadRequestId || "").trim();
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
          headers: authHeadersWithRequestId({ requestId: uploadRequestId, includeAuth: true }).headers,
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
          headers: authHeadersWithRequestId({ requestId: uploadRequestId, includeAuth: true }).headers,
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
  window.ACTIVE_REQUEST_ID = String(data.request_id || res.headers.get("X-Request-ID") || uploadRequestId || "").trim();
  localStorage.setItem("active_job_id", JOB_ID);

  startPolling();
}

// User value: lets users fetch generated OCR/transcription output reliably.
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
