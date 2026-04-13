### Third-Party Services
- **Klangio** (api.klang.io) — stem separation + transcription. Startup plan $99/mo, 500 requests. Replaces Music.AI + Basic Pitch.
- **Supabase** — database, auth, storage, edge functions
- **Render** — backend proxy server (Standard $25/mo). Now just downloads audio and calls Klangio.
- **Lovable** — frontend hosting

### Klangio Model Mapping
| Instrument | Stem | Transcription Model |
|---|---|---|
| Lead/Backing Vocals | vocals | vocal |
| Bass | bass | bass |
| Piano | piano | piano |
| Organ | other | piano |
| Strings | other | string |
| All Brass & Woodwinds | other | wind |

---

## Instrument List (current)
Lead Vocals, Backing Vocals, Bass, Piano, Organ, Strings, Trumpet, French Horn, Trombone, Tuba, Flugelhorn, Baritone/Euphonium, Flute, Oboe, Clarinet, Alto Saxophone, Tenor Saxophone, Soprano Saxophone, Bassoon

Removed pending fix: Electric Guitar, Acoustic Guitar, Drums

---

## Key Commands

### Deploy Render server changes
```bash
cd ~/Documents/GitHub/scribenoter-transcription-api && git add main.py && git commit -m "Description" && git push origin main
```
Then dashboard.render.com → Manual Deploy. Deploys now take ~2 minutes.

### Update requirements
```bash
cd ~/Documents/GitHub/scribenoter-transcription-api && git add requirements.txt && git commit -m "Description" && git push origin main
```

### Commit documentation
```bash
cd ~/Documents/GitHub/scribe-notes-music && git add SCRIBENOTER_PROJECT_BASELINE.md CLAUDE_PROJECT_INSTRUCTIONS.md && git commit -m "Update project documentation" && git push origin main
```

### Make frontend changes
Always use Lovable prompts in code blocks. After Lovable builds, pull in GitHub Desktop.

---

## Important Notes
- Klangio audio files deleted from their servers within 14 days
- User rights checkbox added to upload flow for legal protection
- Terms, Privacy, and Contact pages live at /terms, /privacy, /contact
- Beta banner shown across all pages, dismissible per session
- Navbar uses three-column grid layout for proper centering
- PDF print uses US Letter or A4 based on browser locale
- No AI training on user audio — confirmed and in privacy policy