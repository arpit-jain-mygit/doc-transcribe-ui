
function renderGoogleButton() {
  showLoggedOutUI();
  toggleAuthOnly(false);

  google.accounts.id.initialize({
    client_id: "320763587900-18ptqosdb8b5esc8845oc82ul4qf8m9k.apps.googleusercontent.com",
    callback: onGoogleSignIn,
    auto_select: false
  });

  google.accounts.id.renderButton(
    document.getElementById("google-signin-btn"),
    { theme: "outline", size: "medium", text: "signin_with", shape: "pill" }
  );
}

function onGoogleSignIn(resp) {
  ID_TOKEN = resp.credential;

  let payload = {};
  try {
    payload = JSON.parse(atob(resp.credential.split(".")[1]));
  } catch {}

  USER_EMAIL = payload.email || "";

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    token: ID_TOKEN,
    email: USER_EMAIL,
    picture: payload.picture || null
  }));

  userEmail.innerText = USER_EMAIL;
  userAvatar.src = payload.picture || "https://www.gravatar.com/avatar?d=mp";

  showLoggedInUI();
  toggleAuthOnly(true);
  hidePending();

  toast("Signed in successfully", "success");
  loadJobs();
}

function logout() {
  stopPolling();

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
  renderGoogleButton();
}

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

    userEmail.innerText = email;
    userAvatar.src = picture || "https://www.gravatar.com/avatar?d=mp";

    SESSION_RESTORED = true;

    showLoggedInUI();
    toggleAuthOnly(true);
    loadJobs();

    const job = localStorage.getItem("active_job_id");
    if (job) {
      JOB_ID = job;
      document.body.classList.add("processing-active");
      getStatusBox()?.classList.add("processing-focus");
      startPolling();
    }

    return true;
  } catch {
    toggleAuthOnly(false);
    return false;
  }
}

function waitForGoogleAndRender() {
  if (SESSION_RESTORED) return;

  if (window.google?.accounts?.id) {
    renderGoogleButton();
  } else {
    setTimeout(waitForGoogleAndRender, 50);
  }
}
