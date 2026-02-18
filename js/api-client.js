// User value: supports ensureApiClientRequestId so the OCR/transcription journey stays clear and reliable.
function ensureApiClientRequestId(requestId) {
  if (typeof resolveRequestId === "function") return resolveRequestId(requestId);
  return String(requestId || "").trim();
}

// User value: supports apiClientFetchJson so the OCR/transcription journey stays clear and reliable.
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
  precheckIntake(payload, { requestId = "" } = {}) {
    return apiClientFetchJson("/intake/precheck", {
      method: "POST",
      includeAuth: true,
      requestId,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
  },
  async refreshSmartIntakeCapability() {
    try {
      const { data } = await apiClientFetchJson("/contract/job-status", {
        method: "GET",
        includeAuth: false,
      });
      const enabled = Boolean(data && data.capabilities && data.capabilities.smart_intake_enabled);
      if (typeof window.setSmartIntakeCapability === "function") {
        window.setSmartIntakeCapability(enabled);
      }
      return enabled;
    } catch {
      return false;
    }
  },
};
