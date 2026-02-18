// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
const API_ENDPOINTS = {
  render: "https://doc-transcribe-api.onrender.com",
  local: "/api",
};

const API_MODE_STORAGE_KEY = "doc_api_mode";
const urlApiMode = new URLSearchParams(window.location.search).get("api");
const isHostedUi = /\.vercel\.app$/i.test(window.location.hostname);

if (urlApiMode === "local" || urlApiMode === "render") {
  localStorage.setItem(API_MODE_STORAGE_KEY, urlApiMode);
}

let API_MODE = localStorage.getItem(API_MODE_STORAGE_KEY) || "render";
if (isHostedUi && API_MODE === "local") {
  API_MODE = "render";
  localStorage.setItem(API_MODE_STORAGE_KEY, "render");
}
const API = API_MODE === "local" ? API_ENDPOINTS.local : API_ENDPOINTS.render;

window.setApiMode = function setApiMode(mode) {
  if (mode !== "local" && mode !== "render") return;
  localStorage.setItem(API_MODE_STORAGE_KEY, mode);
  window.location.reload();
};

window.getApiMode = function getApiMode() {
  return API_MODE;
};

const AUTH_STORAGE_KEY = "doc_app_auth";
const GOOGLE_CLIENT_ID="320763587900-18ptqosdb8b5esc8845oc82ul4qf8m9k.apps.googleusercontent.com";

// Feature flags (UI-side guarded rollouts)
window.FEATURE_COST_HINTS = true;
window.FEATURE_SMART_INTAKE = false;

// User value: supports setSmartIntakeCapability so users get a safe, controlled rollout of intake guidance.
window.setSmartIntakeCapability = function setSmartIntakeCapability(enabled) {
  window.FEATURE_SMART_INTAKE = Boolean(enabled);
};

// User value: supports isSmartIntakeEnabled so users only see intake behavior when explicitly enabled.
window.isSmartIntakeEnabled = function isSmartIntakeEnabled() {
  return Boolean(window.FEATURE_SMART_INTAKE);
};
