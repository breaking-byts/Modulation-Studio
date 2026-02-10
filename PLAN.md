# Implementation Plan

## Phase 1 (Completed)
1. Establish a static app shell with controls and canvas plotting areas.
2. Organize modulation taxonomy under umbrella terms:
   - Amplitude modulation: AM DSB-LC, AM DSB-SC
   - Angle modulation: FM, PM
   - Digital modulation: ASK, FSK, BPSK, QPSK, 16-QAM
3. Add three selectable baseband waveforms with equations:
   - Sine
   - Square
   - Triangle
4. Implement first-pass modulation + demodulation equations and visualizations:
   - Time-domain baseband/modulated/demodulated plots
   - Frequency spectrum (DFT/FFT magnitude)
   - Constellation plotting for digital schemes

## Phase 2 (Completed)
1. Added channel impairments:
   - AWGN via configurable SNR (dB)
   - Time-varying fading depth
   - Receiver carrier frequency/phase offset controls
2. Added recovery quality metrics:
   - BER and SER for digital schemes
   - Correlation metric for analog baseband recovery
3. Added comparison mode:
   - Select any second scheme
   - Overlay primary/comparison traces on time and spectrum plots
   - Overlay constellation clouds when digital schemes are selected

## Phase 3
1. Improve receiver models (better filtering, timing recovery assumptions).
2. Add educational overlays for step-by-step derivations.
3. Add data/image export and reusable scenario presets.
4. Add tests for modulation and demodulation correctness.
