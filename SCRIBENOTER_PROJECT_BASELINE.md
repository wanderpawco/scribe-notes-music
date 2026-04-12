# ScribeNoter — Project Baseline Documentation
**Last Updated:** April 12, 2026  
**Owner:** Nina Basiliko (devops@scribenoter.com)  
**Developer:** Polsia (contractor)  
**GitHub:** wanderpawco

---

## 1. What ScribeNoter Does

ScribeNoter is an AI-powered music transcription web application. Users upload a recorded audio file or capture live audio, select specific instruments, and receive transcribed sheet music, MIDI, and MusicXML output.

**Instrument range:** Vocals (lead/backing), Drums, Bass, Electric Guitar, Acoustic Guitar, Piano, Organ, Strings, Brass, Woodwinds

**Output formats:**
- PDF Sheet Music (all tiers)
- MIDI File (Pro+)
- MusicXML (Pro+)
- Guitar Pro GP5 (Studio — planned, not yet implemented)

---

## 2. Live URLs

| Service | URL |
|---|---|
| Frontend (Lovable) | https://scribe-notes-sparkle.lovable.app |
| Backend API (Render) | https://scribenoter-transcription-api.onrender.com |
| Production domain (pending) | https://scribenoter.com |

---

## 3. Repositories

| Repo | Path | Purpose |
|---|---|---|
| Frontend | `wanderpawco/scribe-notes-music` | React/Vite app + Supabase edge functions |
| Backend | `wanderpawco/scribenoter-transcription-api` | Python FastAPI + Basic Pitch on Render |

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
- **File Upload:** tus-js-client v4.1.0 (TUS resumable uploads — bypasses 50MB limit)
- **Sheet Music Rendering:** OpenSheetMusicDisplay (OSMD) v1.8.8
- **Hosting:** Lovable Cloud (sandbox tier)

### Backend (Render)
- **Framework:** FastAPI + Uvicorn
- **Transcription:** Basic Pitch v0.4.0 (Spotify, Apache 2.0)
- **MIDI→MusicXML:** music21 v9.1.0
- **HTTP Client:** httpx
- **Runtime:** Python 3.11
- **Tier:** Starter ($7/mo) — needs upgrade to Standard ($25/mo) for WAV files
- **Job persistence:** `/tmp/scribenoter_jobs/{job_id}.json` (survives restarts)

### Edge Functions (Supabase/Lovable Cloud)
Located in `supabase/functions/`:
- `start-transcription` — submits Music.AI stem separation job
- `poll-music-ai` — checks Music.AI status, submits Basic Pitch jobs when ready
- `poll-basic-pitch` — checks Basic Pitch jobs, stores results when complete

### Third-Party APIs
- **Music.AI** — stem separation (workflow: `untitled-workflow-36652e8`, $0.07/min/stem)
- **Basic Pitch** — transcription (self-hosted on Render, free/Apache 2.0)
- **Supabase** — database, auth, storage, edge functions

---

## 5. Pipeline Architecture

```
User uploads audio (TUS, 6MB chunks)
    ↓
Supabase Storage (private bucket: audio-uploads)
    ↓
start-transcription edge function
    → Creates Music.AI stem separation job
    → Sets status: "separating"
    ↓
Frontend polls DB every 5s
    → Invokes poll-music-ai when status = "separating"
        → Checks Music.AI job status
        → On SUCCEEDED: extracts stem URLs, submits Basic Pitch jobs
        → Sets status: "transcribing", stores basic_pitch_job_ids
    → Invokes poll-basic-pitch when status = "transcribing"
        → Checks each Basic Pitch job
        → On completed: stores MIDI + MusicXML in transcription_outputs
        → Sets status: "completed"
    ↓
Frontend loads transcription_outputs
    → OSMD renders MusicXML as sheet music
    → Download buttons active for PDF, MIDI, MusicXML
```

**Key design decision:** Each edge function runs in under 30 seconds to stay within Supabase's 150-second execution limit. No long polling inside functions — the frontend drives the state machine.

---

## 6. Database Schema

### `transcriptions`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | FK to auth.users |
| file_name | text | Original filename |
| file_path | text | Storage path: `{user_id}/{uuid}/{filename}` |
| song_title | text | User-entered title, shown on sheet music |
| status | text | pending → separating → transcribing → completed/failed |
| selected_instruments | text[] | e.g. ["Electric Guitar", "Bass"] |
| detected_key | text | Default "C Major" (manual for now) |
| detected_bpm | int | Default 120 (manual for now) |
| music_ai_job_id | text | Music.AI job ID |
| stem_urls | jsonb | Music.AI result stem URLs |
| basic_pitch_job_ids | jsonb | Map of instrument → Basic Pitch job ID |
| error_message | text | Set on failure |
| completed_at | timestamptz | Set when status = completed |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### `transcription_outputs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| transcription_id | uuid | FK to transcriptions |
| instrument | text | e.g. "Electric Guitar" |
| format | text | "midi" or "musicxml" |
| file_path | text | Base64-encoded file content |
| created_at | timestamptz | Auto |

### Storage
- Bucket: `audio-uploads` (private)
- Path format: `{user_id}/{uuid}/{filename}`
- Signed URLs (1hr) used for Music.AI access

---

## 7. Row Level Security (RLS)

All tables are secured with RLS:
- **service_role** — full access (used by edge functions)
- **authenticated users** — read/insert/update own rows only (`user_id = auth.uid()`)
- **anon** — no access
- **Storage** — authenticated users can only access files in their own `{user_id}/` folder

