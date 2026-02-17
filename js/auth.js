// User value: This file helps users upload files, track OCR/transcription progress, and access outputs.
// =====================================================
// AUTH STATE
// =====================================================

// These are assumed to already exist globally
// let ID_TOKEN, USER_EMAIL, JOB_ID, SESSION_RESTORED;
// const GOOGLE_CLIENT_ID, AUTH_STORAGE_KEY;

// =====================================================
// GOOGLE SIGN-IN RENDERING (SAFE + SINGLE ENTRY)
// =====================================================

let googleRendered = false;
let tokenExpiryTimer = null;

// User value: normalizes data so users see consistent OCR/transcription results.
function parseJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// User value: supports tokenRemainingMs so the OCR/transcription journey stays clear and reliable.
function tokenRemainingMs(token) {
  const payload = parseJwtPayload(token);
  const expSec = Number(payload && payload.exp);
  if (!Number.isFinite(expSec) || expSec <= 0) return null;
  return expSec * 1000 - Date.now();
}

// User value: shows clear processing timing so users can set expectations.
function clearTokenExpiryTimer() {
  if (tokenExpiryTimer) {
    clearTimeout(tokenExpiryTimer);
    tokenExpiryTimer = null;
  }
}

// User value: supports scheduleTokenExpiryLogout so the OCR/transcription journey stays clear and reliable.
function scheduleTokenExpiryLogout(token) {
  clearTokenExpiryTimer();
  const remainingMs = tokenRemainingMs(token);
  if (remainingMs == null) return;

  if (remainingMs <= 0) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("active_job_id");
    toggleAuthOnly(false);
    if (typeof bootstrapLoggedOutUI === "function") {
      bootstrapLoggedOutUI();
    }
    toast("Session expired. Please sign in again.", "error");
    return;
  }

  tokenExpiryTimer = setTimeout(() => {
    logout({ silent: true });
    toast("Session expired. Please sign in again.", "error");
  }, remainingMs + 500);
}

// User value: renders UI state so users can track OCR/transcription progress.
function renderGoogleButton() {
  if (googleRendered) return;

  const btn = document.getElementById("google-signin-btn");
  if (!btn) {
    console.warn("Google Sign-In container not found");
    return;
  }

  if (!window.google || !google.accounts || !google.accounts.id) {
    console.warn("Google Identity not ready, retrying...");
    setTimeout(renderGoogleButton, 100);
    return;
  }


  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onGoogleSignIn
  });

  google.accounts.id.renderButton(btn, {
    theme: "outline",
    size: "large",
    text: "signin_with",
    width: 320
  });

  googleRendered = true;
}



// =====================================================
// GOOGLE SIGN-IN CALLBACK
// =====================================================

// User value: protects user access before OCR/transcription actions are allowed.
function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;

  const payload = parseJwtPayload(resp.credential) || {};

  USER_EMAIL = payload.email || "";
  USER_PICTURE = payload.picture || "";

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: ID_TOKEN,
      email: USER_EMAIL,
      picture: payload.picture || null
    })
  );

  if (typeof setUserProfileIdentity === "function") {
    setUserProfileIdentity({ email: USER_EMAIL, picture: USER_PICTURE });
  }

  showLoggedInUI();
  toggleAuthOnly(true);
  hidePending();
  scheduleTokenExpiryLogout(ID_TOKEN);

  toast("Signed in successfully", "success");
}

// =====================================================
// LOGOUT
// =====================================================

// User value: supports logout so the OCR/transcription journey stays clear and reliable.
function logout(options = {}) {
  const silent = Boolean(options && options.silent);
  if (typeof stopPolling === "function") {
    stopPolling();
  }

  ID_TOKEN = null;
  USER_EMAIL = null;
  USER_PICTURE = null;
  JOB_ID = null;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("active_job_id");

  hidePending();
  toggleAuthOnly(false);

  SESSION_RESTORED = false;
  clearTokenExpiryTimer();

  // 🔑 Re-bootstrap logged-out UI safely
  if (typeof bootstrapLoggedOutUI === "function") {
    bootstrapLoggedOutUI();
  }

  if (!silent) {
    toast("Logged out", "info");
  }

}

// =====================================================
// SESSION RESTORE
// =====================================================

// User value: supports restoreSession so the OCR/transcription journey stays clear and reliable.
function restoreSession() {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!saved) {
    toggleAuthOnly(false);
    return false;
  }

  try {
    const { token, email, picture } = JSON.parse(saved);
    if (!token || !email) {
      toggleAuthOnly(false);
      return false;
    }
    const remainingMs = tokenRemainingMs(token);
    if (remainingMs != null && remainingMs <= 0) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem("active_job_id");
      toggleAuthOnly(false);
      if (typeof bootstrapLoggedOutUI === "function") {
        bootstrapLoggedOutUI();
      }
      toast("Session expired. Please sign in again.", "error");
      return false;
    }

    ID_TOKEN = token;
    USER_EMAIL = email;
    USER_PICTURE = picture || "";
    if (typeof setUserProfileIdentity === "function") {
      setUserProfileIdentity({ email: USER_EMAIL, picture: USER_PICTURE });
    }

    SESSION_RESTORED = true;

    showLoggedInUI();
    toggleAuthOnly(true);
    scheduleTokenExpiryLogout(ID_TOKEN);

    const job = localStorage.getItem("active_job_id");
    if (job) {
      JOB_ID = job;
      document.body.classList.add("processing-active");
      startPolling();
    }

    return true;
  } catch {
    toggleAuthOnly(false);
    return false;
  }
}

// User value: protects user access before OCR/transcription actions are allowed.
function resetGoogleAuth() {
  googleRendered = false;

  const btn = document.getElementById("google-signin-btn");
  if (btn) btn.innerHTML = "";
}
