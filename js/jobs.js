async function loadJobs() {
  if (!ID_TOKEN) return;

  const res = await fetch(`${API}/jobs`, {
    headers: { Authorization: "Bearer " + ID_TOKEN }
  });

  if (res.status === 401) return logout();

  const jobs = await res.json();
  const box = document.getElementById("jobs");
  box.innerHTML = "";

  jobs.forEach(j => {
    const div = document.createElement("div");
    div.className = "job";

    div.innerHTML = `
      <div class="job-title">${j.job_type} — ${formatStatus(j.status)}</div>
      <div class="job-meta">${formatRelativeTime(j.updated_at)}</div>
      ${
        j.output_path
          ? `<a href="#" class="history-download" data-url="${j.output_path}">⬇ Download</a>`
          : ""
      }
    `;

    // -------------------------------
    // FIX: FORCE DOWNLOAD WITH NAME
    // -------------------------------
    const downloadLink = div.querySelector(".history-download");
    if (downloadLink) {
      downloadLink.onclick = (e) => {
        e.preventDefault();
        forceDownload(j.output_path, "transcript.txt");
      };
    }

    box.appendChild(div);
  });
}

function renderJob(job) {
  const row = document.createElement("div");
  row.className = "job-row";

  const isYoutube = job.source === "youtube";

  row.innerHTML = `
    <div class="job-main">
      <strong>${job.mode || "JOB"}</strong>
      <span class="job-source">
        ${isYoutube ? "🔗 YouTube" : "📄 File"}
      </span>
    </div>

    <div class="job-meta">
      ${
        isYoutube
          ? `<a href="${job.url}" target="_blank" rel="noopener">
               ${job.url}
             </a>`
          : `<span>${job.input_file || "—"}</span>`
      }
    </div>

    <div class="job-actions">
      ${
        job.output_file
          ? `<a href="${job.download_url}" class="history-download">
               ⬇ Download
             </a>`
          : `<span class="job-pending">Processing…</span>`
      }
    </div>
  `;

  return row;
}

