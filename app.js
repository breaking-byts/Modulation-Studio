const SAMPLE_RATE = 8000;

const modulationFamilies = [
  {
    id: "amplitude",
    name: "Amplitude Modulation",
    schemes: [
      {
        id: "am_dsb_lc",
        label: "AM DSB-LC (Conventional AM)",
        digital: false,
        modulationEq: "s(t) = Ac [1 + mu mn(t)] cos(2*pi*fc*t)",
        demodEq: "m_hat(t) ~= LPF{|r(t)|} - DC",
      },
      {
        id: "am_dsb_sc",
        label: "AM DSB-SC",
        digital: false,
        modulationEq: "s(t) = Ac mn(t) cos(2*pi*fc*t)",
        demodEq: "m_hat(t) = LPF{2 r(t) cos(2*pi*frx*t + phi_rx)}",
      },
    ],
  },
  {
    id: "angle",
    name: "Angle Modulation",
    schemes: [
      {
        id: "fm",
        label: "Frequency Modulation (FM)",
        digital: false,
        modulationEq: "s(t) = Ac cos(2*pi*fc*t + 2*pi*kf * integral(mn(t) dt))",
        demodEq: "m_hat(t) = (1/kf)*(f_inst(t) - frx), f_inst = (1/2*pi) dphi/dt",
      },
      {
        id: "pm",
        label: "Phase Modulation (PM)",
        digital: false,
        modulationEq: "s(t) = Ac cos(2*pi*fc*t + kp mn(t))",
        demodEq: "m_hat(t) = (phi(t) - 2*pi*frx*t) / kp",
      },
    ],
  },
  {
    id: "digital",
    name: "Digital Modulation",
    schemes: [
      {
        id: "ask",
        label: "ASK (Binary)",
        digital: true,
        modulationEq: "s(t) = Ac [a0 + a1 b(k)] cos(2*pi*fc*t)",
        demodEq: "b_hat(k) = threshold{integral r(t) cos(2*pi*frx*t + phi_rx) dt}",
      },
      {
        id: "fsk",
        label: "FSK (Binary)",
        digital: true,
        modulationEq: "s(t) = Ac cos(2*pi*f_i*t), f_i in {fc-df, fc+df}",
        demodEq: "b_hat(k) = argmax_i integral r(t) cos(2*pi*f_i_rx*t) dt",
      },
      {
        id: "bpsk",
        label: "BPSK",
        digital: true,
        modulationEq: "s(t) = Ac cos(2*pi*fc*t + pi(1-b(k)))",
        demodEq: "b_hat(k) = sign{integral r(t) cos(2*pi*frx*t + phi_rx) dt}",
      },
      {
        id: "qpsk",
        label: "QPSK",
        digital: true,
        modulationEq: "s(t) = Ac [I_k cos(2*pi*fc*t) - Q_k sin(2*pi*fc*t)]",
        demodEq: "I_hat,Q_hat = integrate I/Q mixers using frx and phi_rx",
      },
      {
        id: "qam16",
        label: "16-QAM",
        digital: true,
        modulationEq: "s(t) = Ac [I_k cos(2*pi*fc*t) - Q_k sin(2*pi*fc*t)], I,Q in {-3,-1,1,3}",
        demodEq: "Nearest-neighbor symbol decision on recovered I/Q",
      },
    ],
  },
];

const basebandSignals = [
  {
    id: "sine",
    label: "Sine Wave",
    equation: "m(t) = Am sin(2*pi*fm*t)",
    generator: (t, am, fm) => am * Math.sin(2 * Math.PI * fm * t),
  },
  {
    id: "square",
    label: "Square Wave",
    equation: "m(t) = Am sgn(sin(2*pi*fm*t))",
    generator: (t, am, fm) => am * (Math.sin(2 * Math.PI * fm * t) >= 0 ? 1 : -1),
  },
  {
    id: "triangle",
    label: "Triangle Wave",
    equation: "m(t) = (2*Am/pi) asin(sin(2*pi*fm*t))",
    generator: (t, am, fm) => (2 * am / Math.PI) * Math.asin(Math.sin(2 * Math.PI * fm * t)),
  },
];

