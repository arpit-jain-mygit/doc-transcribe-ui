const API_ENDPOINTS = {
  render: "https://doc-transcribe-api.onrender.com",
  local: "/api",
};

const API_MODE_STORAGE_KEY = "doc_api_mode";
const urlApiMode = new URLSearchParams(window.location.search).get("api");

if (urlApiMode === "local" || urlApiMode === "render") {
  localStorage.setItem(API_MODE_STORAGE_KEY, urlApiMode);
}

const API_MODE = localStorage.getItem(API_MODE_STORAGE_KEY) || "render";
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
