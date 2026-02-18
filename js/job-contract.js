// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
(() => {
  const CONTRACT_VERSION = "2026-02-16-prs-005";

  const JOB_TYPES = Object.freeze({
    OCR: "OCR",
    TRANSCRIPTION: "TRANSCRIPTION",
  });

  const JOB_STATUSES = Object.freeze({
    QUEUED: "QUEUED",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
  });

  const TERMINAL_STATUSES = Object.freeze([
    JOB_STATUSES.COMPLETED,
    JOB_STATUSES.FAILED,
    JOB_STATUSES.CANCELLED,
  ]);

  // User value: normalizes data so users see consistent OCR/transcription results.
  function normalizeJobType(raw) {
    return String(raw || "").trim().toUpperCase();
  }

  // User value: keeps users updated with live OCR/transcription progress.
  function normalizeJobStatus(raw) {
    return String(raw || "").trim().toUpperCase();
  }

  // User value: supports resolveJobType so the OCR/transcription journey stays clear and reliable.
  function resolveJobType(job) {
    if (!job || typeof job !== "object") return "";
    return normalizeJobType(job.job_type || job.type || job.mode || "");
  }

  // User value: keeps users updated with live OCR/transcription progress.
  function resolveJobStatus(job) {
    if (!job || typeof job !== "object") return "";
    return normalizeJobStatus(job.status || "");
  }

  // User value: supports resolveRequestId so the OCR/transcription journey stays clear and reliable.
  function resolveRequestId(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.request_id || "").trim();
  }

  // User value: submits user files safely for OCR/transcription processing.
  function resolveUploadedFilename(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.input_filename || job.filename || job.input_file || "").trim();
  }

  // User value: supports resolveInputSizeBytes so the OCR/transcription journey stays clear and reliable.
  function resolveInputSizeBytes(job) {
    if (!job || typeof job !== "object") return NaN;
    return Number(job.input_size_bytes);
  }

  // User value: supports resolveOutputFilename so the OCR/transcription journey stays clear and reliable.
  function resolveOutputFilename(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.output_filename || job.output_file || "transcript.txt").trim();
  }

  // User value: lets users fetch generated OCR/transcription output reliably.
  function resolveDownloadUrl(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.download_url || job.output_path || "").trim();
  }

  // User value: shows clear processing timing so users can set expectations.
  function resolveDurationSec(job) {
    if (!job || typeof job !== "object") return NaN;
    const candidates = [
      job.duration_sec,
      job.media_duration_sec,
      job.input_duration_sec,
      job.audio_duration_sec,
      job.video_duration_sec,
      job.source_duration_sec,
    ];
    for (const value of candidates) {
      const n = Number(value);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return NaN;
  }

  // User value: supports resolveTotalPages so the OCR/transcription journey stays clear and reliable.
  function resolveTotalPages(job) {
    if (!job || typeof job !== "object") return NaN;
    const n = Number(job.total_pages);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }

  // User value: keeps intake fields consistent so users get stable pre-upload guidance.
  function resolveIntakePrecheck(raw) {
    return {
      detectedJobType: String(raw?.detected_job_type || "UNKNOWN").toUpperCase(),
      warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
      etaSec: Number.isFinite(Number(raw?.eta_sec)) ? Number(raw.eta_sec) : null,
      confidence: Number.isFinite(Number(raw?.confidence)) ? Number(raw.confidence) : 0,
      reasons: Array.isArray(raw?.reasons) ? raw.reasons : [],
    };
  }

  window.JOB_CONTRACT = Object.freeze({
    CONTRACT_VERSION,
    JOB_TYPES,
    JOB_STATUSES,
    TERMINAL_STATUSES,
    normalizeJobType,
    normalizeJobStatus,
    resolveJobType,
    resolveJobStatus,
    resolveRequestId,
    resolveUploadedFilename,
    resolveInputSizeBytes,
    resolveOutputFilename,
    resolveDownloadUrl,
    resolveDurationSec,
    resolveTotalPages,
    resolveIntakePrecheck,
  });
})();
