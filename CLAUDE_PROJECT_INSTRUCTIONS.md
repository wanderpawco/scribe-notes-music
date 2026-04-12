# ScribeNoter — Claude Project Instructions
**How to pick up exactly where we left off in any new chat**
**Last Updated:** April 12, 2026

---

## Who You Are Talking To
Nina Basiliko, non-technical founder of ScribeNoter (scribenoter.com).  
Always explain in plain English, walk through steps one at a time, written responses only.  
GitHub account: wanderpawco / wanderpawco@gmail.com  
Business email: devops@scribenoter.com

---

## The App
ScribeNoter is a live AI music transcription web app. Users upload audio or record live, select instruments, enter a song title, and get real sheet music (PDF), MIDI, and MusicXML back. It is fully built and functional — not a prototype. The full pipeline has been tested end-to-end successfully.

Full technical details are in `SCRIBENOTER_PROJECT_BASELINE.md` in this same repo.

---

## How to Resume Work

### To continue from where we left off, say:
> "Let's continue building ScribeNoter. Here's where we are:"

Then paste the relevant section from the PENDING ITEMS list below.

### To work on a specific item, say:
> "Let's work on item [X] from the pending list."

### To update documentation after a session, say:
> "Update the project documentation to reflect everything we did today."

---

## Pending Items (as of April 12, 2026)

### IMMEDIATE — Do these first
1. **Render Standard upgrade** — Go to dashboard.render.com → scribenoter-transcription-api → Settings → Instance Type → upgrade from Starter to Standard ($25/mo). Required before WAV files work reliably (Starter tier crashes at 512MB RAM on large WAV files).

2. **Custom domain** — Point scribenoter.com to the Lovable app. Go to Lovable project → Settings → Custom Domain. Then update DNS at your domain registrar to point to Lovable's servers.

3. **Supabase email template** — The sign-up confirmation email still says generic Supabase copy. In Lovable → Cloud → Auth → Email Templates, customize the confirmation email to say ScribeNoter.

4. **Upload screen redesign — final polish** — Dark studio aesthetic is applied but last prompt (fixing drop zone border visibility, waveform brightness, font sizes, gold record button, format badge colors, step indicator contrast) was just submitted. Pull from GitHub Desktop, test on the live app, and confirm it looks outstanding before moving on.

### BEFORE LAUNCH
5. **Stripe integration** — Pricing tiers are defined but no payment exists. Use Lovable's native Stripe connector. Products needed: Pro ($9.99/mo), Studio ($24.99/mo).

6. **Tier enforcement** — After Stripe: gate features by subscription. Free = 3 transcriptions, 1 instrument, PDF only. Pro = 30, 3 instruments, +MIDI+MusicXML. Studio = 100, 6 instruments, +Guitar Pro.

7. **Guitar Pro output** — Shown in UI as Studio-locked but not implemented. Basic Pitch doesn't produce GP5. Will need a separate conversion library post-launch.

8. **Real key/BPM detection** — Currently hardcoded C Major / 120 BPM. Post-launch nice-to-have.

### DESIGN / UX
9. **Instrument selection screen** — Still on warm parchment background. No redesign needed yet — consistent with results screen.

10. **Processing screen** — Has real progress bars, elapsed timers, estimated time badge in teal. Working correctly.

11. **Results screen** — Two-row toolbar with dark download buttons, instrument tabs, key/tempo controls. Full-width OSMD sheet music. Song title from user input. Working correctly.

---

## Key Commands to Know

### Deploy Render server changes
```bash
cd ~/Documents/GitHub/scribenoter-transcription-api
git add main.py
git commit -m "Description of change"
git push origin main
```
Then go to dashboard.render.com → Manual Deploy → Deploy latest commit.
Note: Render deploys take 8-12 minutes due to TensorFlow/Basic Pitch rebuild.

### Commit documentation updates
```bash
cd ~/Documents/GitHub/scribe-notes-music
git add SCRIBENOTER_PROJECT_BASELINE.md CLAUDE_PROJECT_INSTRUCTIONS.md
git commit -m "Update project documentation"
git push origin main
```

### Check what's been written to disk
- Frontend: `/Users/ninab/Documents/GitHub/scribe-notes-music/`
- Backend: `/Users/ninab/Documents/GitHub/scribenoter-transcription-api/`

### Make frontend changes
Always use Lovable prompts — never edit frontend files directly. After Lovable builds, pull in GitHub Desktop.

---

## Architecture Quick Reference

```
[User Browser]
    ↓ TUS upload (6MB chunks, session JWT auth) OR MediaRecorder live audio
[Supabase Storage — audio-uploads bucket (private, RLS scoped to user_id)]
    ↓ Signed URL (1hr)
[start-transcription edge function]
    ↓ Music.AI API (workflow: untitled-workflow-36652e8)
[poll-music-ai edge function] ← Frontend polls DB every 5s, invokes function
    ↓ Basic Pitch on Render (auto-restarts if server woke from cold start)
[poll-basic-pitch edge function] ← Frontend polls DB every 5s, invokes function
    ↓ MIDI + MusicXML stored as base64 in transcription_outputs
[Frontend — OSMD renders MusicXML as real sheet music]
[User downloads PDF (print), MIDI, MusicXML or revisits at /transcription/:id]
```

---

## Important Secrets / Keys
(Do not store actual values here — these live in Lovable Cloud secrets and Render dashboard)

- `MUSIC_AI_API_KEY` — in Lovable Cloud secrets
- `SUPABASE_URL` — auto-provided by Lovable
- `SUPABASE_SERVICE_ROLE_KEY` — auto-provided by Lovable
- `VITE_SUPABASE_URL` — Vite env var
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Vite env var (anon key)

---

## What's Working (Do Not Break)
- TUS file upload up to 500MB with real teal progress bar and percentage
- Live audio recording via MediaRecorder (up to 10 min, red indicator with timer, feeds same pipeline)
- Music.AI stem separation — smart findStemUrl() with multi-variant key matching for all instruments
- Basic Pitch transcription + music21 MusicXML conversion with song title embedded
- Job persistence to disk — survives Render restarts, auto-restart on cold start
- OSMD sheet music rendering from real MusicXML at full page width
- PDF print — correctly captures OSMD SVG via print CSS visibility trick
- MIDI download — binary decode, 5s revoke delay allows repeated clicks
- MusicXML download — text decode, 5s revoke delay allows repeated clicks
- Song title input in Stage 1 → stored in DB → passed to Render → appears on sheet music
- Estimated processing time on instrument selection screen and processing screen (teal badge)
- Processing screen — 4 steps with real elapsed timers and time-based progress bars
- Auth — sign up, sign in, sign out, email confirmation via Supabase
- AuthModal — Sign In / Sign Up tabs, error handling, success states
- Navbar — avatar with dropdown (My Transcriptions, Sign Out) when signed in
- Dashboard — full transcription history per user, sorted newest first
- TranscriptionResult page — revisit any past completed job at /transcription/:id with full downloads
- RLS security — all tables locked to authenticated owners, no public/anon access
- Storage security — private bucket, files scoped to user_id folder, session JWT on TUS upload
- Three-function edge architecture — no Supabase timeout issues (each function under 30s)
