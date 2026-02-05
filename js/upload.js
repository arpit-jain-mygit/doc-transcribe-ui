function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input || !input.files.length) {
    toast("Please select a file", "error");
    return;
  }
  upload(type, input.files[0]);
}

async function upload(type, file) {
  if (JOB_ID && !window.JOB_COMPLETED) {
    toast("A job is already running", "info");
    return;
  }

  if (!ID_TOKEN) {
    toast("Please sign in first", "error");
    return;
  }

  if (IS_PENDING) {
    toast("Account pending approval", "info");
    return;
  }

  window.JOB_COMPLETED = false;
  JOB_ID = null;
  LAST_UPLOADED_FILENAME = file.name;

  setUIBusy(true);
  document.body.classList.add("processing-active");

  const header = document.getElementById("processingHeader");
  if (header) header.textContent = `PROCESSING ${file.name}`;

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);

  let res;
  try {
    res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: "Bearer " + ID_TOKEN },
      body: fd
    });
  } catch {
    toast("Network error during upload", "error");
    setUIBusy(false);
    return;
  }

  if (!res.ok) {
    toast("Upload failed", "error");
    setUIBusy(false);
    return;
  }

  const data = await res.json();
  JOB_ID = data.job_id;
  localStorage.setItem("active_job_id", JOB_ID);

  startPolling();
}

// -----------------------------
// YOUTUBE URL (UI ONLY FOR NOW)
// -----------------------------
function submitUrl(mode) {
  const input =
    mode === "OCR"
      ? document.getElementById("ocrUrl")
      : document.getElementById("transcribeUrl");

  const url = input?.value.trim();
  if (!url) {
    toast("Please enter a YouTube URL", "error");
    return;
  }

  if (!/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url)) {
    toast("Invalid YouTube URL", "error");
    return;
  }

  toast("YouTube processing not wired yet", "info");
}