---

## 8. Instrument → Stem Key Mapping

Music.AI returns stem URLs with specific key names. The `findStemUrl()` function in `poll-music-ai` tries multiple key variants per instrument:

| Instrument | Key variants tried |
|---|---|
| Electric Guitar | electric_guitar, electricGuitar, guitar, guitars, electric |
| Acoustic Guitar | acoustic_guitar, acousticGuitar, guitar, guitars, acoustic |
| Vocals | vocals, vocal, voice, voices, singing |
| Drums | drums, drum, percussion, kick_drum, kit |
| Bass | bass, bass_guitar, bassGuitar, electric_bass |
| Piano | piano, keys, keyboard, keyboards |
| Strings | strings, string, violin, orchestra |
| Brass | wind, brass, winds, horn, horns |
| Woodwinds | wind, woodwind, woodwinds, winds, flute |

Fallback: if no exact match found, uses first available non-"other" stem URL.

---

## 9. Pricing Tiers (Defined, Not Yet Enforced)

| Tier | Price | Transcriptions | Instruments | Outputs |
|---|---|---|---|---|
| Free | $0 | 3/mo | 1 | PDF only |
| Pro | $9.99/mo | 30/mo | 3 | PDF + MIDI + MusicXML |
| Studio | $24.99/mo | 100/mo | 6 | + Guitar Pro + Live Capture |

**Note:** Tiers are defined in the UI but not yet enforced. Stripe integration is pending.

---

## 10. Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | Index.tsx | Landing page |
| `/app` | AppPage.tsx | Main transcription app (3-stage flow) |
| `/pricing` | PricingPage.tsx | Standalone pricing page |
| `/dashboard` | Dashboard.tsx | User's transcription history |
| `/transcription/:id` | TranscriptionResult.tsx | View/download past transcription |
| `*` | NotFound.tsx | 404 page |

---

## 11. AppPage — 3-Stage Flow

**Stage 0 — Upload**
- Dark studio aesthetic (#080810 background)
- Animated gold waveform bars
- TUS file upload with real progress bar
- Live audio recording via MediaRecorder API (10-min max)
- Supported formats: MP3, WAV, FLAC, M4A up to 500MB

**Stage 1 — Select Instruments**
- AI scanning animation (1.5s)
- 12-instrument grid with default detection
- Song title input field
- Estimated processing time calculation
- Transcribe button with upload progress bar (teal)

**Stage 2 — Processing + Results**
- 4-step progress indicator with real elapsed timers
- Estimated time badge (teal)
- Results: full-width OSMD sheet music
- Two-row toolbar: instrument tabs + dark download buttons
- Downloads: PDF (print), MIDI, MusicXML, Guitar Pro (locked)

---

## 12. Auth Flow

- Email/password via Supabase Auth
- AuthModal component (Sign In / Sign Up tabs)
- Email confirmation required on signup
- Navbar shows avatar initial + dropdown when signed in
- Dashboard accessible from avatar dropdown → "My Transcriptions"
- Transcription requires authentication (returns error if not signed in)

---

## 13. Known Issues / Pending Items

### IMMEDIATE
- [ ] **Render Standard upgrade** — Starter tier (512MB) crashes on large WAV files. Upgrade to Standard ($25/mo) at dashboard.render.com → service Settings → Instance Type
- [ ] **Custom domain** — point scribenoter.com to Lovable app
- [ ] **Supabase email template** — customize confirmation email to say ScribeNoter

### BEFORE LAUNCH
- [ ] **Stripe integration** — payment processing for Pro/Studio tiers
- [ ] **Tier enforcement** — gate features by subscription level
- [ ] **Guitar Pro output** — not yet implemented (shown as Studio locked)
- [ ] **Real key/BPM detection** — currently hardcoded C Major / 120 BPM

### NICE TO HAVE
- [ ] Real-time live transcription (Version B of live audio — requires WebSocket layer)
- [ ] Transcription history in Dashboard "View Results" → full reload
- [ ] Email notifications when transcription completes

---

## 14. Environment Variables

### Supabase Edge Functions (set in Lovable Cloud secrets)
- `SUPABASE_URL` — auto-provided by Lovable
- `SUPABASE_SERVICE_ROLE_KEY` — auto-provided by Lovable
- `MUSIC_AI_API_KEY` — Music.AI API key

### Frontend (Vite env vars)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

### Render (set in Render dashboard → Environment)
- No additional env vars required beyond PYTHON_VERSION

---

## 15. Vendor Contacts

| Vendor | Contact | Purpose | Status |
|---|---|---|---|
| Music.AI | music.ai/contact | Stem separation | Active, in use |
| AudioShake | info@audioshake.ai | Stem separation (alt) | Email sent March 2026, pending |
| Klangio | julia@klang.io | Transcription API (alt) | Email sent March 2026, pending |
| LALAL.AI | support@lalal.ai | Stem separation (fallback) | Email sent March 2026, pending |
| Basic Pitch | Open source | Transcription (current) | Active, self-hosted |

---

## 16. Business Context

- **Entity:** ScribeNoter (pending Maryland LLC registration)
- **Financial advisor meeting:** Scheduled — will determine LLC structure
- **EIN:** Pending LLC registration
- **Business bank:** Relay (relayfi.com) — recommended, pending LLC
- **Developer:** Polsia — paid under $600 in 2026 calendar year (1099 threshold watch)
- **Expense tracking:** Wave (planned, pending Relay account)
