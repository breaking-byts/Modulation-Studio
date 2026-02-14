import { SAMPLE_RATE } from './config.js';
import {
  applyChannel,
  bitsToWaveform,
  decodeQpskQuadrant,
  estimateAdaptiveReceiverState,
  integrateSegment,
  map2BitsToLevel,
  quantizeLevel,
  randomBits,
} from './signal-core.js';

const DIGITAL_SCHEMES = new Set(['ask', 'fsk', 'bpsk', 'qpsk', 'qam16']);

export function generateDigital(t, params, schemeId, bitPool, levelToBitsMap) {
  if (!DIGITAL_SCHEMES.has(schemeId)) {
    throw new Error(`Unsupported digital scheme: ${schemeId}`);
  }
  if (!Array.isArray(t)) {
    throw new Error('Digital generation requires a time array.');
  }
  if (!Number.isFinite(params?.bitRate) || params.bitRate <= 0) {
    throw new Error('Invalid parameter: bitRate');
  }
  if (!Number.isFinite(params?.carrierFreq) || !Number.isFinite(params?.carrierAmp)) {
    throw new Error('Invalid carrier parameters for digital generation.');
  }
  const safeLevelToBitsMap = levelToBitsMap && typeof levelToBitsMap === 'object' ? levelToBitsMap : {};

  const bitSamples = Math.max(4, Math.floor(SAMPLE_RATE / params.bitRate));
  const bitCount = Math.max(16, Math.floor(t.length / bitSamples));
  const neededBits = bitCount * 4 + 32;
  const sourceBits = bitPool && bitPool.length >= neededBits ? bitPool : randomBits(neededBits + 64);

  const txBits = [];
  const rxBits = [];
  const txSymbols = [];
  const rxSymbols = [];

  const txSignal = new Array(t.length).fill(0);
  const demodulated = new Array(t.length).fill(0);
  const constellation = [];
  const baseband = bitsToWaveform(sourceBits.slice(0, bitCount), bitSamples).slice(0, t.length);

  if (schemeId === 'ask') {
    for (let i = 0; i < t.length; i += 1) {
      const b = sourceBits[Math.floor(i / bitSamples)] ?? 0;
      const amp = 0.2 + 0.8 * b;
      txSignal[i] = params.carrierAmp * amp * Math.cos(2 * Math.PI * params.carrierFreq * t[i]);
    }

    const rxSignal = applyChannel(txSignal, t, params.channel);
    const receiver = estimateAdaptiveReceiverState(rxSignal, t, params, schemeId, bitSamples);
    const comps = [];

    for (let b = 0; b < bitCount; b += 1) {
      const start = receiver.timingOffset + b * bitSamples;
      if (start >= t.length) break;

      const end = Math.min(start + bitSamples, t.length);
      const iComp =
        (2 / Math.max(1, end - start)) *
        integrateSegment(rxSignal, start, end, (i) =>
          Math.cos(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
        );
      const qComp =
        (-2 / Math.max(1, end - start)) *
        integrateSegment(rxSignal, start, end, (i) =>
          Math.sin(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
        );

      comps.push(iComp);
      constellation.push({ i: iComp, q: qComp });
      txBits.push(sourceBits[b]);
      txSymbols.push(String(sourceBits[b]));
    }

    const threshold = comps.length ? (Math.max(...comps) + Math.min(...comps)) / 2 : 0;

    for (let b = 0; b < comps.length; b += 1) {
      const start = receiver.timingOffset + b * bitSamples;
      const end = Math.min(start + bitSamples, t.length);
      const detected = comps[b] > threshold ? 1 : 0;

      rxBits.push(detected);
      rxSymbols.push(String(detected));
      for (let i = start; i < end; i += 1) demodulated[i] = detected ? 1 : -1;
    }

    return {
      baseband,
      txSignal,
      rxSignal,
      demodulated,
      constellation,
      txBits,
      rxBits,
      txSymbols,
      rxSymbols,
    };
  }

  if (schemeId === 'fsk') {
    const f0 = params.carrierFreq - params.freqDev / 2;
    const f1 = params.carrierFreq + params.freqDev / 2;

    for (let i = 0; i < t.length; i += 1) {
      const b = sourceBits[Math.floor(i / bitSamples)] ?? 0;
      txSignal[i] = params.carrierAmp * Math.cos(2 * Math.PI * (b ? f1 : f0) * t[i]);
    }

    const rxSignal = applyChannel(txSignal, t, params.channel);
    const receiver = estimateAdaptiveReceiverState(rxSignal, t, params, schemeId, bitSamples);
    const rf0 = receiver.receiverFc - params.freqDev / 2;
    const rf1 = receiver.receiverFc + params.freqDev / 2;

    for (let b = 0; b < bitCount; b += 1) {
      const start = receiver.timingOffset + b * bitSamples;
      if (start >= t.length) break;

      const end = Math.min(start + bitSamples, t.length);
      const c0 = integrateSegment(rxSignal, start, end, (i) => Math.cos(2 * Math.PI * rf0 * t[i]));
      const c1 = integrateSegment(rxSignal, start, end, (i) => Math.cos(2 * Math.PI * rf1 * t[i]));
      const detected = c1 > c0 ? 1 : 0;

      txBits.push(sourceBits[b]);
      rxBits.push(detected);
      txSymbols.push(String(sourceBits[b]));
      rxSymbols.push(String(detected));
      constellation.push({ i: c1, q: c0 });
      for (let i = start; i < end; i += 1) demodulated[i] = detected ? 1 : -1;
    }

    return {
      baseband,
      txSignal,
      rxSignal,
      demodulated,
      constellation,
      txBits,
      rxBits,
      txSymbols,
      rxSymbols,
    };
  }

  if (schemeId === 'bpsk') {
    for (let i = 0; i < t.length; i += 1) {
      const b = sourceBits[Math.floor(i / bitSamples)] ?? 0;
      const phase = b ? 0 : Math.PI;
      txSignal[i] = params.carrierAmp * Math.cos(2 * Math.PI * params.carrierFreq * t[i] + phase);
    }

    const rxSignal = applyChannel(txSignal, t, params.channel);
    const receiver = estimateAdaptiveReceiverState(rxSignal, t, params, schemeId, bitSamples);

    for (let b = 0; b < bitCount; b += 1) {
      const start = receiver.timingOffset + b * bitSamples;
      if (start >= t.length) break;

      const end = Math.min(start + bitSamples, t.length);
      const corr = integrateSegment(rxSignal, start, end, (i) =>
        Math.cos(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
      );
      const detected = corr >= 0 ? 1 : 0;

      txBits.push(sourceBits[b]);
      rxBits.push(detected);
      txSymbols.push(String(sourceBits[b]));
      rxSymbols.push(String(detected));
      constellation.push({ i: corr, q: 0 });
      for (let i = start; i < end; i += 1) demodulated[i] = detected ? 1 : -1;
    }

    return {
      baseband,
      txSignal,
      rxSignal,
      demodulated,
      constellation,
      txBits,
      rxBits,
      txSymbols,
      rxSymbols,
    };
  }

  if (schemeId === 'qpsk') {
    const symbolSamples = bitSamples * 2;
    const symbolCount = Math.max(8, Math.floor(t.length / symbolSamples));
    const phaseMap = {
      '00': Math.PI / 4,
      '01': (3 * Math.PI) / 4,
      '11': (-3 * Math.PI) / 4,
      '10': -Math.PI / 4,
    };

    for (let sym = 0; sym < symbolCount; sym += 1) {
      const b1 = sourceBits[2 * sym] ?? 0;
      const b0 = sourceBits[2 * sym + 1] ?? 0;
      const phase = phaseMap[`${b1}${b0}`];
      const start = sym * symbolSamples;
      const end = Math.min(start + symbolSamples, t.length);

      for (let i = start; i < end; i += 1) {
        txSignal[i] = params.carrierAmp * Math.cos(2 * Math.PI * params.carrierFreq * t[i] + phase);
      }

      txBits.push(b1, b0);
      txSymbols.push(`${b1}${b0}`);
    }

    const rxSignal = applyChannel(txSignal, t, params.channel);
    const receiver = estimateAdaptiveReceiverState(rxSignal, t, params, schemeId, bitSamples);

    for (let sym = 0; sym < symbolCount; sym += 1) {
      const start = receiver.timingOffset + sym * symbolSamples;
      if (start >= t.length) break;

      const end = Math.min(start + symbolSamples, t.length);
      const len = Math.max(1, end - start);
      const iComp =
        (2 / len) *
        integrateSegment(rxSignal, start, end, (i) =>
          Math.cos(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
        );
      const qComp =
        (-2 / len) *
        integrateSegment(rxSignal, start, end, (i) =>
          Math.sin(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
        );

      const [b1, b0] = decodeQpskQuadrant(iComp, qComp);
      rxBits.push(b1, b0);
      rxSymbols.push(`${b1}${b0}`);
      constellation.push({ i: iComp, q: qComp });
      for (let i = start; i < end; i += 1) demodulated[i] = b1 ? 1 : -1;
    }

    txBits.length = rxSymbols.length * 2;
    txSymbols.length = rxSymbols.length;

    return {
      baseband,
      txSignal,
      rxSignal,
      demodulated,
      constellation,
      txBits,
      rxBits,
      txSymbols,
      rxSymbols,
    };
  }

  const symbolSamples = bitSamples * 4;
  const symbolCount = Math.max(6, Math.floor(t.length / symbolSamples));
  const norm = 1 / Math.sqrt(10);

  for (let sym = 0; sym < symbolCount; sym += 1) {
    const b1 = sourceBits[4 * sym] ?? 0;
    const b0 = sourceBits[4 * sym + 1] ?? 0;
    const b3 = sourceBits[4 * sym + 2] ?? 0;
    const b2 = sourceBits[4 * sym + 3] ?? 0;

    const iLevel = map2BitsToLevel(b1, b0);
    const qLevel = map2BitsToLevel(b3, b2);
    const iAmp = iLevel * norm;
    const qAmp = qLevel * norm;

    const start = sym * symbolSamples;
    const end = Math.min(start + symbolSamples, t.length);
    for (let i = start; i < end; i += 1) {
      txSignal[i] =
        params.carrierAmp *
        (iAmp * Math.cos(2 * Math.PI * params.carrierFreq * t[i]) -
          qAmp * Math.sin(2 * Math.PI * params.carrierFreq * t[i]));
    }

    txBits.push(b1, b0, b3, b2);
    txSymbols.push(`${iLevel},${qLevel}`);
  }

  const rxSignal = applyChannel(txSignal, t, params.channel);
  const receiver = estimateAdaptiveReceiverState(rxSignal, t, params, schemeId, bitSamples);

  for (let sym = 0; sym < symbolCount; sym += 1) {
    const start = receiver.timingOffset + sym * symbolSamples;
    if (start >= t.length) break;

    const end = Math.min(start + symbolSamples, t.length);
    const len = Math.max(1, end - start);

    const iComp =
      (2 / len) *
      integrateSegment(rxSignal, start, end, (i) =>
        Math.cos(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
      ) /
      Math.max(1e-9, params.carrierAmp);

    const qComp =
      (-2 / len) *
      integrateSegment(rxSignal, start, end, (i) =>
        Math.sin(2 * Math.PI * receiver.receiverFc * t[i] + receiver.receiverPhase),
      ) /
      Math.max(1e-9, params.carrierAmp);

    const iHat = quantizeLevel(iComp / norm);
    const qHat = quantizeLevel(qComp / norm);
    const iBits = safeLevelToBitsMap[String(iHat)] || [0, 0];
    const qBits = safeLevelToBitsMap[String(qHat)] || [0, 0];

    rxBits.push(iBits[0], iBits[1], qBits[0], qBits[1]);
    rxSymbols.push(`${iHat},${qHat}`);
    constellation.push({ i: iComp / norm, q: qComp / norm });

    for (let i = start; i < end; i += 1) demodulated[i] = iHat > 0 ? 1 : -1;
  }

  txBits.length = rxSymbols.length * 4;
  txSymbols.length = rxSymbols.length;

  return {
    baseband,
    txSignal,
    rxSignal,
    demodulated,
    constellation,
    txBits,
    rxBits,
    txSymbols,
    rxSymbols,
  };
}
