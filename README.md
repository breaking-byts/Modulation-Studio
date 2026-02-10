# Signal Modulation Visualizer

Web app prototype for visualizing modulation and demodulation behavior across analog and digital modulation families.

## Features Implemented
- Umbrella modulation taxonomy with subtypes.
- Three baseband signal options with equations.
- Per-scheme modulation and demodulation equations.
- Channel impairment controls:
  - SNR (AWGN)
  - Fading depth
  - Receiver carrier/phase offset
- Time-domain waveform plots:
  - Baseband
  - Received (after channel)
  - Demodulated
- Frequency spectrum visualization (DFT magnitude).
- Constellation plotting for digital modulation schemes.
- Recovery metrics:
  - BER and SER for digital schemes
  - Correlation for analog schemes
- Comparison mode:
  - Choose a second modulation scheme
  - Overlay waveform/spectrum/constellation behavior

## Run
Open `/Users/leelanshkharbanda/codex/PCS/index.html` in a browser.

## Files
- `/Users/leelanshkharbanda/codex/PCS/index.html`
- `/Users/leelanshkharbanda/codex/PCS/styles.css`
- `/Users/leelanshkharbanda/codex/PCS/app.js`
- `/Users/leelanshkharbanda/codex/PCS/TODO.md`
- `/Users/leelanshkharbanda/codex/PCS/PLAN.md`
