

## Improvements to ResultsView in AppPage.tsx

### What changes

Three improvements to the ResultsView component in the results panel, plus minor state additions in AppPage.

### Technical details

**1. Stem navigation tabs**
- Add `activeInstrument` state (useState(0)) inside ResultsView
- Render a horizontal scrollable tab strip above SheetMusicSVG when `selected.length > 1`
- Each tab: pill shape (`px-3 py-1.5 text-xs rounded-full border`), active = `bg-gold text-white border-gold`, inactive = `bg-surface text-ink-soft`
- Update panel title to two lines: Line 1 = displayName (Fraunces), Line 2 = active instrument name with Music icon

**2. Metadata vs. controls separation**
- Remove the current meta badges (lines 466-473)
- Replace with structured layout:
  - Divider → "ORIGINAL RECORDING" label → two read-only blocks (KEY + BPM) in a bordered row with vertical separator
  - Divider → "ADJUSTMENTS" label → Transpose button + BPM control side by side

**3. Editable BPM control**
- Add `bpm` / `setBpm` state in AppPage, pass as props to ResultsView
- Reset bpm to 120 in `resetAll`
- Render a −/+ stepper (increment/decrement by 5, min 40, max 240) styled to match the transpose button
- Place alongside transpose button under ADJUSTMENTS label

### Files modified
- `src/pages/AppPage.tsx` — all changes in this single file

