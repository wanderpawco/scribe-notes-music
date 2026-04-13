# ScribeNoter — Claude Project Instructions
**How to pick up exactly where we left off in any new chat**
**Last Updated:** April 13, 2026

---

## Who You Are Talking To
Nina Basiliko, non-technical founder of ScribeNoter (scribenoter.com).
GitHub account: wanderpawco / wanderpawco@gmail.com
Business email: devops@scribenoter.com

---

## How Claude Should Work With Nina

### Communication style
- Plain English always — no jargon without defining it first
- Short responses over long ones — Nina does not read walls of text
- Tell her exactly what to do — not a list of options unless she asks
- One thing at a time, step by step, confirm it worked before moving on
- Never repeat something already said — say it once, clearly
- When she says "ok" or "done" — move to the next step immediately

### How Nina wants results delivered
- State what worked and what still needs fixing — clearly and separately
- One sentence per finding — do not over-explain
- When something breaks: say what broke, why, and the exact fix — in that order
- Do not repeat what was already established in the session
- When a fix is confirmed working, move on immediately
- Never declare success until Nina has confirmed it herself in the live app

### What NOT to do
- Do not guess at fixes — diagnose first, always
- Do not try the same approach twice if it already failed
- Do not write long explanations when a short command is sufficient
- Do not congratulate or celebrate small progress
- Do not ask Nina to find or edit specific lines of code — always provide complete commands
- Do not say "Ignore all tool calls firing" — this was explicitly asked to stop
- Do not suggest "starting over" without a concrete plan

### Decision making
- When Nina asks "will this actually work?" — give a direct honest answer before doing anything
- Always mention the dollar cost of any paid service or upgrade upfront
- Nina thinks about real users and shipping, not just features

### Debugging approach
- Always diagnose before proposing a fix — never guess
- Ask for console logs or error messages first
- Show what the actual problem is before writing any code
- Confirm the fix landed before declaring success

### GitHub / Terminal
- Nina is not a developer — walk through Terminal commands one at a time
- Always provide complete copy-paste Terminal commands
- Git identity is set to wanderpawco@gmail.com globally

### Lovable prompts
- Always write complete, copy-paste-ready Lovable prompts in code blocks
- Never edit frontend files directly — always go through Lovable
- After Lovable applies changes, always pull from GitHub Desktop before confirming

### Design feedback
- Nina has strong visual instincts — when she says something looks wrong, fix it properly
- She wants designs that feel premium, professional, and exciting — not generic
- Dark studio aesthetic for upload screen, warm parchment for instrument/results screens

---

## The App
ScribeNoter is a live AI music transcription web app. Users upload audio or record live, select instruments, enter a song title, and get real sheet music (PDF), MIDI, and MusicXML back.

The backend pipeline is fully working end to end — AudioShake stem separation, Klangio transcription, MusicXML written to Supabase. The frontend display of results is the remaining critical issue.

Full technical details are in `SCRIBENOTER_PROJECT_BASELINE.md`.

---

## How to Resume Work

### To continue from where we left off:
> "Let's continue building ScribeNoter. Here's where we are:"

Then paste the relevant section from the PENDING ITEMS list below.

### To work on a specific item:
> "Let's work on item [X] from the pending list."

### To update documentation after a session:
> "Update the project documentation to reflect everything we did today."

---

## Pending Items (as of April 13, 2026)

### CRITICAL — Fix These First
1. **Frontend not showing results** — Backend completes and writes to Supabase (`status: completed`, `transcription_outputs` row inserted) but UI stays on "analyzing pitch and rhythm." Root cause: the `transcriptionId` in React state likely doesn't match the completed row in Supabase, OR the frontend poll is catching a stale status. Diagnosis: add `console.log("Polling ID:", transcriptionId, "status:", data.status)` inside the poll useEffect in AppPage.tsx to confirm what ID is being polled.

2. **Klangio stem transcription always fails on first attempt** — Every run: stem audio → FAILED, full audio → COMPLETED. Costs double Klangio credits per job. Root cause unknown — likely stem audio format or duration issue. Needs investigation.

3. **Error display for users** — When transcription fails, frontend shows nothing. User just waits forever. Need to show an error message when `status: failed` is detected.

### BEFORE LAUNCH
4. **Stripe integration** — No payment exists. Use Lovable's native Stripe connector. Products: Pro ($9.99/mo), Studio ($24.99/mo).

5. **Tier enforcement** — After Stripe: Free = 3 transcriptions, 1 instrument, PDF only. Pro = 30, 3 instruments, +MIDI+MusicXML. Studio = 100, 6 instruments, +Guitar Pro.

6. **Guitar Pro output** — Shown as Studio-locked in UI but not implemented.

7. **Real key/BPM detection** — Currently hardcoded C Major / 120 BPM.

8. **Custom domain** — Point scribenoter.com to Lovable app.

9. **Supabase email template** — Still shows generic Supabase copy. Customize to say ScribeNoter.

10. **Free transcription counter** — Show remaining free transcriptions in navbar.

11. **Cancel Music.AI subscription** — No longer used. Still being charged.

### DESIGN / UX
12. **Processing screen animation** — Cymatics/Chladni animation added but not confirmed working in live app.

