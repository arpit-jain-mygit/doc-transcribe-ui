function uploadFrom(type, inputId) {
  const input = document.getElementById(inputId);
  if (!input.files.length) return toast("Please select a file", "error");
  upload(type, input.files[0]);
}

async function upload(type, file) {
  if (UI_BUSY || !file || !ID_TOKEN) return;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  LAST_UPLOADED_FILENAME = file.name;

  setUIBusy(true);

  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: { Authorization: "Bearer " + ID_TOKEN },
    body: fd
  });

  if (res.status === 401) return logout();
  if (res.status === 403) return showPending();

  const data = await res.json();
  JOB_ID = data.job_id;
  window.JOB_COMPLETED = false;
  localStorage.setItem("active_job_id", JOB_ID);
  startPolling();
  pollStatus();
}

async function forceDownload(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = url.split("/").pop();
  a.click();
  URL.revokeObjectURL(a.href);
}