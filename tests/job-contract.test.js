const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

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
