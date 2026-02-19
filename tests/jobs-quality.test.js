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
