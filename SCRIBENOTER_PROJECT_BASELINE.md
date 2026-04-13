# ScribeNoter — Project Baseline Documentation
**Last Updated:** April 13, 2026
**Owner:** Nina Basiliko (devops@scribenoter.com)
**GitHub:** wanderpawco

---

## 1. What ScribeNoter Does

ScribeNoter is an AI-powered music transcription web application. Users upload a recorded audio file or capture live audio, select specific instruments, and receive transcribed sheet music, MIDI, and MusicXML output.

**Instrument range:** 22 instruments — Vocals (lead/backing), Bass, Electric Guitar, Acoustic Guitar, Piano, Organ, Strings, Drums, Trumpet, French Horn, Trombone, Tuba, Flugelhorn, Baritone/Euphonium, Flute, Oboe, Clarinet, Alto Saxophone, Tenor Saxophone, Soprano Saxophone, Bassoon

**Output formats:**
- PDF Sheet Music (all tiers)
- MIDI File (Pro+)
- MusicXML (Pro+)
- Guitar Pro GP5 (Studio — planned, not yet implemented)

---

## 2. Live URLs

| Service | URL |
|---|---|
| Frontend (Lovable) | https://scribe-notes-music.lovable.app |
| Backend API (Render) | https://scribenoter-transcription-api.onrender.com |
| Production domain (pending) | https://scribenoter.com |

---

## 3. Repositories

| Repo | Path | Purpose |
|---|---|---|
| Frontend | `wanderpawco/scribe-notes-music` | React/Vite app + Supabase edge functions |
| Backend | `wanderpawco/scribenoter-transcription-api` | Python FastAPI on Render |

Local paths:
- `/Users/ninab/Documents/GitHub/scribe-notes-music`
- `/Users/ninab/Documents/GitHub/scribenoter-transcription-api`

---

## 4. Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + custom design tokens
- **UI Components:** Radix UI + shadcn/ui
- **Routing:** React Router v6
- **Auth & Database:** Supabase (via Lovable Cloud)
- **File Upload:** tus-js-client v4.1.0 (TUS resumable uploads)
- **Sheet Music Rendering:** OpenSheetMusicDisplay (OSMD) v1.8.8
- **Hosting:** Lovable Cloud

### Backend (Render)
- **Framework:** FastAPI + Uvicorn
- **HTTP Client:** httpx (async) + requests (sync, for Klangio submit)
- **Runtime:** Python 3.11.9
- **Tier:** Standard ($25/mo)
- **Job persistence:** `/tmp/scribenoter_jobs/{job_id}.json`
- **Current version:** v6.0

### Edge Functions (Supabase/Lovable Cloud)
Located in `supabase/functions/`:
- `start-transcription` — receives transcription request, calls Render, updates Supabase status

### Third-Party APIs
- **AudioShake** — stem separation ($1.00 credit/min/stem). Key: `AUDIOSHAKE_API_KEY`
- **Klangio** — transcription → MusicXML/MIDI ($99/mo Startup, 500 requests). Key: `KLANGIO_API_KEY`
- **Supabase** — database, auth, storage, edge functions
- **Music.AI** — DEPRECATED. No longer used. Subscription not yet cancelled.

---

## 5. Pipeline Architecture (Current — v6.0)

```
User uploads audio (TUS, 6MB chunks, session JWT)
    ↓
Supabase Storage (private bucket: audio-uploads)
    ↓ Signed URL (1hr)
start-transcription edge function
    → Inserts transcription row (status: "transcribing")
    → POSTs to Render /transcribe (returns immediately — fire and forget)
    ↓
Render FastAPI v6.0
    → asyncio.ensure_future(run_transcription()) — runs async in background
    → AudioShake stem separation
        → Submits audio URL to AudioShake
        → Polls until "completed"
        → Downloads stem WAV file
    → Klangio transcription (attempt 1: stem audio)
        → If FAILED: attempt 2 with full audio + "detect" model
    → On COMPLETED: fetches MusicXML from /xml endpoint
    → Writes base64 MusicXML to Supabase transcription_outputs
    → Updates transcriptions.status = "completed"
    ↓
Frontend polls transcriptions.status every 5s
    → On "completed": loads transcription_outputs
    → OSMD renders MusicXML as sheet music
    → Download buttons active
```

