'use strict';

async function renderOceanCard({ image, coralName, entries, language = 'zh-Hant' }) {
  const english = language === 'en';
  function loadPainting(path) {
    return new Promise((resolve, reject) => {
      const painting = new Image();
      painting.onload = () => resolve(painting);
      painting.onerror = () => reject(new Error('Unable to load card artwork'));
      painting.src = path;
    });
  }

  const [source, tidepool] = await Promise.all([
    loadPainting(typeof image === 'string' ? image : image.currentSrc || image.src),
    loadPainting('assets/tidepool-cover.webp').catch(() => null),
  ]);
  await document.fonts?.ready;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  const serif = '"Songti TC", "Noto Serif TC", "PMingLiU", "PingFang TC", serif';
  const serifFont = (size, weight = 400) => `${weight} ${size}px ${serif}`;
  const sans = '"PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
  const headingFont = `650 23px ${sans}`;
  const noteFont = serifFont(33);
  const margin = 84;
  const columnWidth = 832;
  const columnGap = 84;
  const words = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-Hant', { granularity: 'word' }) : null;
  const characters = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-Hant') : null;

  function segments(line, segmenter) {
    return segmenter ? Array.from(segmenter.segment(line), item => item.segment) : Array.from(line);
  }

  function wrapLine(text, font) {
    context.font = font;
    const lines = [];
    let line = '';
    for (const token of segments(text, words)) {
      if (context.measureText(line + token).width <= columnWidth) {
        if (line || token.trim()) line += token;
        continue;
      }
      if (line) lines.push(line.trimEnd());
      line = token.trimStart();
      if (context.measureText(line).width <= columnWidth) continue;
      const longToken = line;
      line = '';
      for (const letter of segments(longToken, characters)) {
        if (line && context.measureText(line + letter).width > columnWidth) {
          lines.push(line);
          line = '';
        }
        line += letter;
      }
    }
    lines.push(line.trimEnd());
    return lines;
  }

  // Use a single portrait column for a small card, with extra columns only for very long notes.
  const columns = [[]];
  const columnLimit = 5000;
  let columnHeight = 0;
  let contentHeight = 0;
  function reserve(height) {
    if (columnHeight + height <= columnLimit || columnHeight === 0) return;
    columns.push([]);
    columnHeight = 0;
  }
  function place(line, font, color, height) {
    reserve(height);
    columns.at(-1).push({ line, font, color, y: columnHeight });
    columnHeight += height;
    contentHeight = Math.max(contentHeight, columnHeight);
  }

  for (const [label, text] of entries) {
    const headings = wrapLine(label, headingFont);
    reserve(headings.length * 38 + 52 + (columnHeight ? 30 : 0));
    if (columnHeight) columnHeight += 30;
    for (const line of headings) place(line, headingFont, '#3c6460', 38);
    for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
      for (const line of wrapLine(paragraph, noteFont)) {
        place(line, noteFont, '#243e40', line ? 52 : 17);
      }
    }
  }

  const width = margin * 2 + columns.length * columnWidth + (columns.length - 1) * columnGap;
  const imageHeight = Math.round(columnWidth * source.naturalHeight / source.naturalWidth);
  const imageTop = 213;
  const writingTop = imageTop + imageHeight + 151;
  const notesTop = writingTop + 61;
  const height = Math.max(1170, (entries.length ? notesTop + contentHeight : writingTop - 92) + 105);
  const scale = Math.min(1.5, 8192 / width, 8192 / height, Math.sqrt(16000000 / (width * height)));
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  context.scale(canvas.width / width, canvas.height / height);
  context.textBaseline = 'top';
  context.fillStyle = '#f9f3e8';
  context.fillRect(0, 0, width, height);

  if (tidepool) {
    const backdropHeight = Math.min(width * 0.43, 450);
    const cropTop = tidepool.naturalHeight * 0.22;
    context.save();
    context.globalAlpha = 0.24;
    context.drawImage(
      tidepool, 0, cropTop, tidepool.naturalWidth, tidepool.naturalHeight - cropTop,
      0, 0, width, backdropHeight,
    );
    context.restore();

    const paperFade = context.createLinearGradient(0, 0, 0, backdropHeight);
    paperFade.addColorStop(0, '#f9f3e840');
    paperFade.addColorStop(0.25, '#f9f3e818');
    paperFade.addColorStop(0.5, '#f9f3e84d');
    paperFade.addColorStop(1, '#f9f3e8');
    context.fillStyle = paperFade;
    context.fillRect(0, 0, width, backdropHeight);
  }

  function wash(x, y, rx, ry, pigment) {
    context.save();
    context.translate(x, y);
    context.scale(rx, ry);
    const gradient = context.createRadialGradient(-0.12, -0.12, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(${pigment}, 0.22)`);
    gradient.addColorStop(0.62, `rgba(${pigment}, 0.08)`);
    gradient.addColorStop(1, `rgba(${pigment}, 0)`);
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }

  wash(42, 45, 330, 230, '92, 163, 161');
  wash(255, 65, 345, 110, '113, 176, 168');
  wash(width - 118, 112, 255, 150, '211, 156, 117');
  wash(width - 24, height - 20, 365, 225, '93, 165, 160');
  wash(60, height - 28, 280, 135, '218, 163, 126');

  // Quiet, deterministic paper grain around the painting and lettering.
  let seed = 217;
  function nextGrain() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let dot = 0; dot < 4600; dot += 1) {
    const x = nextGrain() * width;
    const y = nextGrain() * height;
    context.fillStyle = dot % 2 ? '#5353430b' : '#fffcf7a0';
    context.fillRect(x, y, 0.65 + nextGrain() * 1.3, 0.8);
  }

  context.lineWidth = 1;
  context.strokeStyle = '#aa978174';
  context.strokeRect(27, 27, width - 54, height - 54);

  function lettering(line, x, y, font, color, align = 'left') {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(line, x, y);
  }

  const center = width / 2;
  lettering('CORALWATCH', center, 48, `700 24px ${sans}`, '#325655', 'center');
  lettering(english ? 'Tide Notebook' : '潮汐備忘錄', center, 80, `550 17px ${sans}`, '#426865', 'center');
  lettering(english ? 'My Ocean Notebook' : '我的海洋手記', center, 104, serifFont(65, 700), '#254d4e', 'center');

  context.strokeStyle = '#b49572';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(center - 38, 180);
  context.bezierCurveTo(center - 22, 165, center - 9, 194, center + 7, 180);
  context.bezierCurveTo(center + 20, 169, center + 29, 185, center + 38, 177);
  context.stroke();

  const imageLeft = center - columnWidth / 2;
  context.fillStyle = '#fffdf7';
  context.fillRect(imageLeft - 9, imageTop - 9, columnWidth + 18, imageHeight + 18);
  context.strokeStyle = '#a58e7066';
  context.strokeRect(imageLeft - 9, imageTop - 9, columnWidth + 18, imageHeight + 18);
  context.drawImage(source, imageLeft, imageTop, columnWidth, imageHeight);
  lettering(coralName, center, imageTop + imageHeight + 34, serifFont(35, 600), '#325655', 'center');

  if (entries.length) {
    lettering(english ? 'My reflections' : '我留下的文字', margin, writingTop, serifFont(28, 650), '#365f5b');
    context.strokeStyle = '#baa17f99';
    context.beginPath();
    context.moveTo(margin, writingTop + 44);
    context.lineTo(width - margin, writingTop + 44);
    context.stroke();
    columns.forEach((column, index) => {
      const x = margin + index * (columnWidth + columnGap);
      for (const item of column) {
        lettering(item.line, x, notesTop + item.y, item.font, item.color);
      }
    });
  }

  const blob = typeof canvas.toBlob === 'function'
    ? await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    : null;
  if (blob) return blob;
  const uri = canvas.toDataURL('image/png');
  if (!uri.startsWith('data:image/png;base64,')) throw new Error('Unable to export ocean notebook card');
  return new Blob([Uint8Array.from(atob(uri.split(',')[1]), byte => byte.charCodeAt(0))], { type: 'image/png' });
}