13. **Processing screen timer** — Incorrect. Timer also stops when user navigates away.

14. **Scroll to top on stage transition** — Submitted via Lovable but not confirmed working.

15. **YouTube URL input** — UI exists but backend download not implemented.

### POST-LAUNCH
16. **MIDI output** — Klangio `detect` model returns 404 for MIDI. Only MusicXML retrieved. Needs investigation.

---

## Key Commands

### Deploy Render backend
```bash
cd ~/Documents/GitHub/scribenoter-transcription-api && git add main.py requirements.txt && git commit -m "Description" && git push origin main
```
Then dashboard.render.com → Manual Deploy. Deploy takes ~2 minutes.

### Force Render cache bust
```bash
cd ~/Documents/GitHub/scribenoter-transcription-api && echo "# cache bust $(date)" >> requirements.txt && git add requirements.txt && git commit -m "Force cache bust" && git push origin main
```
Then Render → **Clear cache and deploy**.

### Commit documentation
```bash
cd ~/Documents/GitHub/scribe-notes-music && git add SCRIBENOTER_PROJECT_BASELINE.md CLAUDE_PROJECT_INSTRUCTIONS.md && git commit -m "Update project documentation" && git push origin main
```

### Make frontend changes
Always use Lovable prompts. After Lovable builds, pull in GitHub Desktop.

### Python patch script (edit main.py without finding lines manually)
```bash
cd ~/Documents/GitHub/scribenoter-transcription-api && python3 - << 'EOF'
with open('main.py', 'r') as f:
    content = f.read()
# make changes to content here
with open('main.py', 'w') as f:
    f.write(content)
print("Done")
EOF
```

### Copy Supabase anon key to clipboard with no newline
```bash
grep PUBLISHABLE ~/Documents/GitHub/scribe-notes-music/.env | cut -d'"' -f2 | tr -d '\n' | pbcopy && echo "Copied"
```

---

## Architecture Quick Reference

```
[User Browser]
    ↓ TUS upload (6MB chunks, session JWT) OR MediaRecorder live audio
[Supabase Storage — audio-uploads bucket (private)]
    ↓ Signed URL (1hr)
[start-transcription edge function]
    ↓ POST to Render /transcribe (returns immediately)
[Render FastAPI v6.0]
    → asyncio.ensure_future(run_transcription())
    → AudioShake stem separation → downloads stem WAV
    → Klangio transcription (guitar model for bass, piano for organ, universal for drums/brass/woodwinds)
    → MusicXML fetched from Klangio /xml endpoint
    → Results written to Supabase transcription_outputs (base64)
    → transcriptions.status updated to "completed"
[Frontend polls transcriptions.status every 5s]
    → On "completed": loads transcription_outputs
    → OSMD renders MusicXML
    → Download buttons active
```

---

## Important Notes on Supabase Access
The Supabase project was created by Lovable and is under their organization. The service_role key is NOT accessible at supabase.com with Nina's account. Current workaround: Render uses the anon key with relaxed RLS policies. To get the real service_role key, contact Lovable support.

The anon key is at: `~/Documents/GitHub/scribe-notes-music/.env` → `VITE_SUPABASE_PUBLISHABLE_KEY`
The Supabase project URL is: `https://wtsuzefvmuuxrcbbwgxv.supabase.co`

---

## Klangio Model Mapping (v5.8+)
| Instrument | Klangio Model | MusicXML |
|---|---|---|
| Lead/Backing Vocals | vocal | ✅ |
| Bass | guitar | ✅ |
| Piano / Organ | piano | ✅ |
| Electric/Acoustic Guitar | guitar | ✅ |
| Strings | universal | ✅ |
| Drums | universal | ✅ |
| All Brass & Woodwinds | universal | ✅ |

Note: The `bass` and `wind` Klangio models are MIDI-only. Never use them if MusicXML is needed.

---

## RLS Policies Added April 13, 2026
These allow Render (anon key) to write results to Supabase:
- `allow_anon_insert_outputs` — anon INSERT on `transcription_outputs`
- `allow_anon_update_transcriptions` — anon UPDATE on `transcriptions`

---

## What's Working (Do Not Break)
- TUS file upload up to 500MB with teal progress bar
- Live audio recording via MediaRecorder (up to 10 min)
- AudioShake stem separation → downloads stem WAV
- Klangio transcription → MusicXML (gen_xml: true confirmed)
- MusicXML written to Supabase transcription_outputs as base64
- transcriptions.status updated to "completed" in Supabase
- OSMD sheet music rendering from MusicXML at full page width
- PDF print via print CSS
- MusicXML download
- Song title input → stored in DB → passed to Klangio → appears in MusicXML
- Auth — sign up, sign in, sign out, email confirmation via Supabase
- Navbar — avatar with dropdown when signed in
- Dashboard — transcription history per user
- TranscriptionResult page — revisit past jobs at /transcription/:id
- RLS security — tables locked to authenticated owners
- Storage security — private bucket, files scoped to user_id folder
- Dark studio aesthetic on upload screen
- 22-instrument grid, color-coded by family
- Beta banner (gold, dismissible)
- asyncio.ensure_future() pipeline — Render returns immediately, edge function doesn't time out
