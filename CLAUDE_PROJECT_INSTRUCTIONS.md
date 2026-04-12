# ScribeNoter — Claude Project Instructions
**How to pick up exactly where we left off in any new chat**

---

## Who You Are Talking To
Nina Basiliko, non-technical founder of ScribeNoter (scribenoter.com).  
Always explain in plain English, walk through steps one at a time, written responses only.  
GitHub account: wanderpawco / wanderpawco@gmail.com  
Business email: devops@scribenoter.com

---

## The App
ScribeNoter is a live AI music transcription web app. Users upload audio, select instruments, and get sheet music (PDF), MIDI, and MusicXML back. It is built and functional — not a prototype.

Full technical details are in `SCRIBENOTER_PROJECT_BASELINE.md` in this same repo.

---

## How to Resume Work

### To continue from where we left off, say:
> "Let's continue building ScribeNoter. Here's where we are:"

Then paste the relevant section from the PENDING ITEMS list below.

### To work on a specific item, say:
> "Let's work on item [X] from the pending list."

---

## Pending Items (as of April 12, 2026)

### IMMEDIATE — Do these first
1. **Render Standard upgrade** — Go to dashboard.render.com → scribenoter-transcription-api → Settings → Instance Type → upgrade from Starter to Standard ($25/mo). Required before WAV files work reliably (Starter tier crashes at 512MB RAM).

2. **Custom domain** — Point scribenoter.com to the Lovable app. Go to Lovable project → Settings → Custom Domain. Then update DNS at your domain registrar to point to Lovable's servers.

3. **Supabase email template** — The sign-up confirmation email still says generic Supabase copy. In Lovable → Cloud → Auth → Email Templates, customize the confirmation email to say ScribeNoter.

### BEFORE LAUNCH
4. **Stripe integration** — Pricing tiers are defined but no payment exists. Use Lovable's native Stripe connector. Products needed: Pro ($9.99/mo), Studio ($24.99/mo).

5. **Tier enforcement** — After Stripe: gate features by subscription. Free = 3 transcriptions, 1 instrument, PDF only. Pro = 30, 3 instruments, +MIDI+MusicXML. Studio = 100, 6 instruments, +Guitar Pro.

6. **Guitar Pro output** — Shown in UI as Studio-locked but not implemented. Basic Pitch doesn't produce GP5. Will need a separate conversion library post-launch.

### DESIGN / UX
7. **Upload screen redesign** — In progress. Dark studio aesthetic with animated gold waveform, glowing gold drop zone border. Last Lovable prompt was applying final fixes (border visibility, font sizes, record button gold color). Pull from GitHub Desktop and test.

8. **Instrument selection screen** — Still on the warm parchment background. Consistent with results screen. No redesign needed yet.

9. **Processing screen** — Has real progress bars, elapsed timers, estimated time badge in teal. Working correctly.

10. **Results screen** — Two-row toolbar with dark download buttons. Full-width OSMD sheet music. Song title from user input. Working correctly.

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

### Check what's been written to disk
All key files are at:
- Frontend: `/Users/ninab/Documents/GitHub/scribe-notes-music/`
- Backend: `/Users/ninab/Documents/GitHub/scribenoter-transcription-api/`

### Make frontend changes
Always use Lovable prompts — never edit frontend files directly. After Lovable builds, pull in GitHub Desktop.

---

## Architecture Quick Reference

```
[User Browser]
    ↓ TUS upload (6MB chunks, authenticated)
[Supabase Storage — audio-uploads bucket (private)]
    ↓ Signed URL (1hr)
[start-transcription edge function]
    ↓ Music.AI API (workflow: untitled-workflow-36652e8)
[poll-music-ai edge function] ← Frontend polls every 5s
    ↓ Basic Pitch on Render
[poll-basic-pitch edge function] ← Frontend polls every 5s
    ↓ MIDI + MusicXML stored as base64 in transcription_outputs
[Frontend — OSMD renders MusicXML as sheet music]
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
- TUS file upload up to 500MB with real progress bar
- Music.AI stem separation (all instruments, smart key matching)
- Basic Pitch transcription + music21 MusicXML conversion
- OSMD sheet music rendering from real MusicXML
- PDF print, MIDI download, MusicXML download
- Song title input → appears on rendered sheet music
- Auth (sign up, sign in, sign out, email confirmation)
- Dashboard — full transcription history per user
- TranscriptionResult page — revisit any past job at /transcription/:id
- RLS security — all tables locked to authenticated owners
- Storage security — private bucket, files scoped to user ID
- Live audio recording (MediaRecorder, up to 10 min, feeds same pipeline)
