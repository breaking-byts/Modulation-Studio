export {
  applyChannel,
  bitsToWaveform,
  computeBitErrorRate,
  computeCorrelation,
  computeSymbolErrorRate,
  decodeQpskQuadrant,
  estimateAdaptiveReceiverState,
  integrateSegment,
  map2BitsToLevel,
  quantizeLevel,
  randomBits,
  signalPower,
} from './signal-core.js';

export { generateAnalog } from './signal-analog.js';
export { generateDigital } from './signal-digital.js';