**Known issue:** Frontend currently does not display results despite backend completing. Under investigation — see Section 12.

---

## 6. Database Schema

### `transcriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| file_name | text | Original filename |
| file_path | text | Storage path |
| song_title | text | User-entered title |
| status | text | pending → transcribing → completed/failed |
| selected_instruments | text[] | e.g. ["Bass"] |
| detected_key | text | Default "C Major" |
| detected_bpm | int | Default 120 |
| error_message | text | Set on failure |
| completed_at | timestamptz | Set when completed |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### `transcription_outputs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| transcription_id | uuid | FK to transcriptions |
| instrument | text | e.g. "Bass" |
| format | text | "musicxml" or "midi" |
| file_path | text | Base64-encoded file content |
| created_at | timestamptz | Auto |

### Storage
- Bucket: `audio-uploads` (private)
- Path: `{user_id}/{uuid}/{filename}`
- Signed URLs (1hr) used for AudioShake access

---

## 7. Row Level Security (RLS)

### Standard policies (Lovable-managed)
- **authenticated users** — read/insert/update own rows (`user_id = auth.uid()`)
- **anon** — blocked by default

### Additional policies added April 13, 2026
These were added to allow Render (using anon key) to write results back to Supabase:
- `allow_anon_insert_outputs` on `transcription_outputs` FOR INSERT TO anon WITH CHECK (true)
- `allow_anon_update_transcriptions` on `transcriptions` FOR UPDATE TO anon USING (true) WITH CHECK (true)

**Why anon key:** The Supabase project is managed by Lovable's organization. The service_role key is not exposed. Render uses the anon key with relaxed RLS as a workaround.

---

## 8. Klangio Model Mapping

The `bass` and `wind` Klangio models only produce MIDI, not MusicXML. All instruments are mapped to models that support MusicXML output.

| Instrument | AudioShake Stem | Klangio Model |
|---|---|---|
| Lead Vocals | vocals_lead | vocal |
| Backing Vocals | vocals_backing | vocal |
| Bass | bass | guitar |
| Piano | piano | piano |
| Organ | keys | piano |
| Strings | strings | universal |
| Electric Guitar | guitar_electric | guitar |
| Acoustic Guitar | guitar_acoustic | guitar |
| Drums | drums | universal |
| Trumpet | wind | universal |
| French Horn | wind | universal |
| Trombone | wind | universal |
| Tuba | wind | universal |
| Flugelhorn | wind | universal |
| Baritone/Euphonium | wind | universal |
| Flute | wind | universal |
| Oboe | wind | universal |
| Clarinet | wind | universal |
| Alto Saxophone | wind | universal |
| Tenor Saxophone | wind | universal |
| Soprano Saxophone | wind | universal |
| Bassoon | wind | universal |

---

## 9. Pricing Tiers (Defined, Not Yet Enforced)

| Tier | Price | Transcriptions | Instruments | Outputs |
|---|---|---|---|---|
| Free | $0 | 3/mo | 1 | PDF only |
| Pro | $9.99/mo | 30/mo | 3 | PDF + MIDI + MusicXML |
| Studio | $24.99/mo | 100/mo | 6 | + Guitar Pro + Live Capture |

---

## 10. Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | Index.tsx | Landing page |
| `/app` | AppPage.tsx | Main transcription app (3-stage flow) |
| `/pricing` | PricingPage.tsx | Standalone pricing page |
| `/dashboard` | Dashboard.tsx | User's transcription history |
| `/transcription/:id` | TranscriptionResult.tsx | View/download past transcription |
| `/terms` | TermsPage.tsx | Terms of service |
| `/privacy` | PrivacyPage.tsx | Privacy policy |
| `/contact` | ContactPage.tsx | Contact page |
| `*` | NotFound.tsx | 404 page |

