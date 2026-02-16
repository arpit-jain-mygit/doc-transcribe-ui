function parseBackendTime(value) {
  if (!value || typeof value !== "string") return null;
  if (!value.endsWith("Z") && !value.includes("+")) value += "Z";
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

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

function formatStatus(status) {
  if (!status) return "";
  return status.toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
    .replace(" — ", " ");
}

async function safeJson(res) {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { _nonJson: true, _raw: raw };
  }
}

function responseErrorMessage(res, payload, fallback) {
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
