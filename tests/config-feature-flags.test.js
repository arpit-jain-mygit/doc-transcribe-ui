// User value: This file verifies UI feature-flag behavior so users get predictable OCR/transcription rollout behavior.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

// User value: supports loadConfigSandbox so users see stable flag behavior across sessions.
function loadConfigSandbox() {
  const code = fs.readFileSync("/Users/arpitjain/VSProjects/doc-transcribe-ui/js/config.js", "utf8");
  const storage = new Map();
  const sandbox = {
    URLSearchParams,
    localStorage: {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    },
    window: {
      location: {
        search: "",
        hostname: "localhost",
        reload: () => {},
      },
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox;
}

test("smart intake flag defaults to false", () => {
  const sandbox = loadConfigSandbox();
  assert.equal(sandbox.window.isSmartIntakeEnabled(), false);
});

test("setSmartIntakeCapability enables and disables flag", () => {
  const sandbox = loadConfigSandbox();
  sandbox.window.setSmartIntakeCapability(true);
  assert.equal(sandbox.window.isSmartIntakeEnabled(), true);
  sandbox.window.setSmartIntakeCapability(0);
  assert.equal(sandbox.window.isSmartIntakeEnabled(), false);
});

