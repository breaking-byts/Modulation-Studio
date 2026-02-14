import { nowStamp } from './utils.js';

export function exportCurrentCsv(lastRenderData, setStatus) {
  if (!lastRenderData) {
    setStatus('error', 'Nothing to export yet. Run a simulation first.');
    return;
  }

  const { time, primary, compare } = lastRenderData;
  const headers = [
    'time_s',
    'primary_baseband',
    'primary_rx',
    'primary_demod',
    'compare_baseband',
    'compare_rx',
    'compare_demod',
  ];

  const rows = [headers.join(',')];
  for (let i = 0; i < time.length; i += 1) {
    const row = [
      time[i],
      primary.baseband[i] ?? '',
      primary.rxSignal[i] ?? '',
      primary.demodulated[i] ?? '',
      compare ? compare.baseband[i] ?? '' : '',
      compare ? compare.rxSignal[i] ?? '' : '',
      compare ? compare.demodulated[i] ?? '' : '',
    ];
    rows.push(row.join(','));
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `modulation-signals-${nowStamp()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus('success', 'CSV exported.');
}

export function exportCurrentPng(lastRenderData, els, setStatus) {
  if (!lastRenderData) {
    setStatus('error', 'Nothing to export yet. Run a simulation first.');
    return;
  }

  const blocks = [
    { title: 'Baseband', canvas: els.basebandCanvas },
    { title: 'Received', canvas: els.modulatedCanvas },
    { title: 'Demodulated', canvas: els.demodulatedCanvas },
    { title: 'Spectrum', canvas: els.spectrumCanvas },
  ];

  if (els.constellationPanel.style.display !== 'none') {
    blocks.push({ title: 'Constellation', canvas: els.constellationCanvas });
  }

  const cols = 2;
  const rows = Math.ceil(blocks.length / cols);
  const tileW = 760;
  const tileH = 310;
  const pad = 20;
  const header = 70;

  const out = document.createElement('canvas');
  out.width = cols * tileW + (cols + 1) * pad;
  out.height = header + rows * tileH + (rows + 1) * pad;
  const ctx = out.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.fillStyle = '#102446';
  ctx.font = '600 28px Space Grotesk, sans-serif';
  ctx.fillText('Modulation Studio Export', pad, 38);
  ctx.fillStyle = '#4f5e7f';
  ctx.font = '15px IBM Plex Sans, sans-serif';
  ctx.fillText(`Generated: ${new Date().toLocaleString()}`, pad, 60);

  blocks.forEach((block, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = pad + col * (tileW + pad);
    const y = header + pad + row * (tileH + pad);

    ctx.fillStyle = '#f7faff';
    ctx.fillRect(x, y, tileW, tileH);
    ctx.strokeStyle = '#d8e3f6';
    ctx.strokeRect(x, y, tileW, tileH);

    ctx.fillStyle = '#17325f';
    ctx.font = '600 17px Space Grotesk, sans-serif';
    ctx.fillText(block.title, x + 12, y + 24);

    ctx.drawImage(block.canvas, x + 12, y + 36, tileW - 24, tileH - 48);
  });

  const a = document.createElement('a');
  a.href = out.toDataURL('image/png');
  a.download = `modulation-plots-${nowStamp()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setStatus('success', 'PNG exported.');
}
