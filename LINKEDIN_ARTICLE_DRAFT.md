# Building a Production-Ready OCR + Transcription Platform with Agentic AI (UI + API + Worker)

This is a practitioner-focused walkthrough of how I designed and hardened a 3-repo platform for:
- `PDF/Image -> Hindi Text (OCR)`
- `Audio/Video -> Hindi Text (Transcription)`

Production UI: [https://doc-transcribe-ui.vercel.app/](https://doc-transcribe-ui.vercel.app/)

The platform is built as:
- UI repo: `doc-transcribe-ui` (Vercel-hosted front-end)
- API repo: `doc-transcribe-api` (FastAPI orchestration + contracts + auth + status)
- Worker repo: `doc-transcribe-worker` (queue consumer + OCR/Transcription execution)

---

## 1) Why this problem matters

Users do not just need “AI output”. They need:
- predictable experience before upload,
- transparent progress during processing,
- reliable completion/error behavior,
- fast support turnaround when anything fails.

So the focus was not only model integration, but full-stack production readiness: architecture boundaries, contracts, observability, retries, idempotency, security, regression gates, and now agentic extensions.

---

## 2) Functional Requirements (FR)

Core FRs implemented across the 3 repos:
1. Google-authenticated sign-in and session restore.
2. Upload support for OCR (`pdf/image`) and transcription (`audio/video`).
3. Async job lifecycle: `QUEUED -> PROCESSING -> COMPLETED/FAILED/CANCELLED`.
4. Real-time progress polling + stage updates.
5. Downloadable output artifacts.
6. Job history with filtering/pagination and metadata.
7. Cancellation and retry behavior.
8. Deterministic error messaging with stable error codes.
9. Pre-upload guidance (Smart Intake stories): route detection, warnings, ETA (feature-gated rollout).

---

## 3) Non-Functional Requirements (NFR)

NFRs intentionally engineered:
1. **Reliability**: guarded state transitions, retry with backoff+jitter, DLQ enrichment.
2. **Observability**: structured logs, mandatory fields (`request_id`, `job_id`), stage logs, metrics.
3. **Maintainability**: layer boundaries, modularization, canonical contract, contributor standards.
4. **Scalability**: queue partitioning, worker concurrency controls, load baseline scripts.
5. **Security**: strict token validation (`iss/aud/exp/nbf/azp`), CORS allowlist, file validation.
6. **Cost governance**: limits/quotas, retry budgets, user-facing effort/cost hints.
7. **Operability**: readiness checks, runbooks, feature flags for controlled rollout.
8. **Quality governance**: unit/integration tests, local/cloud bounded regression, CI gates.

---

## 4) Logical / Layered Architecture (with all external systems + all 10 agents)

```mermaid
flowchart TB
  classDef ext fill:#eef6ff,stroke:#3b82f6,color:#0f172a,stroke-width:1px;
  classDef repo fill:#f8fafc,stroke:#334155,color:#111827,stroke-width:1px;
  classDef agent fill:#fff7ed,stroke:#f97316,color:#7c2d12,stroke-width:1px;

  U["End User (Browser/Mobile)"]:::ext
  GID["Google Identity (OIDC ID Token)"]:::ext
  UI["UI Repo (Vercel)\nHTML/CSS/JS\nUpload, Polling, History, UX"]:::repo
  API["API Repo (FastAPI)\nAuth, Contract, Upload Orchestration,\nStatus, Jobs, Intake"]:::repo
  R["Redis (Render Key-Value)\nQueue + Job Status + Idempotency"]:::ext
  W["Worker Repo (Python)\nQueue Consumer, OCR/Transcription,\nRetry, DLQ, State Updates"]:::repo
  GCS["Google Cloud Storage (GCS)\nInput/Output artifacts"]:::ext
  VX["Vertex AI / Gemini\nOCR + Transcription processing"]:::ext
  PIL["Local Quality Heuristics (Pillow)\ncontrast/blur/text-density scoring"]:::ext
  DLQ["DLQ Queue (Redis List)\nFailed payloads + diagnostics"]:::ext
  GH["GitHub Actions CI\nUnit/Contract Gates"]:::ext

  U --> UI
  UI -->|ID Token| API
  API --> GID
  API --> R
  R --> W
  W --> R
  API --> GCS
  W --> GCS
  W --> VX
  W --> PIL
  W --> DLQ
  GH --> UI
  GH --> API
  GH --> W

  subgraph AG["Agent Plane (PRS-035 to PRS-044)"]
    direction TB
    A1["1. Smart Intake Agent"]:::agent
    A2["2. OCR Quality Agent"]:::agent
    A3["3. Transcription Quality Agent"]:::agent
    A4["4. Retry & Recovery Agent"]:::agent
    A5["5. Cost Guardrail Agent"]:::agent
    A6["6. Queue Orchestration Agent"]:::agent
    A7["7. User Assist Agent"]:::agent
    A8["8. Incident Triage Agent"]:::agent
    A9["9. Regression Certification Agent"]:::agent
    A10["10. Product Insights Agent"]:::agent
  end

  AG --> UI
  AG --> API
  AG --> W
  AG --> R
  AG --> GH
```

---

## 5) Deployment Architecture Diagram

```mermaid
flowchart LR
  classDef cloud fill:#f0f9ff,stroke:#0284c7,color:#0f172a,stroke-width:1px;
  classDef app fill:#f8fafc,stroke:#475569,color:#111827,stroke-width:1px;
  classDef agent fill:#fff7ed,stroke:#f97316,color:#7c2d12,stroke-width:1px;

  subgraph INTERNET["Public Internet"]
    USER["User Browser / Mobile"]:::cloud
  end

  subgraph VERCEL["Vercel"]
    UIAPP["doc-transcribe-ui\nStatic UI + JS Runtime"]:::app
  end

  subgraph RENDER["Render"]
    APIAPP["doc-transcribe-api\nFastAPI Service"]:::app
    REDIS["Redis Key-Value + Queue"]:::app
    WORKER["doc-transcribe-worker\nBackground Worker Service"]:::app
    PILLSCORE["Pillow Quality Scoring\n(local deterministic heuristics)"]:::app
  end

  subgraph GCP["Google Cloud"]
    GOOGLEAUTH["Google Identity (OIDC)"]:::cloud
    GCSSVC["Cloud Storage Bucket"]:::cloud
    VERTEX["Vertex AI / Gemini Models"]:::cloud
  end

  subgraph OPS["Engineering / Ops"]
    GHCI["GitHub Actions CI/CD"]:::cloud
    RUNBOOK["Runbooks + Regression Scripts"]:::cloud
  end

  USER --> UIAPP
  UIAPP --> APIAPP
  APIAPP --> GOOGLEAUTH
  APIAPP --> REDIS
  WORKER --> REDIS
  APIAPP --> GCSSVC
  WORKER --> GCSSVC
  WORKER --> VERTEX
  WORKER --> PILLSCORE
  GHCI --> UIAPP
  GHCI --> APIAPP
  GHCI --> WORKER
  RUNBOOK --> APIAPP
  RUNBOOK --> WORKER

  subgraph AGDEP["Agentic Extensions on Deployment"]
    SA["A1 Smart Intake"]:::agent
    OQ["A2 OCR Quality"]:::agent
    TQ["A3 Transcription Quality"]:::agent
    RR["A4 Retry/Recovery"]:::agent
    CG["A5 Cost Guardrail"]:::agent
    QO["A6 Queue Orchestrator"]:::agent
    UA["A7 User Assist"]:::agent
    IT["A8 Incident Triage"]:::agent
    RC["A9 Regression Certification"]:::agent
    PI["A10 Product Insights"]:::agent
  end

  SA --> UIAPP
  SA --> APIAPP
  OQ --> WORKER
  TQ --> WORKER
  RR --> WORKER
  CG --> APIAPP
  QO --> WORKER
  UA --> UIAPP
  IT --> APIAPP
  IT --> WORKER
  RC --> GHCI
  PI --> APIAPP
```

---

## 6) Design Flow Diagram (Request lifecycle + agent touchpoints)

```mermaid
sequenceDiagram
  autonumber
  participant User as User
  participant UI as UI (Vercel)
  participant API as API (FastAPI)
  participant Redis as Redis Queue/Status
  participant Worker as Worker
  participant GCS as Cloud Storage
  participant Vertex as Vertex/Gemini
  participant Pillow as Pillow Scoring

  User->>UI: Select file
  UI->>API: POST /intake/precheck (A1)
  API->>API: Route detect + warnings + ETA (A1)
  API-->>UI: detected_job_type, warnings, eta_sec, confidence
  UI-->>User: Show pre-upload guidance (A7)

  User->>UI: Confirm upload
  UI->>API: POST /upload (id token, request_id, idem key)
  API->>Redis: Save job_status + enqueue
  API-->>UI: job_id, request_id

  loop Polling
    UI->>API: GET /status/{job_id}
    API->>Redis: Read status hash
    API-->>UI: status/stage/progress
    UI-->>User: Live progress + guidance (A7)
  end

  Worker->>Redis: BRPOP job
  Worker->>GCS: Fetch input
  Worker->>Vertex: OCR/Transcription
  Worker->>Pillow: Compute local quality scores (A2/A3)
  Worker->>GCS: Write output text
  Worker->>Redis: Update COMPLETED/FAILED + metadata

  Note over Worker,Redis: A2/A3 quality scoring enriches metadata (local Pillow heuristics)
  Note over Worker,Redis: A4 retry policy + DLQ on fatal failures
  Note over API,Redis: A5 quota/cost guardrails
  Note over Worker,Redis: A6 queue balancing + concurrency controls
  Note over API,Worker: A8 triage correlates request_id/job_id evidence
  Note over UI,API: A9 certifies regression/release readiness (scripts+CI)
  Note over API,UI: A10 generates product usage/failure insights
```

---

## 7) Architecture and design choices that mattered

1. **Canonical contract first**
- One source of truth for job/status fields reduced UI/API/Worker drift.

2. **Idempotency + deterministic error envelopes**
- Crucial for handling retries and user trust.

3. **Observability by design**
- Correlation IDs, stage logs, and metrics turned “unknown failures” into diagnosable incidents.

4. **Feature-flagged rollout**
- Smart Intake was shipped safely without breaking legacy behavior.

5. **Regression as a product capability**
- Local and cloud bounded regression reduced release risk materially.

6. **Quality scoring kept local-first (non-LLM)**
- OCR/transcription quality scores are designed to be computed locally via Pillow/text heuristics for fast, cheap, stable behavior.
- LLM-based quality scoring remains an optional future enhancement, not a current dependency.

---

## 8) User impact summary

What improved for end users:
- clearer expectations before upload,
- fewer avoidable failures,
- more stable status/progress UX,
- better error clarity and support turnaround.

What improved for engineering/ops/product:
- cleaner architecture boundaries,
- faster root-cause analysis,
- predictable rollout/rollback,
- stronger confidence in release quality.

Sample quality payload (local deterministic scoring):
```json
{
  "ocr_quality_score": 0.78,
  "low_confidence_pages": [2, 5],
  "quality_hints": [
    "Page 2: low contrast detected",
    "Page 5: image appears blurry"
  ],
  "quality_method": "pillow_local_heuristics_v1"
}
```

---

## 9) What’s next

Near term:
- complete remaining agent stories for `PRS-035` to `PRS-044`.
- operationalize quality, triage, and certification agents.
- keep quality scoring deterministic first (Pillow-based), then optionally add LLM scoring as an enrichment layer.

Strategic:
- move to `PRS-045`: Digambar Jainism GPT using RAG, reusing this reliability and observability foundation.

---

## 10) Suggested visual export workflow (for actual image files)

If you need PNG/SVG assets for LinkedIn carousel:
1. Render Mermaid blocks from this markdown in VS Code/Markdown preview.
2. Export each diagram as PNG/SVG.
3. Optionally annotate in Figma/Excalidraw for publication-ready branding.
