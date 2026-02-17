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

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function normalizeJobType(raw) {
    return String(raw || "").trim().toUpperCase();
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function normalizeJobStatus(raw) {
    return String(raw || "").trim().toUpperCase();
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveJobType(job) {
    if (!job || typeof job !== "object") return "";
    return normalizeJobType(job.job_type || job.type || job.mode || "");
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveJobStatus(job) {
    if (!job || typeof job !== "object") return "";
    return normalizeJobStatus(job.status || "");
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveRequestId(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.request_id || "").trim();
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveUploadedFilename(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.input_filename || job.filename || job.input_file || "").trim();
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveInputSizeBytes(job) {
    if (!job || typeof job !== "object") return NaN;
    return Number(job.input_size_bytes);
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveOutputFilename(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.output_filename || job.output_file || "transcript.txt").trim();
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveDownloadUrl(job) {
    if (!job || typeof job !== "object") return "";
    return String(job.download_url || job.output_path || "").trim();
  }

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
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

  // User value: This step keeps the user OCR/transcription flow clear and dependable.
  function resolveTotalPages(job) {
    if (!job || typeof job !== "object") return NaN;
    const n = Number(job.total_pages);
    return Number.isFinite(n) && n > 0 ? n : NaN;
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
  });
})();
