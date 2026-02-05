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

function renderGoogleButton() {
  if (googleRendered) return;

  const btn = document.getElementById("google-signin-btn");
  if (!btn) {
    console.warn("Google Sign-In container not found");
    return;
  }

  if (!window.google || !google.accounts || !google.accounts.id) {
    console.warn("Google Identity not ready");
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onGoogleSignIn
  });

  google.accounts.id.renderButton(btn, {
    theme: "outline",
    size: "large",
    text: "signin_with"
  });

  googleRendered = true;
}



// =====================================================
// GOOGLE SIGN-IN CALLBACK
// =====================================================

function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;

  let payload = {};
  try {
    payload = JSON.parse(atob(resp.credential.split(".")[1]));
  } catch {}

  USER_EMAIL = payload.email || "";

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: ID_TOKEN,
      email: USER_EMAIL,
      picture: payload.picture || null
    })
  );

  const userEmailEl = document.getElementById("userEmail");
  const userAvatarEl = document.getElementById("userAvatar");

  if (userEmailEl) userEmailEl.innerText = USER_EMAIL;
  if (userAvatarEl)
    userAvatarEl.src =
      payload.picture || "https://www.gravatar.com/avatar?d=mp";

  showLoggedInUI();
  toggleAuthOnly(true);
  hidePending();

  toast("Signed in successfully", "success");
  loadJobs();
}

// =====================================================
// LOGOUT
// =====================================================

function logout() {
  if (typeof stopPolling === "function") {
    stopPolling();
  }

  ID_TOKEN = null;
  USER_EMAIL = null;
  JOB_ID = null;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("active_job_id");

  hidePending();
  showLoggedOutUI();
  toggleAuthOnly(false);

  toast("Logged out", "info");

  SESSION_RESTORED = false;
}

// =====================================================
// SESSION RESTORE
// =====================================================

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

    ID_TOKEN = token;
    USER_EMAIL = email;

    const userEmailEl = document.getElementById("userEmail");
    const userAvatarEl = document.getElementById("userAvatar");

    if (userEmailEl) userEmailEl.innerText = email;
    if (userAvatarEl)
      userAvatarEl.src =
        picture || "https://www.gravatar.com/avatar?d=mp";

    SESSION_RESTORED = true;

    showLoggedInUI();
    toggleAuthOnly(true);
    loadJobs();

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
