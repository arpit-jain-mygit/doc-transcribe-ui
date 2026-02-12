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

function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;

  let payload = {};
  try {
    payload = JSON.parse(atob(resp.credential.split(".")[1]));
  } catch { }

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

  toast("Signed in successfully", "success");
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
  USER_PICTURE = null;
  JOB_ID = null;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem("active_job_id");

  hidePending();
  toggleAuthOnly(false);

  SESSION_RESTORED = false;

  // 🔑 Re-bootstrap logged-out UI safely
  if (typeof bootstrapLoggedOutUI === "function") {
    bootstrapLoggedOutUI();
  }

  toast("Logged out", "info");

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
    USER_PICTURE = picture || "";
    if (typeof setUserProfileIdentity === "function") {
      setUserProfileIdentity({ email: USER_EMAIL, picture: USER_PICTURE });
    }

    SESSION_RESTORED = true;

    showLoggedInUI();
    toggleAuthOnly(true);

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

function resetGoogleAuth() {
  googleRendered = false;

  const btn = document.getElementById("google-signin-btn");
  if (btn) btn.innerHTML = "";
}