---

## 11. AppPage — 3-Stage Flow

**Stage 0 — Upload**
- Dark studio aesthetic (#05050F background)
- Cymatics/Chladni grayscale animation as hero background (not confirmed working in live app)
- TUS file upload with real progress bar
- Live audio recording via MediaRecorder (10-min max)
- YouTube/TikTok/Instagram URL input — UI only, backend download not yet implemented
- Supported formats: MP3, WAV, FLAC, M4A up to 500MB

**Stage 1 — Select Instruments**
- AI scanning animation (1.5s)
- 22-instrument grid, color-coded by family
- Song title input (required — Transcribe button disabled when empty)
- Rights confirmation checkbox
- Estimated processing time badge

**Stage 2 — Processing + Results**
- Cymatics animation as background (not confirmed working in live app)
- 3-step progress indicator with incorrect timer
- On completion: full-width OSMD sheet music
- Two-row toolbar: instrument tabs + dark download buttons
- Downloads: PDF (print), MIDI, MusicXML, Guitar Pro (locked)

---

## 12. Known Issues as of April 13, 2026

### CRITICAL
- [ ] **Frontend not showing results** — Backend completes, Supabase updated to `completed`, `transcription_outputs` row inserted — but UI stays on "analyzing pitch and rhythm." Root cause: frontend polls `transcriptions.status` every 5s but the `transcriptionId` in state may not match the completed row. Diagnosis: add `console.log("Polling ID:", transcriptionId, "status:", data.status)` inside the poll useEffect.
- [ ] **No user-facing error message** — When transcription fails, frontend shows nothing. User waits forever.

### PIPELINE
- [ ] **Klangio stem transcription always fails** — First attempt (stem audio) always returns FAILED. Falls back to full audio which succeeds. Costs double Klangio credits per job. Root cause unknown.
- [ ] **MIDI not retrieved** — Klangio `detect` model returns 404 for MIDI endpoint. Only MusicXML is being retrieved.

### UI/UX
- [ ] Processing screen timer is incorrect
- [ ] Timer stops when user navigates away from processing page
- [ ] Cymatics animation on processing/upload screens not confirmed working in live app
- [ ] Scroll to top on stage transition not confirmed working

### LAUNCH BLOCKERS
- [ ] Stripe integration (Pro $9.99/mo, Studio $24.99/mo)
- [ ] Tier enforcement
- [ ] Custom domain — scribenoter.com not yet pointed to Lovable
- [ ] Supabase email template still shows generic Supabase copy
- [ ] Free transcription counter in navbar
- [ ] Cancel Music.AI subscription (no longer used, still being charged)

---

## 13. Session History — Major Bug Fixes (April 13, 2026)

This section documents every major problem encountered and how it was fixed, so future sessions don't repeat the same work.

### Bug: Music.AI removed, pipeline switched to AudioShake + Klangio
**Fix:** Rewrote main.py to use AudioShake for stem separation and Klangio for transcription. Removed all Music.AI and Basic Pitch code.

### Bug: Render serving old cached bytecode despite new deploys
**Symptom:** Health endpoint returned old version string after multiple deploys.
**Root cause:** Render cached compiled `.pyc` files in build cache.
**Fix:** Render → "Clear cache and deploy." Also changing `PYTHON_VERSION` env var forces complete venv rebuild.

### Bug: FastAPI BackgroundTasks silently swallowing exceptions
**Symptom:** POST /transcribe returned 200 but nothing ran after it.
**Root cause:** FastAPI BackgroundTasks suppress all exceptions silently.
**Fix:** Switched to `asyncio.ensure_future()` which fires the coroutine without blocking the response and surfaces exceptions properly.

### Bug: sync-in-async error in submit_to_klangio
**Symptom:** `RuntimeError: Attempted to send a sync request with an AsyncClient instance`
**Root cause:** File was opened synchronously inside an async httpx client context running in a thread with its own event loop.
**Fix:** Replaced async httpx with synchronous `requests` library for Klangio submit, wrapped in `loop.run_in_executor()`.

### Bug: Background threading dying silently on Render
**Symptom:** Thread printed `THREAD RUNNING` then died before creating event loop.
**Root cause:** Creating a new asyncio event loop inside a thread fails silently in Render's Python 3.11.9 environment.
**Fix:** Switched from threading to `asyncio.ensure_future()` directly in the FastAPI endpoint.

### Bug: Edge function timing out waiting for Render
**Symptom:** CORS error on `start-transcription`, jobs stopped reaching Render.
**Root cause:** Direct `await run_transcription()` in endpoint meant Render didn't respond until full transcription completed (~5 min). Edge function timed out at 30s.
**Fix:** v6.0 uses `asyncio.ensure_future()` so endpoint returns immediately.

### Bug: Klangio gen_xml always false
**Symptom:** Klangio job response showed `"gen_xml": false`.
**Root cause:** `bass` and `wind` models only produce MIDI — no MusicXML support.
**Fix:** Remapped all instruments to MusicXML-supporting models (guitar, piano, vocal, universal). Output param: `{'outputs': ['mxml', 'midi']}` passed as `data=` in requests.

### Bug: Supabase 401 on output insert
**Symptom:** `new row violates row-level security policy for table "transcription_outputs"`
**Root cause:** Render uses the anon key (service_role key inaccessible — managed by Lovable). RLS blocked anon inserts.
**Fix:** Added `allow_anon_insert_outputs` and `allow_anon_update_transcriptions` RLS policies via Supabase SQL editor in Lovable Cloud.

### Bug: Supabase key had trailing newline
**Symptom:** `Illegal header value b'eyJ...key\n'`
**Root cause:** Trailing `\n` newline included when pasting key into Render env vars.
**Fix:** Strip newline before copying: `grep PUBLISHABLE .env | cut -d'"' -f2 | tr -d '\n' | pbcopy`

---

## 14. Environment Variables

### Render (set in dashboard.render.com → Environment)
- `KLANGIO_API_KEY` — Klangio API key
- `AUDIOSHAKE_API_KEY` — AudioShake API key
- `SUPABASE_URL` — `https://wtsuzefvmuuxrcbbwgxv.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` — currently set to anon key (workaround)
- `PYTHON_VERSION` — `3.11.9`
- `APP_VERSION` — dummy var, change value to force Render restart

### Supabase Edge Functions (Lovable Cloud secrets)
- `KLANGIO_API_KEY`
- `AUDIOSHAKE_API_KEY`
- `MUSIC_AI_API_KEY` (deprecated — delete after cancelling subscription)

### Frontend (Vite env vars — in .env)
- `VITE_SUPABASE_URL` — `https://wtsuzefvmuuxrcbbwgxv.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

### Critical note on Supabase service_role key
The Supabase project was created by Lovable and is managed under their organization. The service_role key is not accessible via supabase.com. Render currently uses the anon key with relaxed RLS policies as a workaround. To get the real service_role key, contact Lovable support.

---

## 15. Services & Costs

| Service | Cost | Purpose | Status |
|---|---|---|---|
| AudioShake | $1.00/min/stem | Stem separation | Active |
| Klangio | $99/mo (500 req) | Transcription → MusicXML | Active |
| Render | $25/mo | Backend API — Standard tier | Active |
| Supabase | Free tier | DB, auth, storage, functions | Active |
| Lovable | Subscription | Frontend hosting | Active |
| Music.AI | ~$0.07/min/stem | Stem separation (deprecated) | CANCEL — no longer used |

---

## 16. Business Context

- **Entity:** Nina Basiliko owns an existing LLC. ScribeNoter needs to be added as a DBA under it.
- **EIN:** Pending DBA registration
- **Business bank:** Mercury account opened
- **Developer:** No active contractor — Polsia is no longer working on the project
