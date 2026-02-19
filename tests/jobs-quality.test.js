// User value: This test keeps OCR quality hints consistent so users can trust quality badges in history.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// User value: loads jobs rendering logic so UI quality badges are verified before release.
function loadJobsModule() {
  const code = fs.readFileSync('/Users/arpitjain/VSProjects/doc-transcribe-ui/js/jobs.js', 'utf8');
  const sandbox = {
    window: {
      JOB_CONTRACT: {
        resolveJobType: (job) => String(job.job_type || '').toUpperCase(),
      },
      addEventListener: () => {},
    },
    document: {
      addEventListener: () => {},
      createElement: () => ({ className: '', innerHTML: '' }),
    },
    console,
    API: 'http://localhost',
    logout: () => {},
    toast: () => {},
    responseErrorMessage: () => '',
    forceDownload: () => {},
    formatRelativeTime: () => 'now',
    formatStatus: (s) => String(s || ''),
    setInterval: () => 1,
    clearInterval: () => {},
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

test('buildOcrQualityBadgeHtml returns warn badge for low score pages', () => {
  const mod = loadJobsModule();
  const html = mod.buildOcrQualityBadgeHtml({
    job_type: 'OCR',
    ocr_quality_score: 0.52,
    low_confidence_pages: '[2,5]',
    quality_hints: '["Page 2 low contrast"]',
  });
  assert.match(html, /history-quality-badge-warn/);
  assert.match(html, /OCR Quality/);
});

test('buildOcrQualityBadgeHtml returns empty for transcription jobs', () => {
  const mod = loadJobsModule();
  const html = mod.buildOcrQualityBadgeHtml({
    job_type: 'TRANSCRIPTION',
    ocr_quality_score: 0.9,
  });
  assert.equal(html, '');
});

test('buildTranscriptionQualityBadgeHtml returns warn badge for low score segments', () => {
  const mod = loadJobsModule();
  const html = mod.buildTranscriptionQualityBadgeHtml({
    job_type: 'TRANSCRIPTION',
    transcript_quality_score: 0.61,
    low_confidence_segments: '[2,4]',
    transcript_quality_hints: '["Segment 2 has high noise"]',
  });
  assert.match(html, /history-quality-badge-warn/);
});

test('buildQualityBadgeHtml returns transcription NA badge when quality fields are absent', () => {
  const mod = loadJobsModule();
  const html = mod.buildQualityBadgeHtml({
    job_type: 'TRANSCRIPTION',
  });
  assert.match(html, /history-quality-badge-na/);
});

test('buildOcrQualityBadgeHtml keeps high score green when only a few pages are low', () => {
  const mod = loadJobsModule();
  const html = mod.buildOcrQualityBadgeHtml({
    job_type: 'OCR',
    ocr_quality_score: 0.93,
    total_pages: 40,
    low_confidence_pages: '[35]',
    quality_hints: '["Page 35 low contrast"]',
  });
  assert.match(html, /history-quality-badge-good/);
});