const els = {
  family: document.getElementById("family"),
  scheme: document.getElementById("scheme"),
  baseband: document.getElementById("baseband"),
  carrierFreq: document.getElementById("carrierFreq"),
  messageFreq: document.getElementById("messageFreq"),
  carrierAmp: document.getElementById("carrierAmp"),
  messageAmp: document.getElementById("messageAmp"),
  modIndex: document.getElementById("modIndex"),
  freqDev: document.getElementById("freqDev"),
  bitRate: document.getElementById("bitRate"),
  duration: document.getElementById("duration"),
  snrDb: document.getElementById("snrDb"),
  fadingDepth: document.getElementById("fadingDepth"),
  rxCarrierOffset: document.getElementById("rxCarrierOffset"),
  rxPhaseOffset: document.getElementById("rxPhaseOffset"),
  compareMode: document.getElementById("compareMode"),
  compareScheme: document.getElementById("compareScheme"),
  refresh: document.getElementById("refresh"),
  basebandEq: document.getElementById("basebandEq"),
  modEq: document.getElementById("modEq"),
  demodEq: document.getElementById("demodEq"),
  compareModEq: document.getElementById("compareModEq"),
  compareDemodEq: document.getElementById("compareDemodEq"),
  primaryMetrics: document.getElementById("primaryMetrics"),
  compareMetrics: document.getElementById("compareMetrics"),
  taxonomy: document.getElementById("taxonomy"),
  constellationPanel: document.getElementById("constellationPanel"),
  basebandCanvas: document.getElementById("basebandCanvas"),
  modulatedCanvas: document.getElementById("modulatedCanvas"),
  demodulatedCanvas: document.getElementById("demodulatedCanvas"),
  spectrumCanvas: document.getElementById("spectrumCanvas"),
  constellationCanvas: document.getElementById("constellationCanvas"),
};

const allSchemes = modulationFamilies.flatMap((family) =>
  family.schemes.map((scheme) => ({ ...scheme, familyId: family.id, familyName: family.name })),
);

const levelToBitsMap = {
  "-3": [0, 0],
  "-1": [0, 1],
  1: [1, 1],
  3: [1, 0],
};

function buildSelectors() {
  modulationFamilies.forEach((family) => {
    const option = document.createElement("option");
    option.value = family.id;
    option.textContent = family.name;
    els.family.appendChild(option);
  });
  basebandSignals.forEach((baseband) => {
    const option = document.createElement("option");
    option.value = baseband.id;
    option.textContent = baseband.label;
    els.baseband.appendChild(option);
  });
  els.family.value = modulationFamilies[0].id;
  populateSchemeSelector();
  populateCompareSelector();
}

function populateSchemeSelector() {
  const family = modulationFamilies.find((item) => item.id === els.family.value);
  if (!family) return;
  els.scheme.innerHTML = "";
  family.schemes.forEach((scheme) => {
    const option = document.createElement("option");
    option.value = scheme.id;
    option.textContent = scheme.label;
    els.scheme.appendChild(option);
  });
  render();
}

function populateCompareSelector() {
  const selected = els.compareScheme.value;
  els.compareScheme.innerHTML = "";
  allSchemes.forEach((scheme) => {
    const option = document.createElement("option");
    option.value = scheme.id;
    option.textContent = `${scheme.familyName} - ${scheme.label}`;
    els.compareScheme.appendChild(option);
  });
  els.compareScheme.value = selected || allSchemes[1].id;
}

function renderTaxonomy() {
  const html = modulationFamilies
    .map(
      (family) => `
      <div class="family">${family.name}</div>
      <div class="children">${family.schemes.map((scheme) => scheme.label).join(" • ")}</div>
    `,
    )
    .join("");
  els.taxonomy.innerHTML = html;
}

function linspace(duration, sampleRate) {
  const n = Math.max(64, Math.floor(duration * sampleRate));
  const time = new Array(n);
  for (let idx = 0; idx < n; idx += 1) {
    time[idx] = idx / sampleRate;
  }
  return time;
}

function normalize(signal) {
  if (!signal.length) return [];
  const maxAbs = Math.max(...signal.map((val) => Math.abs(val)), 1e-9);
  return signal.map((val) => val / maxAbs);
}

function movingAverage(signal, windowSize) {
  const width = Math.max(1, Math.floor(windowSize));
  const out = new Array(signal.length).fill(0);
  let acc = 0;
  for (let idx = 0; idx < signal.length; idx += 1) {
    acc += signal[idx];
    if (idx >= width) {
      acc -= signal[idx - width];
    }
    out[idx] = acc / Math.min(idx + 1, width);
  }
  return out;
}

function unwrapPhase(phase) {
  const out = [...phase];
  for (let idx = 1; idx < out.length; idx += 1) {
    let delta = out[idx] - out[idx - 1];
    if (delta > Math.PI) {
      out[idx] -= 2 * Math.PI;
    } else if (delta < -Math.PI) {
      out[idx] += 2 * Math.PI;
    }
    delta = out[idx] - out[idx - 1];
    if (delta > Math.PI) {
      out[idx] -= 2 * Math.PI;
    } else if (delta < -Math.PI) {
      out[idx] += 2 * Math.PI;
    }
  }
  return out;
}

