// User value: shows clear processing timing so users can set expectations.
function formatJobDuration(secondsRaw) {
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const rounded = Math.round(seconds);
  return formatCompactDuration(rounded);
}

// User value: keeps job/status fields consistent across OCR/transcription views.
function contract() {
  return window.JOB_CONTRACT || {};
}

// User value: shows clear processing timing so users can set expectations.
function formatCompactDuration(totalSeconds) {
  const rounded = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  const parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(" ");
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

// User value: shows clear processing timing so users can set expectations.
function parseDurationSeconds(raw) {
  if (raw === null || raw === undefined || raw === "") return NaN;
  if (typeof raw === "number") return raw;

  const text = String(raw).trim();
  if (!text) return NaN;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric;

  const clock = text.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (clock) {
    const a = Number(clock[1]);
    const b = Number(clock[2]);
    const c = Number(clock[3] || 0);
    if (text.split(":").length === 3) return a * 3600 + b * 60 + c;
    return a * 60 + b;
  }

  const suffix = text.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds)$/i);
  if (suffix) return Number(suffix[1]);

  return NaN;
}

// User value: shows clear processing timing so users can set expectations.
function formatMediaDuration(secondsRaw) {
  const total = parseDurationSeconds(secondsRaw);
  if (!Number.isFinite(total) || total < 0) return "";
  const rounded = Math.max(0, Math.round(total));
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hrs > 0) return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  if (mins > 0) return `${mins}m`;
  return `${secs}s`;
}

// User value: shows clear processing timing so users can set expectations.
function getTranscriptionMediaDuration(job) {
  const candidates = [
    job.media_duration_sec,
    job.input_duration_sec,
    job.audio_duration_sec,
    job.video_duration_sec,
    job.source_duration_sec,
    job.media_duration,
    job.input_duration,
    job.audio_duration,
    job.video_duration,
    job.source_duration,
    job.duration,
    job.duration_sec,
  ];
  for (const candidate of candidates) {
    const text = formatMediaDuration(candidate);
    if (text) return text;
  }
  return "";
}

// User value: formats OCR/transcription details into clear user-facing text.
function formatJobTypeLabel(job) {
  const jobType = contract().resolveJobType ? contract().resolveJobType(job) : String(job?.job_type || job?.mode || "").toUpperCase();
  if (jobType === "OCR") return "PDF / Image to Hindi Text";
  if (jobType === "TRANSCRIPTION") return "Video / Audio to Hindi Text";
  return job?.job_type || job?.mode || "Processing";
}

// User value: loads latest OCR/transcription data so users see current status.
function getJobTypeThemeClass(job) {
  const jobType = contract().resolveJobType ? contract().resolveJobType(job) : String(job?.job_type || job?.mode || "").toUpperCase();
  if (jobType === "OCR") return "job-type-label-ocr";
  if (jobType === "TRANSCRIPTION") return "job-type-label-transcription";
  return "job-type-label-neutral";
}

// User value: keeps users updated with live OCR/transcription progress.
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

// User value: loads latest OCR/transcription data so users see current status.
function getStatusDotSymbol(statusRaw) {
  const status = String(statusRaw || "").toUpperCase();
  if (status === "COMPLETED") return "✓";
  if (status === "FAILED") return "×";
  if (status === "CANCELLED") return "⦸";
  return "…";
}

// User value: keeps users updated with live OCR/transcription progress.
function buildStatusDotHtml(statusRaw) {
  const status = String(statusRaw || "").toUpperCase();
  if (status === "PROCESSING" || status === "PENDING" || status === "QUEUED") {
    return (
      `<span class="job-status-dot-train" aria-hidden="true">` +
        `<span class="job-status-dot-swastik"></span>` +
      `</span>`
    );
  }
  return `<span class="job-status-dot">${escapeHtml(getStatusDotSymbol(statusRaw))}</span>`;
}

// User value: supports escapeHtml so the OCR/transcription journey stays clear and reliable.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// User value: maps metadata labels to compact icons so users scan job details faster.
function metaIconInfo(key) {
  const normalized = String(key || "").trim().toLowerCase();
  if (normalized === "uploaded file") return { icon: "📄", label: "Uploaded file" };
  if (normalized === "file size") return { icon: "💾", label: "File Size" };
  if (normalized === "processing time") return { icon: "⏱", label: "Processing Time" };
  if (normalized === "when") return { icon: "🕒", label: "When" };
  if (normalized === "ocr quality") return { icon: "🎯", label: "OCR Quality" };
  if (normalized === "pages") return { icon: "📚", label: "Pages" };
  if (normalized === "duration") return { icon: "🎵", label: "Duration" };
  return { icon: "•", label: String(key || "") };
}

