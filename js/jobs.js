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
  <div class="job-row-inline">
    <div class="job-left">
      <span class="job-type">${j.job_type}</span>
      <span class="job-status">— ${formatStatus(j.status)}</span>
    </div>

    <div class="job-time">
      ${formatRelativeTime(j.updated_at)}
    </div>

    ${j.output_path
        ? `<a href="#" class="history-download" data-url="${j.output_path}">
             ⬇ Download
           </a>`
        : (j.status === "CANCELLED" || j.status === "FAILED")
          ? `<span class="job-pending">${formatStatus(j.status)}</span>`
          : `<span class="job-pending">Processing…</span>
             <a href="#" class="history-cancel" data-job-id="${j.job_id}">
               Cancel
             </a>`
      }
  </div>
`;


    // -------------------------------
    // FIX: FORCE DOWNLOAD WITH NAME
    // -------------------------------
    const downloadLink = div.querySelector(".history-download");
    if (downloadLink) {
      downloadLink.onclick = (e) => {
        e.preventDefault();
        forceDownload(j.output_path, j.output_filename || "transcript.txt");
      };
    }

    const cancelLink = div.querySelector(".history-cancel");
    if (cancelLink) {
      cancelLink.onclick = async (e) => {
        e.preventDefault();
        if (typeof cancelJobById !== "function") return;
        await cancelJobById(j.job_id);
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
      ${isYoutube
      ? `<a href="${job.url}" target="_blank" rel="noopener">
               ${job.url}
             </a>`
      : `<span>${job.input_file || "—"}</span>`
    }
    </div>

    <div class="job-actions">
      ${job.output_file
      ? `<a href="${job.download_url}" class="history-download">
               ⬇ Download
             </a>`
      : `<span class="job-pending">Processing…</span>`
    }
    </div>
  `;

  return row;
}