function coherentIQ(signal, time, receiverFc, receiverPhase, lpfWindow) {
  const iRaw = signal.map(
    (sample, idx) =>
      2 * sample * Math.cos(2 * Math.PI * receiverFc * time[idx] + receiverPhase),
  );
  const qRaw = signal.map(
    (sample, idx) =>
      -2 * sample * Math.sin(2 * Math.PI * receiverFc * time[idx] + receiverPhase),
  );
  return {
    i: movingAverage(iRaw, lpfWindow),
    q: movingAverage(qRaw, lpfWindow),
  };
}

function nearestPowerOf2(value) {
  let pow = 1;
  while (pow * 2 <= value) {
    pow *= 2;
  }
  return pow;
}

function computeSpectrum(signal, sampleRate) {
  const n = Math.min(512, nearestPowerOf2(signal.length));
  const windowed = signal.slice(0, n).map((sample, idx) => {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * idx) / (n - 1)));
    return sample * hann;
  });
  const frequency = [];
  const magnitudeDb = [];
  for (let k = 0; k < n / 2; k += 1) {
    let re = 0;
    let im = 0;
    for (let m = 0; m < n; m += 1) {
      const angle = (-2 * Math.PI * k * m) / n;
      re += windowed[m] * Math.cos(angle);
      im += windowed[m] * Math.sin(angle);
    }
    const magnitude = Math.sqrt(re * re + im * im) / n;
    frequency.push((k * sampleRate) / n);
    magnitudeDb.push(20 * Math.log10(magnitude + 1e-8));
  }
  return { frequency, magnitudeDb };
}

function drawLinePlot(canvas, seriesConfig) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const valid = seriesConfig.filter((entry) => entry.data.length > 1);
  ctx.clearRect(0, 0, width, height);
  const pad = 22;

  ctx.strokeStyle = "#d5deef";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, height / 2);
  ctx.lineTo(width - pad, height / 2);
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, height - pad);
  ctx.stroke();

  if (!valid.length) return;

  const allValues = valid.flatMap((entry) => entry.data);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = Math.max(1e-6, max - min);

  valid.forEach((entry) => {
    ctx.strokeStyle = entry.color;
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    entry.data.forEach((yVal, idx) => {
      const xPix = pad + (idx / (entry.data.length - 1)) * (width - 2 * pad);
      const yPix = height - pad - ((yVal - min) / span) * (height - 2 * pad);
      if (idx === 0) {
        ctx.moveTo(xPix, yPix);
      } else {
        ctx.lineTo(xPix, yPix);
      }
    });
    ctx.stroke();
  });
}

function drawXYPlot(canvas, xList, yList, colors) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const pad = 22;

  ctx.strokeStyle = "#d5deef";
  ctx.beginPath();
  ctx.moveTo(pad, height - pad);
  ctx.lineTo(width - pad, height - pad);
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, height - pad);
  ctx.stroke();

  if (!xList.length) return;

  const xMin = Math.min(...xList.map((xArr) => xArr[0]));
  const xMax = Math.max(...xList.map((xArr) => xArr[xArr.length - 1]));
  const yMin = Math.min(...yList.flatMap((arr) => arr));
  const yMax = Math.max(...yList.flatMap((arr) => arr));
  const xSpan = Math.max(1e-9, xMax - xMin);
  const ySpan = Math.max(1e-9, yMax - yMin);

  xList.forEach((xArr, plotIndex) => {
    const yArr = yList[plotIndex];
    ctx.strokeStyle = colors[plotIndex];
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    xArr.forEach((xVal, idx) => {
      const px = pad + ((xVal - xMin) / xSpan) * (width - 2 * pad);
      const py = height - pad - ((yArr[idx] - yMin) / ySpan) * (height - 2 * pad);
      if (idx === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    });
    ctx.stroke();
  });
}