// User value: renders accessible metadata icons while keeping the row compact.
function buildHistoryMetaIconHtml(key, extraClass = "") {
  const info = metaIconInfo(key);
  const cls = `history-meta-icon${extraClass ? ` ${extraClass}` : ""}`;
  return `<span class="${cls}" title="${escapeHtml(info.label)}" aria-label="${escapeHtml(info.label)}">${escapeHtml(info.icon)}</span>`;
}

// User value: supports detailClassToken so the OCR/transcription journey stays clear and reliable.
function detailClassToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// User value: keeps users updated with live OCR/transcription progress.
function normalizeJobStatus(statusRaw) {
  if (contract().normalizeJobStatus) return contract().normalizeJobStatus(statusRaw);
  return String(statusRaw || "").toUpperCase();
}

// User value: normalizes data so users see consistent OCR/transcription results.
function normalizeJobType(typeRaw) {
  if (contract().normalizeJobType) return contract().normalizeJobType(typeRaw);
  return String(typeRaw || "").toUpperCase();
}

// User value: loads latest OCR/transcription data so users see current status.
function getJobsStateKey(jobType, status) {
  return `${normalizeJobType(jobType)}|${normalizeJobStatus(status)}`;
}

// User value: supports ensureJobsState so the OCR/transcription journey stays clear and reliable.
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

// User value: keeps users updated with live OCR/transcription progress.
function updateHistoryStatusControlState() {
  const select = document.getElementById("historyStatusSelect");
  if (!select) return;
  select.value = JOBS_FILTER;
}

// User value: keeps users updated with live OCR/transcription progress.
function setHistoryStatusControlVisible(visible) {
  const wrap = document.getElementById("historyStatusControl");
  if (!wrap) return;
  wrap.style.display = visible ? "inline-flex" : "none";
}

// User value: updates user-visible OCR/transcription state accurately.
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

// User value: updates user-visible OCR/transcription state accurately.
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

// User value: keeps users updated with live OCR/transcription progress.
function applyCachedStatusCountsForCurrentType() {
  const cached = JOBS_STATUS_COUNTS_BY_TYPE[JOBS_TYPE_FILTER];
  if (!cached) return false;
  updateHistoryCounts(cached);
  return true;
}

