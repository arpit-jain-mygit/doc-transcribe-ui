const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadUtils() {
  const code = fs.readFileSync("/Users/arpitjain/VSProjects/doc-transcribe-ui/js/utils.js", "utf8");
  const sandbox = {
    window: {
      crypto: { randomUUID: () => "123e4567-e89b-12d3-a456-426614174000" },
    },
    ID_TOKEN: "token",
    Date,
    Math,
    JSON,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

test("formatStatus and request-id helpers stay stable", () => {
  const s = loadUtils();
  assert.equal(s.formatStatus("processing"), "Processing");
  assert.equal(s.generateRequestId(), "req-123e4567-e89b-12d3-a456-426614174000");
  const headers = s.authHeadersWithRequestId({ includeAuth: true });
  assert.equal(headers.headers.Authorization, "Bearer token");
  assert.ok(headers.headers["X-Request-ID"].startsWith("req-"));
});

test("getJobFailureMessage prefers specific messages", () => {
  const s = loadUtils();
  assert.equal(
    s.getJobFailureMessage({ error_code: "INFRA_REDIS" }),
    "Queue service is temporarily unavailable."
  );
  assert.equal(
    s.getJobFailureMessage({ error_message: "Custom message" }),
    "Custom message"
  );
});
