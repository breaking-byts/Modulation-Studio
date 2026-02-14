import { SAMPLE_RATE } from './config.js';
import { movingAverage, unwrapPhase, coherentIQ } from './utils.js';
import { applyChannel } from './signal-core.js';

export function generateAnalog(t, params, schemeId, baseband) {
  const basebandPeak = Math.max(1e-9, ...baseband.map((x) => Math.abs(x)));
  const mn = baseband.map((x) => x / basebandPeak);
  const txSignal = new Array(t.length).fill(0);
  const demodulated = new Array(t.length).fill(0);

  if (schemeId === 'am_dsb_lc') {
    for (let i = 0; i < t.length; i += 1) {
      txSignal[i] =
        params.carrierAmp *
        (1 + params.modIndex * mn[i]) *
        Math.cos(2 * Math.PI * params.carrierFreq * t[i]);
    }
  } else if (schemeId === 'am_dsb_sc') {
    for (let i = 0; i < t.length; i += 1) {
      txSignal[i] =
        params.carrierAmp * mn[i] * Math.cos(2 * Math.PI * params.carrierFreq * t[i]);
    }
  } else if (schemeId === 'fm') {
    const dt = 1 / SAMPLE_RATE;
    let integral = 0;
    for (let i = 0; i < t.length; i += 1) {
      integral += mn[i] * dt;
      const phase =
        2 * Math.PI * params.carrierFreq * t[i] + 2 * Math.PI * params.freqDev * integral;
      txSignal[i] = params.carrierAmp * Math.cos(phase);
    }
  } else if (schemeId === 'pm') {
    for (let i = 0; i < t.length; i += 1) {
      txSignal[i] =
        params.carrierAmp *
        Math.cos(2 * Math.PI * params.carrierFreq * t[i] + params.modIndex * mn[i]);
    }
  }

  const rxSignal = applyChannel(txSignal, t, params.channel);

  if (schemeId === 'am_dsb_lc') {
    const env = movingAverage(
      rxSignal.map((v) => Math.abs(v)),
      Math.max(3, Math.floor(SAMPLE_RATE / (params.messageFreq * 4.5))),
    );
    const dc = env.reduce((sum, v) => sum + v, 0) / env.length;

    for (let i = 0; i < t.length; i += 1) {
      demodulated[i] = env[i] - dc;
    }
  } else if (schemeId === 'am_dsb_sc') {
    const mixed = rxSignal.map(
      (v, i) => 2 * v * Math.cos(2 * Math.PI * params.receiverFc * t[i] + params.receiverPhase),
    );
    const filtered = movingAverage(
      mixed,
      Math.max(3, Math.floor(SAMPLE_RATE / (params.messageFreq * 4))),
    );

    for (let i = 0; i < t.length; i += 1) {
      demodulated[i] = filtered[i];
    }
  } else if (schemeId === 'fm') {
    const { i, q } = coherentIQ(
      rxSignal,
      t,
      params.receiverFc,
      params.receiverPhase,
      Math.max(5, Math.floor(SAMPLE_RATE / (params.messageFreq * 6))),
    );
    const phase = unwrapPhase(i.map((ival, idx) => Math.atan2(q[idx], ival)));

    for (let k = 1; k < phase.length; k += 1) {
      const fInst = ((phase[k] - phase[k - 1]) * SAMPLE_RATE) / (2 * Math.PI);
      demodulated[k] = (fInst - params.receiverFc) / Math.max(1, params.freqDev);
    }
  } else if (schemeId === 'pm') {
    const { i, q } = coherentIQ(
      rxSignal,
      t,
      params.receiverFc,
      params.receiverPhase,
      Math.max(5, Math.floor(SAMPLE_RATE / (params.messageFreq * 6))),
    );
    const phase = unwrapPhase(i.map((ival, idx) => Math.atan2(q[idx], ival)));

    for (let k = 0; k < phase.length; k += 1) {
      demodulated[k] =
        (phase[k] - 2 * Math.PI * params.receiverFc * t[k]) / Math.max(1e-9, params.modIndex);
    }
  }

  return {
    baseband,
    txSignal,
    rxSignal,
    demodulated,
    constellation: [],
    txBits: [],
    rxBits: [],
    txSymbols: [],
    rxSymbols: [],
  };
}
