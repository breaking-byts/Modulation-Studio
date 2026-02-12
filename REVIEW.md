# Modulation Studio — Codebase Review & UI Overhaul Plan

## Executive Summary
The codebase is a clean, single-page static web app with clear separation between markup (`index.html`), styling (`styles.css`), and behavior (`app.js`). The simulation logic is comprehensive and mostly well-structured, and the UI is feature-rich. The primary opportunity is UI/UX cohesion and performance tuning: the UI can be modernized into a terminal-style brutalist theme without disrupting the simulation logic.

## Codebase Review

### Strengths
- **Separation of concerns:** HTML, CSS, and JS are logically separated.
- **Readable simulation logic:** `app.js` is organized with distinct steps (signal generation, channel, demodulation, metrics, rendering).
- **Rich feature set:** Presets, export tools, comparison mode, scenarios, and atlas provide strong educational utility.
- **No build tooling required:** Works as a static site, easy deployment.

### Areas for Improvement
1. **Styling scalability**
   - The current CSS is well-written but uses a component-by-component approach without a formal design system.
   - A brutalist/terminal aesthetic will benefit from consistent tokens (e.g., monospace typography, terminal colors, strong borders, minimal shadows).

2. **Semantic/Accessibility improvements**
   - Some buttons and interactive controls could benefit from clearer focus states, `aria` annotations for complex areas, and skip links for keyboard navigation.

3. **Performance considerations**
   - Rendering is tied to `input` events for multiple numeric fields, which can trigger frequent re-renders. Throttling or debouncing could help.
   - Canvas drawing is synchronous; a simple render guard or requestAnimationFrame strategy could reduce spikes during rapid input changes.

4. **Maintainability**
   - `app.js` is monolithic. While not required, splitting simulation, UI, and rendering into separate modules would ease long-term maintenance.

---

## UI Overhaul Plan (Terminal-Style Brutalist)

### Goals
- **Terminal-style brutalist aesthetic:** high-contrast, monospace typography, blocky layouts, sharp corners, strong borders.
- **Functional clarity:** preserve existing UI layout but restyle for clarity and reduced visual noise.
- **Readable data panels:** improve hierarchy for plots, metrics, and controls.

### Visual Direction
- **Background:** dark terminal base (e.g., `#0b0f0c`) with subtle grid/noise.
- **Typography:** monospace for all UI (e.g., `IBM Plex Mono`, `JetBrains Mono`, or `Space Mono`).
- **Colors:** 
  - Primary text: `#d0f0c0` (terminal green).
  - Accent: `#00ff9c` or `#00e676`.
  - Muted: `#7aa57a`.
  - Warning/Danger: `#ff5252`.
- **Panels:** flat, no blur or gradient. Thick borders, hard shadows if used at all.
- **Buttons:** squared edges, no gradients, stark hover effect (invert or bright border).
- **Inputs:** monospace, minimal padding, strong outline.

### UX Adjustments
- Use consistent layout grid with explicit panel separators.
- Add a “System Status” block styled like a terminal output line.
- Section headings in uppercase with ASCII separators (e.g., `=== STUDIO ===`).
- Replace decorative hero styling with stark, text-first presentation.

---

## Implementation Steps (High-Level)

1. **Typography & Global Styles**
   - Set monospace font at `body`, headings, inputs, buttons.
   - Replace gradients/backgrounds with a single dark tone + optional subtle grid.

2. **Component Restyle**
   - Panels: strong borders, no shadows, no rounded corners.
   - Buttons: consistent sizes, bold uppercase labels, terminal hover inversion.
   - Inputs/selects: flat, strong outlines, minimal border radius.

3. **Layout Tweaks**
   - Reduce hero visual weight: convert to a terminal-style intro block.
   - Make `studio-layout` more grid-like with terminal borders.
   - Tighten margins/paddings for a more brutalist look.

4. **Canvas Areas**
   - Give canvases a dark background with grid lines.
   - Thicker border, terminal-style labels.

5. **Accessibility + UX**
   - Improve focus styles for keyboard navigation (strong outlines).
   - Add `aria-live` for status area.
   - Consider `prefers-reduced-motion`.

---

## Concrete Next Actions
- Update `index.html` to include a monospace font from Google Fonts.
- Overhaul `styles.css` to:
  - Replace color palette with terminal palette.
  - Remove gradients and blur.
  - Enforce squared corners.
  - Create reusable brutalist tokens (border thickness, padding scale).
- Optional: Introduce debounced render in `app.js` to avoid rapid redrawing.

---

## Recommended Design Tokens (Example)

- `--bg: #0b0f0c`
- `--panel: #111812`
- `--ink: #d0f0c0`
- `--muted: #7aa57a`
- `--accent: #00ff9c`
- `--danger: #ff5252`
- `--border: #1f2b1f`
- `--radius: 0px`
- `--border-width: 2px`

---

## Notes
The current architecture supports a UI overhaul without touching simulation logic. The best path is to replace the theme in `styles.css` while keeping the HTML structure intact. If needed, minor HTML adjustments can be made to support stronger visual hierarchy (e.g., wrapping headings in terminal-style label blocks).

---

If you want me to proceed with the actual UI revamp, tell me and I’ll update the relevant files next.