// User value: updates user-visible OCR/transcription state accurately.
function updateHistoryTypeCounts(source) {
  const counts = {
    TRANSCRIPTION: 0,
    OCR: 0,
  };

  if (Array.isArray(source)) {
    source.forEach((job) => {
      const t = contract().resolveJobType ? contract().resolveJobType(job) : normalizeJobType(job.job_type || job.type);
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

// User value: supports clearHistoryCountsUi so the OCR/transcription journey stays clear and reliable.
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

// User value: formats OCR/transcription details into clear user-facing text.
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

// User value: updates user-visible OCR/transcription state accurately.
function updateLastRefreshedUi() {
  const el = document.getElementById("historyLastRefreshed");
  if (!el) return;
  el.textContent = formatLastRefreshedLabel(JOBS_LAST_REFRESH_AT);
}

// User value: supports isHistoryVisibleForTicker so the OCR/transcription journey stays clear and reliable.
function isHistoryVisibleForTicker() {
  const historyView = document.getElementById("workspaceHistoryView");
  if (!historyView) return false;
  const style = window.getComputedStyle(historyView);
  const isShown = style.display !== "none" && style.visibility !== "hidden";
  return isShown && !document.hidden;
}

// User value: supports ensureLastRefreshedTicker so the OCR/transcription journey stays clear and reliable.
function ensureLastRefreshedTicker() {
  if (JOBS_LAST_REFRESH_TIMER) return;
  JOBS_LAST_REFRESH_TIMER = setInterval(updateLastRefreshedUi, 10000);
}

// User value: controls OCR/transcription execution timing for a smooth user flow.
function stopLastRefreshedTicker() {
  if (!JOBS_LAST_REFRESH_TIMER) return;
  clearInterval(JOBS_LAST_REFRESH_TIMER);
  JOBS_LAST_REFRESH_TIMER = null;
}

// User value: supports syncLastRefreshedTicker so the OCR/transcription journey stays clear and reliable.
function syncLastRefreshedTicker() {
  if (isHistoryVisibleForTicker() && JOBS_LAST_REFRESH_AT) {
    ensureLastRefreshedTicker();
    return;
  }
  stopLastRefreshedTicker();
}

// User value: improves reliability when OCR/transcription dependencies fail transiently.
async function retryJobById(jobId) {
  if (!jobId || !ID_TOKEN) return false;

  try {
    const { res, data: payload } = await window.ApiClient.retryJob(jobId);

    if (res.status === 401) {
      logout();
      return false;
    }

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

// User value: renders UI state so users can track OCR/transcription progress.
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
    const uploadedFile = (contract().resolveUploadedFilename ? contract().resolveUploadedFilename(j) : (j.input_filename || j.input_file || "") ) || "-";
    const status = formatStatus(j.status);
    const statusDotHtml = buildStatusDotHtml(j.status);
    const rowStatusClass = String(j.status || "").toUpperCase();
    const qualityBadgeHtml = buildOcrQualityBadgeHtml(j);

    let actionHtml = "";
    const downloadUrl = contract().resolveDownloadUrl ? contract().resolveDownloadUrl(j) : (j.output_path || "");
    if (downloadUrl) {
      actionHtml = `<a href="#" class="history-download" data-url="${escapeHtml(downloadUrl)}">⤓ Download output</a>`;
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
        ${statusDotHtml}
      </div>

      <div class="job-middle">
        ${buildHistoryMetaIconHtml("Uploaded file")}
        <span class="job-filename" title="${escapeHtml(uploadedFile)}">${escapeHtml(uploadedFile)}</span>
        ${qualityBadgeHtml}
        ${detailsHtml}
      </div>

      <div class="job-right">
        <span class="history-when">
          ${buildHistoryMetaIconHtml("When")}
          <span class="job-time">${formatRelativeTime(j.updated_at)}</span>
        </span>
        <span class="job-actions">${actionHtml}</span>
      </div>
    </div>
  `;


    const downloadLink = div.querySelector(".history-download");
    if (downloadLink) {
      downloadLink.onclick = (e) => {
        e.preventDefault();
        const outUrl = contract().resolveDownloadUrl ? contract().resolveDownloadUrl(j) : j.output_path;
        const outName = contract().resolveOutputFilename ? contract().resolveOutputFilename(j) : (j.output_filename || "transcript.txt");
        forceDownload(outUrl, outName);
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

// User value: renders UI state so users can track OCR/transcription progress.
function renderFilteredJobs() {
  const state = ensureJobsState(JOBS_TYPE_FILTER, JOBS_FILTER);
  renderJobsList(state?.items || []);
  updatePaginationUi();
}

// User value: updates user-visible OCR/transcription state accurately.
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

// User value: builds the required payload/state for user OCR/transcription flow.
function buildJobDetailItems(job) {
  const details = [];
  const type = contract().resolveJobType ? contract().resolveJobType(job) : String(job.job_type || "").toUpperCase();

  const bytes = contract().resolveInputSizeBytes ? contract().resolveInputSizeBytes(job) : Number(job.input_size_bytes);
  const hasSize = Number.isFinite(bytes) && bytes > 0;
  details.push({
    key: "File Size",
    value: hasSize ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : "--",
  });

  const durationValue = contract().resolveDurationSec ? contract().resolveDurationSec(job) : Number(job.duration_sec);
  const duration = formatJobDuration(durationValue);
  details.push({
    key: "Processing Time",
    value: duration || "--",
  });

  if (type === "OCR") {
    const pages = contract().resolveTotalPages ? contract().resolveTotalPages(job) : Number(job.total_pages);
    if (Number.isFinite(pages) && pages > 0) {
      details.push({
        key: "Pages",
        value: `${pages} page${pages === 1 ? "" : "s"}`,
      });
    } else {
      details.push({
        key: "Pages",
        value: "--",
      });
    }
  } else if (type === "TRANSCRIPTION") {
    const mediaDuration = getTranscriptionMediaDuration(job);
    details.push({
      key: "Duration",
      value: mediaDuration || "--",
    });
  }

  return details;
}

// User value: parses quality arrays safely so users see consistent OCR quality hints from API/worker payloads.
function parseQualityList(raw) {
  if (Array.isArray(raw)) return raw;
  const text = String(raw || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// User value: normalizes OCR quality fields so users get clear trust signals regardless of payload format.
function getOcrQualityModel(job) {
  const type = contract().resolveJobType ? contract().resolveJobType(job) : normalizeJobType(job?.job_type || job?.type);
  if (type !== "OCR") return null;
  const scoreRaw = job?.ocr_quality_score;
  const score = Number(scoreRaw);
  const lowPages = parseQualityList(job?.low_confidence_pages).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  const hints = parseQualityList(job?.quality_hints).map((v) => String(v || "").trim()).filter(Boolean);
  if (!Number.isFinite(score) && lowPages.length === 0 && hints.length === 0) return null;
  return {
    score: Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : null,
    lowPages,
    hints,
  };
}

// User value: shows compact OCR quality guidance so users can quickly decide whether to trust output or re-upload.
function buildOcrQualityBadgeHtml(job) {
  const model = getOcrQualityModel(job);
  if (!model) return "";
  const pct = model.score === null ? "--" : `${Math.round(model.score * 100)}%`;
  const totalPagesRaw = Number(job?.total_pages);
  const totalPages = Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ? totalPagesRaw : null;
  const lowPageRatio = totalPages ? (model.lowPages.length / totalPages) : 0;
  const low = model.score === null
    ? model.lowPages.length > 0
    : (
      model.score < 0.65
      || (model.score < 0.80 && model.lowPages.length > 0)
      || (totalPages !== null && lowPageRatio >= 0.25)
    );
  const tone = low ? "warn" : "good";
  const pageText = model.lowPages.length ? `Low pages: ${model.lowPages.join(", ")}` : "No low-confidence pages";
  const hintText = model.hints.length ? model.hints[0] : "";
  const title = hintText ? `${pageText}. ${hintText}` : pageText;
  return (
    `<span class="history-quality-badge history-quality-badge-${tone}" title="${escapeHtml(title)}">` +
      `${buildHistoryMetaIconHtml("OCR Quality", "history-quality-icon")}` +
      `<span class="history-quality-value">${escapeHtml(pct)}</span>` +
    `</span>`
  );
}

// User value: builds the required payload/state for user OCR/transcription flow.
function buildJobDetailsHtml(job) {
  const items = buildJobDetailItems(job);
  if (!items.length) return "";

  const parts = [`<span class="history-meta-sep">|</span>`];
  items.forEach((item, index) => {
    if (index > 0) {
      parts.push(`<span class="history-meta-sep">|</span>`);
    }
    parts.push(
      `<span class="history-meta-item item-key-${detailClassToken(item.key)}${item.placeholder ? " is-placeholder" : ""}">` +
        `${buildHistoryMetaIconHtml(item.key)}` +
        `<span class="history-meta-value">${escapeHtml(item.value)}</span>` +
      `</span>`
    );
  });

  return `<span class="history-meta">${parts.join("")}</span>`;
}

// User value: builds the required payload/state for user OCR/transcription flow.
function buildJobsUrl(jobType, status, limit, offset, includeCounts = false) {
  const params = new URLSearchParams();
  params.set("job_type", jobType);
  params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (includeCounts) params.set("include_counts", "1");
  return `${API}/jobs?${params.toString()}`;
}

// User value: supports resetJobsTabState so the OCR/transcription journey stays clear and reliable.
function resetJobsTabState() {
  Object.keys(JOBS_TAB_STATE).forEach((key) => delete JOBS_TAB_STATE[key]);
  JOBS_STATUS_COUNTS_BY_TYPE.TRANSCRIPTION = null;
  JOBS_STATUS_COUNTS_BY_TYPE.OCR = null;
  clearHistoryCountsUi();
  JOBS_LAST_REFRESH_AT = null;
  updateLastRefreshedUi();
  syncLastRefreshedTicker();
}

// User value: loads latest OCR/transcription data so users see current status.
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
    const { res, data: payload } = await window.ApiClient.getJobs(
      buildJobsUrl(JOBS_TYPE_FILTER, JOBS_FILTER, JOBS_PAGE_SIZE, offset, includeCounts)
    );

    if (res.status === 401) return logout();

    if (!res.ok) {
      toast(responseErrorMessage(res, payload, "Failed to load history"), "error");
      if (!append) box.innerHTML = "";
      return;
    }

    if (Array.isArray(payload)) {
      // Backward-compatible fallback if API pagination is not available.
      const typed = payload.filter(
        (j) => normalizeJobType(contract().resolveJobType ? contract().resolveJobType(j) : (j.job_type || j.type)) === JOBS_TYPE_FILTER
      );
      const filtered = payload.filter(
        (j) =>
          normalizeJobType(contract().resolveJobType ? contract().resolveJobType(j) : (j.job_type || j.type)) === JOBS_TYPE_FILTER &&
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
      syncLastRefreshedTicker();
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
    syncLastRefreshedTicker();
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

if (!window.__JOBS_TICKER_VISIBILITY_WIRED__) {
  document.addEventListener("visibilitychange", syncLastRefreshedTicker);
  window.addEventListener("workspace:view-changed", syncLastRefreshedTicker);
  window.__JOBS_TICKER_VISIBILITY_WIRED__ = true;
}

// User value: renders UI state so users can track OCR/transcription progress.
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
               ⤓ Download output
             </a>`
      : `<span class="job-pending">Processing…</span>`
    }
    </div>
  `;

  return row;
}
