# Modulation Visualizer TODO

## Current Status
- [x] Bootstrap no-build web app (`index.html`, `styles.css`, `app.js`)
- [x] Add modulation families with sub-types under umbrella categories
- [x] Add three baseband signal options with equations
- [x] Render time-domain waveform for baseband/modulated/demodulated signals
- [x] Render FFT magnitude spectrum
- [x] Render constellation plot for digital schemes
- [x] Show modulation and demodulation equations per selected scheme
- [x] Add controlled channel impairment controls (SNR + fading + RX carrier/phase offset)
- [x] Add BER/SER calculation for digital modulation
- [x] Add side-by-side comparison mode with overlay plots

## Next Steps
- [ ] Add preset scenarios (speech-like baseband, narrowband/wideband FM, etc.)
- [ ] Add clearer plot legends for primary vs comparison traces
- [ ] Add test suite for modulation/demodulation math correctness
- [ ] Add export options (PNG snapshot, CSV samples)
