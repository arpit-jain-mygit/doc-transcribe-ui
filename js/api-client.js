// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
function ensureApiClientRequestId(requestId) {
  if (typeof resolveRequestId === "function") return resolveRequestId(requestId);
  return String(requestId || "").trim();
}

// User value: This step keeps the user OCR/transcription flow clear and dependable.
async function apiClientFetchJson(path, options = {}) {
  const {
    method = "GET",
    requestId = "",
    includeAuth = true,
    body,
    headers = {},
  } = options;

  const rid = ensureApiClientRequestId(requestId);
  const auth = typeof authHeadersWithRequestId === "function"
    ? authHeadersWithRequestId({ requestId: rid, includeAuth })
    : { headers: {} };

  const reqHeaders = { ...(auth.headers || {}), ...(headers || {}) };
  const finalPath = String(path || "");
  const url = finalPath.startsWith("http") ? finalPath : `${API}${finalPath}`;

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body,
  });
  const data = typeof safeJson === "function" ? await safeJson(res) : null;

  return { res, data, requestId: rid };
}

window.ApiClient = {
  fetchJson: apiClientFetchJson,
  getStatus(jobId, { requestId = "" } = {}) {
    return apiClientFetchJson(`/status/${jobId}`, {
      method: "GET",
      includeAuth: true,
      requestId,
    });
  },
  cancelJob(jobId, { requestId = "" } = {}) {
    return apiClientFetchJson(`/jobs/${jobId}/cancel`, {
      method: "POST",
      includeAuth: true,
      requestId,
    });
  },
  retryJob(jobId, { requestId = "" } = {}) {
    return apiClientFetchJson(`/jobs/${jobId}/retry`, {
      method: "POST",
      includeAuth: true,
      requestId,
    });
  },
  getJobs(url, { requestId = "" } = {}) {
    return apiClientFetchJson(url, {
      method: "GET",
      includeAuth: true,
      requestId,
    });
  },
};
