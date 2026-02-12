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
  if (payload && typeof payload === "object" && !payload._nonJson) {
    return payload.detail || payload.error || payload.message || fallback;
  }
  if (payload && payload._nonJson) {
    return `${fallback}: server returned non-JSON response (${res.status})`;
  }
  return fallback;
}