function drawConstellation(canvas, groups) {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const pad = 24;

  ctx.strokeStyle = "#d5deef";
  ctx.beginPath();
  ctx.moveTo(width / 2, pad);
  ctx.lineTo(width / 2, height - pad);
  ctx.moveTo(pad, height / 2);
  ctx.lineTo(width - pad, height / 2);
  ctx.stroke();

  const flat = groups.flatMap((group) => group.points);
  if (!flat.length) {
    ctx.fillStyle = "#5f6880";
    ctx.font = "14px Avenir Next";
    ctx.fillText("Constellation is available for digital schemes.", 36, height / 2);
    return;
  }

  const maxAbs = Math.max(1, ...flat.map((point) => Math.max(Math.abs(point.i), Math.abs(point.q))));

  groups.forEach((group) => {
    ctx.fillStyle = group.color;
    group.points.forEach((point) => {
      const x = width / 2 + (point.i / maxAbs) * (width / 2 - pad - 8);
      const y = height / 2 - (point.q / maxAbs) * (height / 2 - pad - 8);
      ctx.beginPath();
      ctx.arc(x, y, 3.8, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
}

let gaussSpare;
function gaussianRandom() {
  if (gaussSpare !== undefined) {
    const val = gaussSpare;
    gaussSpare = undefined;
    return val;
  }
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u));
  gaussSpare = mag * Math.sin(2 * Math.PI * v);
  return mag * Math.cos(2 * Math.PI * v);
}

function signalPower(signal) {
  if (!signal.length) return 0;
  return signal.reduce((acc, val) => acc + val * val, 0) / signal.length;
}

function applyChannel(signal, time, channel) {
  const fadingFreq = 2;
  const faded = signal.map((sample, idx) => {
    const envelope =
      1 - channel.fadingDepth + channel.fadingDepth * (0.5 + 0.5 * Math.sin(2 * Math.PI * fadingFreq * time[idx]));
    return sample * envelope;
  });

  const power = Math.max(1e-10, signalPower(faded));
  const snrLinear = Math.pow(10, channel.snrDb / 10);
  const noiseVar = power / Math.max(1e-9, snrLinear);
  const noiseStd = Math.sqrt(noiseVar);

  return faded.map((sample) => sample + noiseStd * gaussianRandom());
}

function randomBits(count) {
  return Array.from({ length: count }, () => (Math.random() > 0.5 ? 1 : 0));
}

function bitsToWaveform(bits, bitSamples) {
  const output = [];
  bits.forEach((bit) => {
    for (let idx = 0; idx < bitSamples; idx += 1) {
      output.push(bit ? 1 : -1);
    }
  });
  return output;
}

function integrateSegment(signal, start, end, tone) {
  let acc = 0;
  for (let idx = start; idx < end; idx += 1) {
    acc += signal[idx] * tone(idx);
  }
  return acc;
}

function map2BitsToLevel(b1, b0) {
  const key = `${b1}${b0}`;
  if (key === "00") return -3;
  if (key === "01") return -1;
  if (key === "11") return 1;
  return 3;
}

function quantizeLevel(value) {
  const levels = [-3, -1, 1, 3];
  let best = levels[0];
  let bestErr = Infinity;
  levels.forEach((level) => {
    const err = Math.abs(value - level);
    if (err < bestErr) {
      bestErr = err;
      best = level;
    }
  });
  return best;
}

function decodeQpskQuadrant(iComp, qComp) {
  if (iComp >= 0 && qComp >= 0) return [0, 0];
  if (iComp < 0 && qComp >= 0) return [0, 1];
  if (iComp < 0 && qComp < 0) return [1, 1];
  return [1, 0];
}

function computeBitErrorRate(txBits, rxBits) {
  const total = Math.min(txBits.length, rxBits.length);
  if (!total) return { errors: 0, total: 0, rate: 0 };
  let errors = 0;
  for (let idx = 0; idx < total; idx += 1) {
    if (txBits[idx] !== rxBits[idx]) errors += 1;
  }
  return { errors, total, rate: errors / total };
}

function computeSymbolErrorRate(txSymbols, rxSymbols) {
  const total = Math.min(txSymbols.length, rxSymbols.length);
  if (!total) return { errors: 0, total: 0, rate: 0 };
  let errors = 0;
  for (let idx = 0; idx < total; idx += 1) {
    if (txSymbols[idx] !== rxSymbols[idx]) errors += 1;
  }
  return { errors, total, rate: errors / total };
}

function computeCorrelation(a, b) {
  const n = Math.min(a.length, b.length);
  if (!n) return 0;
  const aCut = a.slice(0, n);
  const bCut = b.slice(0, n);
  const meanA = aCut.reduce((acc, val) => acc + val, 0) / n;
  const meanB = bCut.reduce((acc, val) => acc + val, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let idx = 0; idx < n; idx += 1) {
    const da = aCut[idx] - meanA;
    const db = bCut[idx] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  return num / Math.max(1e-9, Math.sqrt(denA * denB));
}

function getSchemeById(id) {
  return allSchemes.find((scheme) => scheme.id === id);
}

function getCurrentScheme() {
  return getSchemeById(els.scheme.value);
}

function generateAnalog(time, params, schemeId, baseband) {
  const mn = normalize(baseband);
  const txSignal = new Array(time.length).fill(0);
  const demodulated = new Array(time.length).fill(0);

  if (schemeId === "am_dsb_lc") {
    for (let idx = 0; idx < time.length; idx += 1) {
      txSignal[idx] =
        params.carrierAmp *
        (1 + params.modIndex * mn[idx]) *
        Math.cos(2 * Math.PI * params.carrierFreq * time[idx]);
    }
  } else if (schemeId === "am_dsb_sc") {
    for (let idx = 0; idx < time.length; idx += 1) {
      txSignal[idx] =
        params.carrierAmp * mn[idx] * Math.cos(2 * Math.PI * params.carrierFreq * time[idx]);
    }
  } else if (schemeId === "fm") {
    const dt = 1 / SAMPLE_RATE;
    let integral = 0;
    for (let idx = 0; idx < time.length; idx += 1) {
      integral += mn[idx] * dt;
      const phase =
        2 * Math.PI * params.carrierFreq * time[idx] + 2 * Math.PI * params.freqDev * integral;
      txSignal[idx] = params.carrierAmp * Math.cos(phase);
    }
  } else if (schemeId === "pm") {
    for (let idx = 0; idx < time.length; idx += 1) {
      txSignal[idx] =
        params.carrierAmp *
        Math.cos(2 * Math.PI * params.carrierFreq * time[idx] + params.modIndex * mn[idx]);
    }
  }

  const rxSignal = applyChannel(txSignal, time, params.channel);

  if (schemeId === "am_dsb_lc") {
    const env = movingAverage(
      rxSignal.map((val) => Math.abs(val)),
      Math.max(3, Math.floor(SAMPLE_RATE / (params.messageFreq * 4.5))),
    );
    const dc = env.reduce((acc, val) => acc + val, 0) / env.length;
    for (let idx = 0; idx < time.length; idx += 1) {
      demodulated[idx] = env[idx] - dc;
    }
  } else if (schemeId === "am_dsb_sc") {
    const mixed = rxSignal.map(
      (val, idx) =>
        2 *
        val *
        Math.cos(
          2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase,
        ),
    );
    const filtered = movingAverage(
      mixed,
      Math.max(3, Math.floor(SAMPLE_RATE / (params.messageFreq * 4))),
    );
    for (let idx = 0; idx < time.length; idx += 1) {
      demodulated[idx] = filtered[idx];
    }
  } else if (schemeId === "fm") {
    const { i, q } = coherentIQ(
      rxSignal,
      time,
      params.receiverFc,
      params.receiverPhase,
      Math.max(5, Math.floor(SAMPLE_RATE / (params.messageFreq * 6))),
    );
    const phase = unwrapPhase(i.map((ival, idx) => Math.atan2(q[idx], ival)));
    for (let idx = 1; idx < phase.length; idx += 1) {
      const fInst = ((phase[idx] - phase[idx - 1]) * SAMPLE_RATE) / (2 * Math.PI);
      demodulated[idx] = (fInst - params.receiverFc) / Math.max(1, params.freqDev);
    }
  } else if (schemeId === "pm") {
    const { i, q } = coherentIQ(
      rxSignal,
      time,
      params.receiverFc,
      params.receiverPhase,
      Math.max(5, Math.floor(SAMPLE_RATE / (params.messageFreq * 6))),
    );
    const phase = unwrapPhase(i.map((ival, idx) => Math.atan2(q[idx], ival)));
    for (let idx = 0; idx < phase.length; idx += 1) {
      demodulated[idx] =
        (phase[idx] - 2 * Math.PI * params.receiverFc * time[idx]) /
        Math.max(1e-9, params.modIndex);
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

function generateDigital(time, params, schemeId, bitPool) {
  const bitSamples = Math.max(4, Math.floor(SAMPLE_RATE / params.bitRate));
  const bitCount = Math.max(16, Math.floor(time.length / bitSamples));
  const requiredBits = bitCount * 4 + 24;
  const sourceBits =
    bitPool && bitPool.length >= requiredBits ? bitPool : randomBits(requiredBits + 128);

  const txBits = [];
  const rxBits = [];
  const txSymbols = [];
  const rxSymbols = [];

  const txSignal = new Array(time.length).fill(0);
  const demodulated = new Array(time.length).fill(0);
  const constellation = [];

  const baseband = bitsToWaveform(sourceBits.slice(0, bitCount), bitSamples).slice(0, time.length);

  if (schemeId === "ask") {
    for (let idx = 0; idx < time.length; idx += 1) {
      const bit = sourceBits[Math.floor(idx / bitSamples)] ?? 0;
      const amp = 0.25 + 0.75 * bit;
      txSignal[idx] =
        params.carrierAmp * amp * Math.cos(2 * Math.PI * params.carrierFreq * time[idx]);
    }

    const rxSignal = applyChannel(txSignal, time, params.channel);
    const segMeans = [];
    for (let b = 0; b < bitCount; b += 1) {
      const start = b * bitSamples;
      const end = Math.min(start + bitSamples, time.length);
      const iComp =
        (2 / Math.max(1, end - start)) *
        integrateSegment(rxSignal, start, end, (idx) =>
          Math.cos(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
        );
      const qComp =
        (-2 / Math.max(1, end - start)) *
        integrateSegment(rxSignal, start, end, (idx) =>
          Math.sin(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
        );
      segMeans.push(iComp);
      constellation.push({ i: iComp, q: qComp });
      txBits.push(sourceBits[b]);
      txSymbols.push(String(sourceBits[b]));
    }
    const threshold = (Math.max(...segMeans) + Math.min(...segMeans)) / 2;

    for (let b = 0; b < bitCount; b += 1) {
      const start = b * bitSamples;
      const end = Math.min(start + bitSamples, time.length);
      const rxBit = segMeans[b] > threshold ? 1 : 0;
      rxBits.push(rxBit);
      rxSymbols.push(String(rxBit));
      for (let idx = start; idx < end; idx += 1) {
        demodulated[idx] = rxBit ? 1 : -1;
      }
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

  if (schemeId === "fsk") {
    const f0 = params.carrierFreq - params.freqDev / 2;
    const f1 = params.carrierFreq + params.freqDev / 2;
    for (let idx = 0; idx < time.length; idx += 1) {
      const bit = sourceBits[Math.floor(idx / bitSamples)] ?? 0;
      const freq = bit ? f1 : f0;
      txSignal[idx] = params.carrierAmp * Math.cos(2 * Math.PI * freq * time[idx]);
    }

    const rxSignal = applyChannel(txSignal, time, params.channel);
    const rf0 = params.receiverFc - params.freqDev / 2;
    const rf1 = params.receiverFc + params.freqDev / 2;

    for (let b = 0; b < bitCount; b += 1) {
      const start = b * bitSamples;
      const end = Math.min(start + bitSamples, time.length);
      const c0 = integrateSegment(rxSignal, start, end, (idx) =>
        Math.cos(2 * Math.PI * rf0 * time[idx]),
      );
      const c1 = integrateSegment(rxSignal, start, end, (idx) =>
        Math.cos(2 * Math.PI * rf1 * time[idx]),
      );
      const bit = c1 > c0 ? 1 : 0;
      txBits.push(sourceBits[b]);
      rxBits.push(bit);
      txSymbols.push(String(sourceBits[b]));
      rxSymbols.push(String(bit));
      constellation.push({ i: c1, q: c0 });
      for (let idx = start; idx < end; idx += 1) {
        demodulated[idx] = bit ? 1 : -1;
      }
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

  if (schemeId === "bpsk") {
    for (let idx = 0; idx < time.length; idx += 1) {
      const bit = sourceBits[Math.floor(idx / bitSamples)] ?? 0;
      const phase = bit ? 0 : Math.PI;
      txSignal[idx] =
        params.carrierAmp * Math.cos(2 * Math.PI * params.carrierFreq * time[idx] + phase);
    }

    const rxSignal = applyChannel(txSignal, time, params.channel);

    for (let b = 0; b < bitCount; b += 1) {
      const start = b * bitSamples;
      const end = Math.min(start + bitSamples, time.length);
      const corr = integrateSegment(rxSignal, start, end, (idx) =>
        Math.cos(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
      );
      const bit = corr >= 0 ? 1 : 0;
      txBits.push(sourceBits[b]);
      rxBits.push(bit);
      txSymbols.push(String(sourceBits[b]));
      rxSymbols.push(String(bit));
      constellation.push({ i: corr, q: 0 });
      for (let idx = start; idx < end; idx += 1) {
        demodulated[idx] = bit ? 1 : -1;
      }
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

  if (schemeId === "qpsk") {
    const symbolSamples = bitSamples * 2;
    const symbolCount = Math.max(8, Math.floor(time.length / symbolSamples));
    const phaseMap = {
      "00": Math.PI / 4,
      "01": (3 * Math.PI) / 4,
      11: (-3 * Math.PI) / 4,
      10: -Math.PI / 4,
    };

    for (let sym = 0; sym < symbolCount; sym += 1) {
      const b1 = sourceBits[2 * sym] ?? 0;
      const b0 = sourceBits[2 * sym + 1] ?? 0;
      const key = `${b1}${b0}`;
      const phase = phaseMap[key];
      const start = sym * symbolSamples;
      const end = Math.min(start + symbolSamples, time.length);

      for (let idx = start; idx < end; idx += 1) {
        txSignal[idx] =
          params.carrierAmp * Math.cos(2 * Math.PI * params.carrierFreq * time[idx] + phase);
      }

      txBits.push(b1, b0);
      txSymbols.push(key);
    }

    const rxSignal = applyChannel(txSignal, time, params.channel);

    for (let sym = 0; sym < symbolCount; sym += 1) {
      const start = sym * symbolSamples;
      const end = Math.min(start + symbolSamples, time.length);
      const len = Math.max(1, end - start);
      const iComp =
        (2 / len) *
        integrateSegment(rxSignal, start, end, (idx) =>
          Math.cos(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
        );
      const qComp =
        (-2 / len) *
        integrateSegment(rxSignal, start, end, (idx) =>
          Math.sin(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
        );
      const [b1, b0] = decodeQpskQuadrant(iComp, qComp);
      rxBits.push(b1, b0);
      rxSymbols.push(`${b1}${b0}`);
      constellation.push({ i: iComp, q: qComp });
      for (let idx = start; idx < end; idx += 1) {
        demodulated[idx] = b1 ? 1 : -1;
      }
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

  const symbolSamples = bitSamples * 4;
  const symbolCount = Math.max(6, Math.floor(time.length / symbolSamples));
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
    const end = Math.min(start + symbolSamples, time.length);

    for (let idx = start; idx < end; idx += 1) {
      txSignal[idx] =
        params.carrierAmp *
        (iAmp * Math.cos(2 * Math.PI * params.carrierFreq * time[idx]) -
          qAmp * Math.sin(2 * Math.PI * params.carrierFreq * time[idx]));
    }

    txBits.push(b1, b0, b3, b2);
    txSymbols.push(`${iLevel},${qLevel}`);
  }

  const rxSignal = applyChannel(txSignal, time, params.channel);

  for (let sym = 0; sym < symbolCount; sym += 1) {
    const start = sym * symbolSamples;
    const end = Math.min(start + symbolSamples, time.length);
    const len = Math.max(1, end - start);
    const iComp =
      (2 / len) *
      integrateSegment(rxSignal, start, end, (idx) =>
        Math.cos(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
      ) /
      Math.max(1e-9, params.carrierAmp);
    const qComp =
      (-2 / len) *
      integrateSegment(rxSignal, start, end, (idx) =>
        Math.sin(2 * Math.PI * params.receiverFc * time[idx] + params.receiverPhase),
      ) /
      Math.max(1e-9, params.carrierAmp);

    const iHat = quantizeLevel(iComp / norm);
    const qHat = quantizeLevel(qComp / norm);
    const ibits = levelToBitsMap[String(iHat)] || [0, 0];
    const qbits = levelToBitsMap[String(qHat)] || [0, 0];

    rxBits.push(ibits[0], ibits[1], qbits[0], qbits[1]);
    rxSymbols.push(`${iHat},${qHat}`);
    constellation.push({ i: iComp / norm, q: qComp / norm });

    for (let idx = start; idx < end; idx += 1) {
      demodulated[idx] = iHat > 0 ? 1 : -1;
    }
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

function getParams() {
  const carrierFreq = Number(els.carrierFreq.value);
  return {
    carrierFreq,
    messageFreq: Number(els.messageFreq.value),
    carrierAmp: Number(els.carrierAmp.value),
    messageAmp: Number(els.messageAmp.value),
    modIndex: Number(els.modIndex.value),
    freqDev: Number(els.freqDev.value),
    bitRate: Number(els.bitRate.value),
    duration: Number(els.duration.value),
    receiverFc: carrierFreq + Number(els.rxCarrierOffset.value),
    receiverPhase: (Number(els.rxPhaseOffset.value) * Math.PI) / 180,
    channel: {
      snrDb: Number(els.snrDb.value),
      fadingDepth: Number(els.fadingDepth.value),
    },
  };
}

function runScheme(scheme, time, params, basebandDef, sharedBits) {
  if (scheme.digital) {
    return generateDigital(time, params, scheme.id, sharedBits);
  }
  const analogBaseband = time.map((moment) =>
    basebandDef.generator(moment, params.messageAmp, params.messageFreq),
  );
  return generateAnalog(time, params, scheme.id, analogBaseband);
}

function getMetricText(result, scheme) {
  if (scheme.digital) {
    const ber = computeBitErrorRate(result.txBits, result.rxBits);
    const ser = computeSymbolErrorRate(result.txSymbols, result.rxSymbols);
    return `BER: ${ber.rate.toFixed(4)} (${ber.errors}/${ber.total}), SER: ${ser.rate.toFixed(4)} (${ser.errors}/${ser.total})`;
  }

  const corr = computeCorrelation(normalize(result.baseband), normalize(result.demodulated));
  return `Correlation(baseband, demod): ${corr.toFixed(4)}`;
}

function render() {
  const primaryScheme = getCurrentScheme();
  if (!primaryScheme) return;

  const params = getParams();
  const time = linspace(params.duration, SAMPLE_RATE);
  const basebandDef =
    basebandSignals.find((baseband) => baseband.id === els.baseband.value) || basebandSignals[0];

  const compareOn = els.compareMode.checked;
  els.compareScheme.disabled = !compareOn;

  const needsBits = primaryScheme.digital || (compareOn && getSchemeById(els.compareScheme.value)?.digital);
  const sharedBits = needsBits ? randomBits(8192) : null;

  const primary = runScheme(primaryScheme, time, params, basebandDef, sharedBits);

  let compareScheme = null;
  let compare = null;
  if (compareOn) {
    compareScheme = getSchemeById(els.compareScheme.value) || allSchemes[0];
    compare = runScheme(compareScheme, time, params, basebandDef, sharedBits);
  }

  if (primaryScheme.digital) {
    els.basebandEq.textContent = "m(t) = sum_k b(k) p(t-kTb), b(k) in {0,1}";
  } else {
    els.basebandEq.textContent = basebandDef.equation;
  }

  els.modEq.textContent = primaryScheme.modulationEq;
  els.demodEq.textContent = primaryScheme.demodEq;

  if (compare && compareScheme) {
    els.compareModEq.textContent = compareScheme.modulationEq;
    els.compareDemodEq.textContent = compareScheme.demodEq;
  } else {
    els.compareModEq.textContent = "N/A";
    els.compareDemodEq.textContent = "N/A";
  }

  els.primaryMetrics.textContent = getMetricText(primary, primaryScheme);
  els.compareMetrics.textContent =
    compare && compareScheme ? getMetricText(compare, compareScheme) : "Disabled";

  const basebandSeries = [{ data: normalize(primary.baseband), color: "#1f6feb" }];
  if (compare) {
    basebandSeries.push({ data: normalize(compare.baseband), color: "#bc4c1d" });
  }

  const receivedSeries = [{ data: normalize(primary.rxSignal), color: "#0f7b6c" }];
  if (compare) {
    receivedSeries.push({ data: normalize(compare.rxSignal), color: "#e36209" });
  }

  const demodSeries = [{ data: normalize(primary.demodulated), color: "#cf4f15" }];
  if (compare) {
    demodSeries.push({ data: normalize(compare.demodulated), color: "#7a42d6" });
  }

  drawLinePlot(els.basebandCanvas, basebandSeries);
  drawLinePlot(els.modulatedCanvas, receivedSeries);
  drawLinePlot(els.demodulatedCanvas, demodSeries);

  const pSpectrum = computeSpectrum(primary.rxSignal, SAMPLE_RATE);
  const xList = [pSpectrum.frequency];
  const yList = [pSpectrum.magnitudeDb];
  const colors = ["#e36209"];

  if (compare) {
    const cSpectrum = computeSpectrum(compare.rxSignal, SAMPLE_RATE);
    xList.push(cSpectrum.frequency);
    yList.push(cSpectrum.magnitudeDb);
    colors.push("#1f6feb");
  }

  drawXYPlot(els.spectrumCanvas, xList, yList, colors);

  const groups = [];
  if (primaryScheme.digital) {
    groups.push({ color: "#1f6feb", points: primary.constellation });
  }
  if (compare && compareScheme?.digital) {
    groups.push({ color: "#e36209", points: compare.constellation });
  }

  drawConstellation(els.constellationCanvas, groups);
  els.constellationPanel.style.display = groups.length ? "block" : "none";
}

function bindEvents() {
  els.family.addEventListener("change", () => {
    populateSchemeSelector();
    render();
  });

  els.scheme.addEventListener("change", render);
  els.baseband.addEventListener("change", render);
  els.compareMode.addEventListener("change", render);
  els.compareScheme.addEventListener("change", render);

  [
    "carrierFreq",
    "messageFreq",
    "carrierAmp",
    "messageAmp",
    "modIndex",
    "freqDev",
    "bitRate",
    "duration",
    "snrDb",
    "fadingDepth",
    "rxCarrierOffset",
    "rxPhaseOffset",
  ].forEach((id) => {
    els[id].addEventListener("input", render);
  });

  els.refresh.addEventListener("click", render);
}

function init() {
  buildSelectors();
  renderTaxonomy();
  bindEvents();
  render();
}

init();
