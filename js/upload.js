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

  if (typeof bootstrapProgress === "function") {
    bootstrapProgress("Uploading file…", 5);
  }

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
    const payload = await safeJson(res);
    toast(responseErrorMessage(res, payload, "Upload failed"), "error");
    setUIBusy(false);
    return;
  }

  const data = await safeJson(res);
  if (!data || data._nonJson || !data.job_id) {
    toast("Upload failed: invalid server response", "error");
    setUIBusy(false);
    return;
  }
  JOB_ID = data.job_id;
  localStorage.setItem("active_job_id", JOB_ID);

  startPolling();
}

function forceDownload(url, filename) {
  if (!filename) {
    throw new Error("forceDownload called without filename");
  }

  try {
    const resolved = new URL(url, window.location.href);
    const isSameOrigin = resolved.origin === window.location.origin;

    if (!isSameOrigin) {
      // Cross-origin signed URLs cannot be fetched due to CORS.
      // Navigate directly; API will set attachment headers.
      window.location.assign(resolved.href);
      return;
    }

    fetch(resolved.href)
      .then(res => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
      })
      .catch(e => {
        console.error("forceDownload failed", e);
        window.open(resolved.href, "_blank", "noopener,noreferrer");
      });
  } catch (e) {
    console.error("forceDownload failed", e);
  }
}
