// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

// User value: keeps job/status fields consistent across OCR/transcription views.
function loadJobContract() {
  const code = fs.readFileSync("/Users/arpitjain/VSProjects/doc-transcribe-ui/js/job-contract.js", "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.JOB_CONTRACT;
}

test("JOB_CONTRACT resolves canonical fields", () => {
  const contract = loadJobContract();
  assert.equal(contract.resolveJobType({ job_type: "ocr" }), "OCR");
  assert.equal(contract.resolveJobStatus({ status: "processing" }), "PROCESSING");
  assert.equal(contract.resolveUploadedFilename({ input_filename: "sample.pdf" }), "sample.pdf");
  assert.equal(contract.resolveOutputFilename({ output_filename: "out.txt" }), "out.txt");
});

test("JOB_CONTRACT resolves duration from fallback candidates", () => {
  const contract = loadJobContract();
  assert.equal(contract.resolveDurationSec({ input_duration_sec: "51" }), 51);
  assert.ok(Number.isNaN(contract.resolveDurationSec({ duration_sec: "x" })));
});

test("JOB_CONTRACT normalizes intake cost guardrail fields", () => {
  const contract = loadJobContract();
  const normalized = contract.resolveIntakePrecheck({
    detected_job_type: "ocr",
    estimated_effort: "medium",
    estimated_cost_band: "high",
    policy_decision: "warn",
    policy_reason: "Projected cost is high",
    projected_cost_usd: "0.91",
  });
  assert.equal(normalized.detectedJobType, "OCR");
  assert.equal(normalized.estimatedEffort, "MEDIUM");
  assert.equal(normalized.estimatedCostBand, "HIGH");
  assert.equal(normalized.policyDecision, "WARN");
  assert.equal(normalized.policyReason, "Projected cost is high");
  assert.equal(normalized.projectedCostUsd, 0.91);
});
