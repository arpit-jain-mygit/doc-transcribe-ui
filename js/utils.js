// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
function parseBackendTime(value) {
  if (!value || typeof value !== "string") return null;
  if (!value.endsWith("Z") && !value.includes("+")) value += "Z";
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function formatDate(value) {
  const d = parseBackendTime(value);
  if (!d) return "";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }) + " IST";
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function formatRelativeTime(value) {
  const past = parseBackendTime(value);
  if (!past) return "";
  let diff = Date.now() - past;
  if (diff < 0) diff = 0;
  const sec = Math.floor(diff / 1000);
  if (sec < 30) return "Just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function formatStatus(status) {
  if (!status) return "";
  return status.toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(" — ", " ");
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
async function safeJson(res) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { _nonJson: true, _raw: raw };
  }
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function generateRequestId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return `req-${window.crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(16).slice(2, 10);
  return `req-${Date.now().toString(16)}-${rand}`;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function resolveRequestId(preferred = "") {
  const direct = String(preferred || "").trim();
  if (direct) return direct;
  const active = String(window.ACTIVE_REQUEST_ID || "").trim();
  if (active) return active;
  const next = generateRequestId();
  window.ACTIVE_REQUEST_ID = next;
  return next;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function authHeadersWithRequestId({ requestId = "", includeAuth = true } = {}) {
  const headers = {};
  if (includeAuth && ID_TOKEN) {
    headers.Authorization = "Bearer " + ID_TOKEN;
  }
  const resolved = resolveRequestId(requestId);
  headers["X-Request-ID"] = resolved;
  return { headers, requestId: resolved };
}

window.generateRequestId = generateRequestId;
window.resolveRequestId = resolveRequestId;
window.authHeadersWithRequestId = authHeadersWithRequestId;

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function responseErrorMessage(res, payload, fallback) {
  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  const normalizeAuthError = (msg) => {
    const text = String(msg || "").toLowerCase();
    if (text.includes("invalid google token") || text.includes("invalid token")) {
      return "Session expired. Please sign in again.";
    }
    return msg;
  };

  if (payload && typeof payload === "object" && !payload._nonJson) {
    const message = payload.detail || payload.error || payload.message || fallback;
    return normalizeAuthError(message) || fallback;
  }
  if (payload && payload._nonJson) {
    return `${fallback}: server returned non-JSON response (${res.status})`;
  }
  return fallback;
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
function getJobFailureMessage(data) {
  if (!data || typeof data !== "object") {
    return "Processing failed. Please try again.";
  }

  const code = String(data.error_code || "").trim().toUpperCase();
  const message = String(data.error_message || data.error || "").trim();

  if (message) return message;

  if (code === "RATE_LIMIT_EXCEEDED") return "Service is busy right now. Please retry in a few minutes.";
  if (code === "MEDIA_DECODE_FAILED") return "Input media could not be decoded. Please upload a supported file.";
  if (code === "INPUT_NOT_FOUND") return "Input file was not found for processing.";
  if (code === "INFRA_REDIS") return "Queue service is temporarily unavailable.";
  if (code === "CANCELLED_BY_USER") return "Job was cancelled.";
  if (code) return `Processing failed (${code}).`;

  const stage = String(data.stage || "").trim();
  if (stage) return stage;
  return "Processing failed. Please try again.";
}
