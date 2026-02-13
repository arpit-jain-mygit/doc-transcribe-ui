function formatJobDuration(secondsRaw) {
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const rounded = Math.round(seconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

let JOBS_LOADING = false;
let JOBS_FILTER = "COMPLETED";
let JOBS_TYPE_FILTER = "OCR";
let JOBS_STATUS_CONTROL_VISIBLE = false;
const JOBS_PAGE_SIZE = 10;
let JOBS_LAST_REFRESH_AT = null;
let JOBS_LAST_REFRESH_TIMER = null;
const JOBS_STATUS_COUNTS_BY_TYPE = {
  TRANSCRIPTION: null,
  OCR: null,
};
const JOBS_TAB_STATE = {};

function formatMediaDuration(secondsRaw) {
  const total = Number(secondsRaw);
  if (!Number.isFinite(total) || total < 0) return "";

  const rounded = Math.round(total);
  const hours = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getTranscriptionMediaDuration(job) {
  const candidates = [
    job.media_duration_sec,
    job.input_duration_sec,
    job.audio_duration_sec,
    job.video_duration_sec,
    job.source_duration_sec,
    job.duration_sec,
  ];
  for (const candidate of candidates) {
    const text = formatMediaDuration(candidate);
    if (text) return text;
  }
  return "";
}

function formatJobTypeLabel(job) {
  const jobType = String(job?.job_type || job?.mode || "").toUpperCase();
  if (jobType === "OCR") return "PDF / Image to Hindi Text";
  if (jobType === "TRANSCRIPTION") return "Video / Audio to Hindi Text";
  return job?.job_type || job?.mode || "Processing";
}

function getJobTypeThemeClass(job) {
  const jobType = String(job?.job_type || job?.mode || "").toUpperCase();
  if (jobType === "OCR") return "job-type-label-ocr";
  if (jobType === "TRANSCRIPTION") return "job-type-label-transcription";
  return "job-type-label-neutral";
}

function buildStatusBadgeHtml(statusRaw) {
  const status = String(statusRaw || "").toUpperCase();
  const text = formatStatus(statusRaw);

  let icon = "";
  if (status === "COMPLETED") icon = "✓";
  else if (status === "FAILED") icon = "×";
  else if (status === "CANCELLED") icon = "⦸";
  else icon = "…";

  return (
    `<span class="job-status job-status-${status.toLowerCase()}">` +
      `<span class="job-status-icon" aria-hidden="true">${icon}</span>` +
      `<span>${escapeHtml(text)}</span>` +
    `</span>`
  );
}

function getStatusDotSymbol(statusRaw) {
  const status = String(statusRaw || "").toUpperCase();
  if (status === "COMPLETED") return "✓";
  if (status === "FAILED") return "×";
  if (status === "CANCELLED") return "⦸";
  return "…";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeJobStatus(statusRaw) {
  return String(statusRaw || "").toUpperCase();
}

function normalizeJobType(typeRaw) {
  return String(typeRaw || "").toUpperCase();
}

function getJobsStateKey(jobType, status) {
  return `${normalizeJobType(jobType)}|${normalizeJobStatus(status)}`;
}

function ensureJobsState(jobType, status) {
  const key = getJobsStateKey(jobType, status);
  if (!JOBS_TAB_STATE[key]) {
    JOBS_TAB_STATE[key] = {
      items: [],
      nextOffset: 0,
      hasMore: false,
      total: 0,
      loaded: false,
    };
  }
  return JOBS_TAB_STATE[key];
}

function updateHistoryStatusControlState() {
  const select = document.getElementById("historyStatusSelect");
  if (!select) return;
  select.value = JOBS_FILTER;
}

function setHistoryStatusControlVisible(visible) {
  const wrap = document.getElementById("historyStatusControl");
  if (!wrap) return;
  wrap.style.display = visible ? "inline-flex" : "none";
}

function updateHistoryTypeTabState() {
  const typeMap = {
    TRANSCRIPTION: document.getElementById("historyKindTranscription"),
    OCR: document.getElementById("historyKindOcr"),
  };

  Object.entries(typeMap).forEach(([type, el]) => {
    if (!el) return;
    const isActive = type === JOBS_TYPE_FILTER;
    el.classList.toggle("active", isActive);
    el.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function updateHistoryCounts(source) {
  const counts = {
    COMPLETED: 0,
    FAILED: 0,
    CANCELLED: 0,
  };

  if (Array.isArray(source)) {
    source.forEach((job) => {
      const status = normalizeJobStatus(job.status);
      if (counts[status] !== undefined) counts[status] += 1;
    });
  } else if (source && typeof source === "object") {
    counts.COMPLETED = Number(source.COMPLETED || source.completed || 0);
    counts.FAILED = Number(source.FAILED || source.failed || 0);
    counts.CANCELLED = Number(source.CANCELLED || source.cancelled || 0);
  }

  JOBS_STATUS_COUNTS_BY_TYPE[JOBS_TYPE_FILTER] = counts;

  const completedEl = document.getElementById("historyStatusOptionCompleted");
  const failedEl = document.getElementById("historyStatusOptionFailed");
  const cancelledEl = document.getElementById("historyStatusOptionCancelled");

  if (completedEl) completedEl.textContent = `Completed (${counts.COMPLETED})`;
  if (failedEl) failedEl.textContent = `Failed (${counts.FAILED})`;
  if (cancelledEl) cancelledEl.textContent = `Cancelled (${counts.CANCELLED})`;
}

function applyCachedStatusCountsForCurrentType() {
  const cached = JOBS_STATUS_COUNTS_BY_TYPE[JOBS_TYPE_FILTER];
  if (!cached) return false;
  updateHistoryCounts(cached);
  return true;
}

function updateHistoryTypeCounts(source) {
  const counts = {
    TRANSCRIPTION: 0,
    OCR: 0,
  };

  if (Array.isArray(source)) {
    source.forEach((job) => {
      const t = normalizeJobType(job.job_type || job.type);
      if (counts[t] !== undefined) counts[t] += 1;
    });
  } else if (source && typeof source === "object") {
    counts.TRANSCRIPTION = Number(source.TRANSCRIPTION || source.transcription || 0);
    counts.OCR = Number(source.OCR || source.ocr || 0);
  }

  const tEl = document.getElementById("historyKindCountTranscription");
  const oEl = document.getElementById("historyKindCountOcr");
  if (tEl) {
    tEl.textContent = String(counts.TRANSCRIPTION);
    tEl.style.display = "inline-flex";
  }
  if (oEl) {
    oEl.textContent = String(counts.OCR);
    oEl.style.display = "inline-flex";
  }
}

function clearHistoryCountsUi() {
  const completedEl = document.getElementById("historyStatusOptionCompleted");
  const failedEl = document.getElementById("historyStatusOptionFailed");
  const cancelledEl = document.getElementById("historyStatusOptionCancelled");
  if (completedEl) completedEl.textContent = "Completed";
  if (failedEl) failedEl.textContent = "Failed";
  if (cancelledEl) cancelledEl.textContent = "Cancelled";

  const tEl = document.getElementById("historyKindCountTranscription");
  const oEl = document.getElementById("historyKindCountOcr");
  if (tEl) {
    tEl.textContent = "";
    tEl.style.display = "none";
  }
  if (oEl) {
    oEl.textContent = "";
    oEl.style.display = "none";
  }
}

function formatLastRefreshedLabel(date) {
  if (!date) return "Last refreshed: --";
  const deltaSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (deltaSec < 5) return "Last refreshed: just now";
  if (deltaSec < 60) return `Last refreshed: ${deltaSec}s ago`;
  const mins = Math.floor(deltaSec / 60);
  if (mins < 60) return `Last refreshed: ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `Last refreshed: ${hrs}h ago`;
}

function updateLastRefreshedUi() {
  const el = document.getElementById("historyLastRefreshed");
  if (!el) return;
  el.textContent = formatLastRefreshedLabel(JOBS_LAST_REFRESH_AT);
}

function ensureLastRefreshedTicker() {
  if (JOBS_LAST_REFRESH_TIMER) return;
  JOBS_LAST_REFRESH_TIMER = setInterval(updateLastRefreshedUi, 10000);
}

async function retryJobById(jobId) {
  if (!jobId || !ID_TOKEN) return false;

  try {
    const res = await fetch(`${API}/jobs/${jobId}/retry`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ID_TOKEN },
    });

    if (res.status === 401) {
      logout();
      return false;
    }

    const payload = await safeJson(res);
    if (!res.ok) {
      toast(responseErrorMessage(res, payload, "Unable to retry job"), "error");
      return false;
    }

    toast("Retry requested", "success");
    refreshJobs();
    return true;
  } catch {
    toast("Network error while retrying job", "error");
    return false;
  }
}

function renderJobsList(jobs) {
  const box = document.getElementById("jobs");
  if (!box) return;

  box.innerHTML = "";

  if (!jobs.length) {
    const empty = document.createElement("div");
    empty.className = "jobs-empty";
    empty.textContent = `No ${JOBS_FILTER.toLowerCase()} jobs yet.`;
    box.appendChild(empty);
    return;
  }

  jobs.forEach(j => {
    const div = document.createElement("div");
    div.className = "job";
    const detailsHtml = buildJobDetailsHtml(j);
    const uploadedFile = (j.input_filename || j.input_file || "-");
    const status = formatStatus(j.status);
    const statusDotSymbol = getStatusDotSymbol(j.status);
    const typeLabel = formatJobTypeLabel(j);
    const typeThemeClass = getJobTypeThemeClass(j);
    const rowStatusClass = String(j.status || "").toUpperCase();

    let actionHtml = "";
    if (j.output_path) {
      actionHtml = `<a href="#" class="history-download" data-url="${escapeHtml(j.output_path)}">⬇ Download output</a>`;
    } else if (j.status === "FAILED") {
      actionHtml = `<a href="#" class="history-retry" data-job-id="${escapeHtml(j.job_id)}">↻ Retry</a>`;
    } else if (j.status === "CANCELLED") {
      actionHtml = `<span class="job-pending">${escapeHtml(status)}</span>`;
    } else {
      actionHtml = `
        <span class="job-pending">Processing...</span>
        <a href="#" class="history-cancel" data-job-id="${escapeHtml(j.job_id)}">Cancel</a>
      `;
    }

    div.innerHTML = `
    <div class="job-row-inline">
      <div class="job-left job-left-${rowStatusClass}">
        <span class="job-status-dot">${escapeHtml(statusDotSymbol)}</span>
        <span class="job-type-label ${escapeHtml(typeThemeClass)}">${escapeHtml(typeLabel)}</span>
      </div>

      <div class="job-middle">
        <span class="history-label">Uploaded file:</span>
        <span class="job-filename" title="${escapeHtml(uploadedFile)}">${escapeHtml(uploadedFile)}</span>
        ${detailsHtml}
      </div>

      <div class="job-right">
        <span class="history-when">
          <span class="history-meta-key">When:</span>
          <span class="job-time">${formatRelativeTime(j.updated_at)}</span>
        </span>
        ${actionHtml}
      </div>
    </div>
  `;


    const downloadLink = div.querySelector(".history-download");
    if (downloadLink) {
      downloadLink.onclick = (e) => {
        e.preventDefault();
        forceDownload(j.output_path, j.output_filename || "transcript.txt");
      };
    }

    const cancelLink = div.querySelector(".history-cancel");
    if (cancelLink) {
      cancelLink.onclick = async (e) => {
        e.preventDefault();
        if (typeof cancelJobById !== "function") return;
        await cancelJobById(j.job_id);
      };
    }

    const retryLink = div.querySelector(".history-retry");
    if (retryLink) {
      retryLink.onclick = async (e) => {
        e.preventDefault();
        await retryJobById(j.job_id);
      };
    }

    box.appendChild(div);
  });
}

function renderFilteredJobs() {
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  renderJobsList(state?.items || []);
  updatePaginationUi();
}

function updatePaginationUi() {
  const wrapper = document.getElementById("historyPagination");
  const loadMoreBtn = document.getElementById("historyLoadMoreBtn");

  if (!wrapper || !loadMoreBtn) return;

  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  if (!state || !state.loaded || !state.hasMore) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "flex";
  loadMoreBtn.disabled = JOBS_LOADING || !state.hasMore;
}

function buildJobDetailItems(job) {
  const details = [];
  const type = String(job.job_type || "").toUpperCase();

  const bytes = Number(job.input_size_bytes);
  const hasSize = Number.isFinite(bytes) && bytes > 0;
  details.push({
    key: "Size",
    value: hasSize ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "--",
    placeholder: !hasSize,
  });

  if (type === "OCR") {
    const pages = Number(job.total_pages);
    if (Number.isFinite(pages) && pages > 0) {
      details.push({
        key: "Pages",
        value: `${pages} page${pages === 1 ? "" : "s"}`,
      });
    }
  }

  const duration = formatJobDuration(job.duration_sec);
  if (duration) {
    details.push({
      key: "Time",
      value: duration,
    });
  }

  return details;
}

function buildJobDetailsHtml(job) {
  const items = buildJobDetailItems(job);
  if (!items.length) return "";

  const parts = [`<span class="history-meta-sep">|</span>`];
  items.forEach((item, index) => {
    if (index > 0) {
      parts.push(`<span class="history-meta-sep">|</span>`);
    }
    parts.push(
      `<span class="history-meta-item item-key-${String(item.key).toLowerCase()}${item.placeholder ? " is-placeholder" : ""}">` +
        `<span class="history-meta-key">${escapeHtml(item.key)}:</span>` +
        `<span class="history-meta-value">${escapeHtml(item.value)}</span>` +
      `</span>`
    );
  });

  return `<span class="history-meta">${parts.join("")}</span>`;
}

function buildJobsUrl(jobType, status, limit, offset, includeCounts = false) {
  const params = new URLSearchParams();
  params.set("job_type", jobType);
  params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (includeCounts) params.set("include_counts", "1");
  return `${API}/jobs?${params.toString()}`;
}

function resetJobsTabState() {
  Object.keys(JOBS_TAB_STATE).forEach((key) => delete JOBS_TAB_STATE[key]);
  JOBS_STATUS_COUNTS_BY_TYPE.TRANSCRIPTION = null;
  JOBS_STATUS_COUNTS_BY_TYPE.OCR = null;
  clearHistoryCountsUi();
}

async function loadJobs({ reset = false, append = false } = {}) {
  if (!ID_TOKEN) return;
  if (JOBS_LOADING) return;
  JOBS_LOADING = true;

  if (reset) {
    resetJobsTabState();
  }

  const loadingEl = document.getElementById("jobsLoading");
  const box = document.getElementById("jobs");
  const refreshBtn = document.getElementById("refreshJobsBtn");
  const loadMoreBtn = document.getElementById("historyLoadMoreBtn");
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);

  if (!box || !state) {
    JOBS_LOADING = false;
    return;
  }

  if (loadingEl && !append) loadingEl.style.display = "block";
  if (!append) box.style.display = "none";
  if (refreshBtn && !append) refreshBtn.disabled = true;
  if (loadMoreBtn && append) {
    loadMoreBtn.classList.add("loading");
    loadMoreBtn.disabled = true;
  }

  const offset = append ? state.nextOffset : 0;
  const includeCounts = !append && !JOBS_STATUS_COUNTS_BY_TYPE[JOBS_TYPE_FILTER];

  try {
    const res = await fetch(buildJobsUrl(JOBS_TYPE_FILTER, JOBS_FILTER, JOBS_PAGE_SIZE, offset, includeCounts), {
      headers: { Authorization: "Bearer " + ID_TOKEN }
    });

    if (res.status === 401) return logout();

    const payload = await safeJson(res);
    if (!res.ok) {
      toast(responseErrorMessage(res, payload, "Failed to load history"), "error");
      if (!append) box.innerHTML = "";
      return;
    }

    if (Array.isArray(payload)) {
      // Backward-compatible fallback if API pagination is not available.
      const typed = payload.filter(
        (j) => normalizeJobType(j.job_type || j.type) === JOBS_TYPE_FILTER
      );
      const filtered = payload.filter(
        (j) =>
          normalizeJobType(j.job_type || j.type) === JOBS_TYPE_FILTER &&
          normalizeJobStatus(j.status) === JOBS_FILTER
      );
      const nextEnd = append ? (offset + JOBS_PAGE_SIZE) : JOBS_PAGE_SIZE;
      state.items = filtered.slice(0, nextEnd);
      state.nextOffset = state.items.length;
      state.hasMore = filtered.length > state.items.length;
      state.total = filtered.length;
      state.loaded = true;
      updateHistoryCounts(typed);
      updateHistoryTypeCounts(payload);
      updateHistoryStatusControlState();
      updateHistoryTypeTabState();
      if (!JOBS_STATUS_CONTROL_VISIBLE) {
        JOBS_STATUS_CONTROL_VISIBLE = true;
        setHistoryStatusControlVisible(true);
      }
      renderFilteredJobs();
      JOBS_LAST_REFRESH_AT = new Date();
      updateLastRefreshedUi();
      ensureLastRefreshedTicker();
      return;
    }

    const items = Array.isArray(payload?.items) ? payload.items : null;
    if (!items) {
      toast("Failed to load history: invalid server response", "error");
      if (!append) box.innerHTML = "";
      return;
    }

    state.items = append ? state.items.concat(items) : items;
    state.nextOffset = Number(payload.next_offset ?? (offset + items.length)) || 0;
    state.hasMore = Boolean(payload.has_more);
    state.total = Number(payload.total || state.items.length);
    state.loaded = true;

    if (payload.counts_by_status) updateHistoryCounts(payload.counts_by_status);
    if (payload.counts_by_type) {
      updateHistoryTypeCounts(payload.counts_by_type);
    }
    updateHistoryStatusControlState();
    updateHistoryTypeTabState();
    if (!JOBS_STATUS_CONTROL_VISIBLE) {
      JOBS_STATUS_CONTROL_VISIBLE = true;
      setHistoryStatusControlVisible(true);
    }
    renderFilteredJobs();
    JOBS_LAST_REFRESH_AT = new Date();
    updateLastRefreshedUi();
    ensureLastRefreshedTicker();
  } finally {
    if (loadingEl) loadingEl.style.display = "none";
    box.style.display = "block";
    if (refreshBtn) refreshBtn.disabled = false;
    if (loadMoreBtn) loadMoreBtn.classList.remove("loading");
    JOBS_LOADING = false;
    updatePaginationUi();
  }
}

window.ensureHistoryLoaded = function ensureHistoryLoaded({ force = false } = {}) {
  if (!ID_TOKEN) return;
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  if (!force && state && state.loaded) {
    renderFilteredJobs();
    return;
  }
  loadJobs({ reset: force, append: false });
};

window.refreshJobs = function refreshJobs() {
  if (!ID_TOKEN) {
    toast("Please sign in first", "info");
    return;
  }
  JOBS_TYPE_FILTER = "OCR";
  JOBS_FILTER = "COMPLETED";
  JOBS_STATUS_CONTROL_VISIBLE = false;
  setHistoryStatusControlVisible(false);
  updateHistoryTypeTabState();
  updateHistoryStatusControlState();
  loadJobs({ reset: true, append: false });
};

window.setJobsFilter = function setJobsFilter(status) {
  const next = normalizeJobStatus(status);
  if (!["COMPLETED", "FAILED", "CANCELLED"].includes(next)) return;
  JOBS_FILTER = next;
  updateHistoryStatusControlState();
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  if (state && state.loaded) {
    renderFilteredJobs();
    return;
  }
  loadJobs({ append: false });
};

window.setJobsTypeFilter = function setJobsTypeFilter(jobType) {
  const nextType = normalizeJobType(jobType);
  if (!["TRANSCRIPTION", "OCR"].includes(nextType)) return;
  JOBS_TYPE_FILTER = nextType;
  JOBS_STATUS_CONTROL_VISIBLE = true;
  setHistoryStatusControlVisible(true);
  updateHistoryTypeTabState();
  updateHistoryStatusControlState();
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  applyCachedStatusCountsForCurrentType();
  if (state && state.loaded) {
    renderFilteredJobs();
    return;
  }
  loadJobs({ append: false });
};

window.loadMoreJobs = function loadMoreJobs() {
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  if (!state || !state.hasMore || JOBS_LOADING) return;
  loadJobs({ append: true });
};

function renderJob(job) {
  const row = document.createElement("div");
  row.className = "job-row";

  row.innerHTML = `
    <div class="job-main">
      <strong>${escapeHtml(formatJobTypeLabel(job))}</strong>
      <span class="job-source">
        📄 File
      </span>
    </div>

    <div class="job-meta">
      <span>${job.input_file || "—"}</span>
    </div>

    <div class="job-actions">
      ${job.output_file
      ? `<a href="${job.download_url}" class="history-download">
               ⬇ Download output
             </a>`
      : `<span class="job-pending">Processing…</span>`
    }
    </div>
  `;

  return row;
}
