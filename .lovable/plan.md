

## ScribeNoter — Complete Web Application

### Design System Setup
- Import Fraunces and DM Sans from Google Fonts
- Define all CSS variables (--paper, --surface, --border, --ink, --gold, --teal, --danger, etc.)
- Create reusable button styles (gold CTA, ghost), card styles, and typography classes
- Add subtle staff-line decorative motif as a reusable CSS class

### Shared Components
- **Navbar** — Fixed 64px, backdrop blur, 𝄞 ScribeNoter logo, center nav links (smooth scroll on landing, route links elsewhere), Sign In (ghost) + Try Free (gold) buttons, mobile hamburger with slide-in menu
- **Footer** — 3-column layout with brand, product links, and legal links on --surface background

### Page 1 — Landing Page (`/`)
- **Hero** — Pill badge, Fraunces headline, subheadline, two CTA buttons, three trust signals with checkmarks, faint staff-line background motif
- **Demo Modal** — Auto-playing 4-stage animated sequence: file upload progress bar → instrument detection with pop-in icons → transcription progress with stage labels → mock SVG sheet music preview with export buttons. 2s per stage, smooth transitions.
- **How It Works** — 3 step cards with icons and numbered connector line
- **Instruments** — 4-column grid (2 on mobile) of 12 instrument cards with emoji icons, gold border + scale on hover
- **Pricing** — 3 tier cards (Starter free, Pro $12/mo featured with gold border, Studio $29/mo) with feature lists and appropriate CTA buttons

### Page 2 — App Page (`/app`)
- Top bar with logo and Sign In button
- 3-step indicator (Upload → Select Instruments → Get Results) with gold active state
- Large drag-and-drop upload zone with musical note icon, drag-over styling, browse button
- "or" divider + Record live audio button
- Format pills (MP3, WAV, FLAC, M4A)
- Note about no account needed

### Page 3 — Pricing Page (`/pricing`)
- Standalone hero heading + subheading
- Same 3 pricing cards reused from landing page

### Global
- React Router navigation across all pages
- Smooth scroll for anchor links on landing page
- Fully mobile responsive
- Real copy throughout, no placeholder text

