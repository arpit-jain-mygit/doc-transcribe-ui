# UI Guide (End-to-End)

This guide covers how to run and use the `doc-transcribe-ui` app from start to finish.

## 1. Prerequisites

- `Python 3` installed
- API available:
  - Local API (recommended for local testing), or
  - Render API (cloud)
- Worker running (if your API uses async queue processing)

## 2. Project Structure (UI)

- `index.html`
- `css/`
- `js/`
- `partials/`
- `server.py` (local static server + `/api` proxy)

## 3. Start UI Locally

From:
`/Users/arpitjain/VSProjects/doc-transcribe-ui`

Run:

```bash
python3 server.py
```

Default UI URL:
`http://127.0.0.1:4200`

You can also use:
`http://localhost:4200`

## 4. API Routing Modes (UI)

UI supports two API modes in `js/config.js`:

- `render` -> `https://doc-transcribe-api.onrender.com`
- `local` -> `/api` (proxied by `server.py` to local API)

### Switch to Local API

Open UI with:

`http://localhost:4200/?api=local`

### Switch to Render API

Open UI with:

`http://localhost:4200/?api=render`

The selected mode is stored in `localStorage` (`doc_api_mode`).

## 5. Run Local API (if using local mode)

In API repo:
`/Users/arpitjain/PycharmProjects/doc-transcribe-api`

Start API (example):

```bash
.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8080
```

Then start UI server (`python3 server.py`), which proxies `/api/*` to `http://127.0.0.1:8080`.

## 6. Sign-In Flow

1. Open UI.
2. Click Google Sign-In.
3. On success, token is saved in local storage (`doc_app_auth`).
4. Auth-only UI sections become visible.

## 7. Upload and Processing Flow

1. Drag/drop or select a supported file.
2. UI auto-detects mode:
   - OCR: `.pdf, .png, .jpg, .jpeg, .webp, .tif, .tiff`
   - Transcription: `.mp3, .wav, .m4a, .mp4, .mov, .webm`
3. Upload starts automatically.
4. Processing panel appears with:
   - progress %
   - stage text
   - cancel button
5. On completion:
   - completion card appears
   - download output is available

## 8. History Flow

1. Open `History` tab.
2. Filter by type/status.
3. Use refresh button to reload.
4. Use Load More for pagination.

## 9. Cancel Flow

1. Click `Cancel Job` during processing.
2. Confirm prompt.
3. Job moves to cancelled state (visible in history).

## 10. Download Behavior

- Same-origin downloads use fetch + blob flow.
- Cross-origin signed URLs are opened via direct navigation (browser-handled).

## 11. Common Troubleshooting

### A) `GET /api/jobs 404 (File not found)`

Cause:
- UI served without proxy logic, or wrong server command.

Fix:
- Start UI using `python3 server.py` from UI repo root.
- Ensure URL is `http://localhost:4200` and not a different static server.

### B) CORS errors (`No 'Access-Control-Allow-Origin' header`)

Cause:
- Browser calling API/storage directly from a different origin without proper CORS.

Fix:
- Use local mode (`?api=local`) so UI calls `/api/*` through proxy.
- Or fix CORS at API/storage bucket level.

### C) `Unexpected token '<' ... not valid JSON`

Cause:
- Endpoint returned HTML error page (404/500) where JSON was expected.

Fix:
- Check request URL/mode.
- Verify API is up and route exists.
- Confirm proxy server is running.

### D) `address already in use` on port 8080

Cause:
- Another API process already running on 8080.

Fix:
- Stop existing process, or run API on another port and set `API_ORIGIN`.

## 12. Useful Commands

UI server:

```bash
cd /Users/arpitjain/VSProjects/doc-transcribe-ui
python3 server.py
```

API mode URLs:

- Local API mode: `http://localhost:4200/?api=local`
- Render API mode: `http://localhost:4200/?api=render`

## 13. Notes

- `ui.log` is local runtime output and should not be committed.
- `.env`, `uploads/`, `output_texts/`, `transcripts/` are runtime artifacts in API/worker repos and should generally stay untracked.
