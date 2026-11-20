// Draws a multi-panel GTA-style poster: photos in panels, a Vice City sunset or
// neon grade over them, and a big bold caption. Everything is drawn with the
// canvas 2D API and system fonts only, so the cover is the same bytes on any
// machine. No Rockstar artwork, logo or font is used anywhere.

export const LAYOUTS = ['hero', 'grid', 'strip'];
export const GRADES = ['sunset', 'neon', 'original'];
export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

/** Returns the three panel rectangles for `layout` inside a W x H poster. */
export function panelRects(layout, w, h) {
  const m = Math.round(w * 0.02);
  const g = Math.round(w * 0.012);
  const innerW = w - m * 2;
  if (layout === 'grid') {
    const pw = (innerW - g * 2) / 3;
    const ph = h - m * 2;
    return [
      { x: m, y: m, w: pw, h: ph },
      { x: m + pw + g, y: m, w: pw, h: ph },
      { x: m + (pw + g) * 2, y: m, w: pw, h: ph },
    ];
  }
  if (layout === 'strip') {
    const topH = Math.round(h * 0.7);
    const botH = h - topH - g - m;
    const pw = (innerW - g) / 2;
    return [
      { x: 0, y: 0, w, h: topH },
      { x: m, y: topH + g, w: pw, h: botH },
      { x: m + pw + g, y: topH + g, w: pw, h: botH },
    ];
  }
  // hero: one big panel on top, two small ones below.
  const topH = Math.round(h * 0.6);
  const botH = h - topH - g - m;
  const pw = (innerW - g) / 2;
  return [
    { x: m, y: m, w: innerW, h: topH },
    { x: m, y: m + topH + g, w: pw, h: botH },
    { x: m + pw + g, y: m + topH + g, w: pw, h: botH },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with the panel's zoom and pan. */
export function drawPanel(ctx, photo, rect, zoom, ox, oy) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = '#241530';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (photo) {
    const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
    const scale = base * zoom;
    const pw = photo.naturalWidth * scale;
    const ph = photo.naturalHeight * scale;
    const cx = rect.x + rect.w / 2 + ox * rect.w;
    const cy = rect.y + rect.h / 2 + oy * rect.h;
    ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  }
  ctx.restore();
  // Thin white frame, the comic-panel look.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = Math.max(2, rect.w * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

/** Paints the colour grade over the whole poster. */
export function drawGrade(ctx, grade, w, h) {
  if (grade === 'sunset') {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, 'rgba(255, 140, 60, 0.12)');
    sky.addColorStop(0.55, 'rgba(255, 90, 120, 0.10)');
    sky.addColorStop(1, 'rgba(150, 30, 140, 0.38)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.78, h * 0.3, 0, w * 0.78, h * 0.3, w * 0.35);
    sun.addColorStop(0, 'rgba(255, 210, 110, 0.30)');
    sun.addColorStop(1, 'rgba(255, 210, 110, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    ctx.fillStyle = 'rgba(255, 0, 160, 0.16)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0, 220, 255, 0.10)';
    ctx.fillRect(0, 0, w, h * 0.5);
    const glow = ctx.createLinearGradient(0, h * 0.7, 0, h);
    glow.addColorStop(0, 'rgba(120, 0, 255, 0)');
    glow.addColorStop(1, 'rgba(120, 0, 255, 0.35)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Fits `text` to `maxWidth` by shrinking the font, then draws it centred. */
export function drawCaptionText(ctx, text, cx, y, maxWidth, size, color) {
  let s = size;
  ctx.font = `${s}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  while (s > 12 && ctx.measureText(text).width > maxWidth) {
    s -= 2;
    ctx.font = `${s}px "Arial Black", Impact, "Helvetica Neue", sans-serif`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 0, 20, 0.9)';
  ctx.lineWidth = Math.max(3, s * 0.14);
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, y);
  return s;
}

/** Draws the whole poster onto `canvas` at the size in `state.size`. */
export function drawPoster(canvas, state) {
  const { w, h } = state.size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout, w, h);
  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    const photo = state.photos[panel.photo] ?? null;
    drawPanel(ctx, photo, rect, panel.zoom, panel.ox, panel.oy);
  });
  drawGrade(ctx, state.grade, w, h);
  // Outer white frame.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, w * 0.008);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);

  const title = state.title.trim().toUpperCase();
  const subtitle = state.subtitle.trim();
  const bandH = h * 0.16;
  const top = state.titlePos === 'top';
  const bandY = top ? 0 : h - bandH;
  // Dark scrim behind the lettering so it reads on any photo.
  const scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  scrim.addColorStop(0, top ? 'rgba(10,0,20,0.72)' : 'rgba(10,0,20,0)');
  scrim.addColorStop(1, top ? 'rgba(10,0,20,0)' : 'rgba(10,0,20,0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY, w, bandH);
  if (title) {
    const y = top ? bandH * 0.42 : h - bandH * (subtitle ? 0.62 : 0.5);
    drawCaptionText(ctx, title, w / 2, y, w * 0.92, h * 0.085, state.titleColor);
  }
  if (subtitle) {
    const y = top ? bandH * 0.78 : h - bandH * 0.22;
    ctx.font = `bold ${Math.round(h * 0.028)}px "Arial Black", Impact, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9a8';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.fillText(subtitle.toUpperCase(), w / 2, y, w * 0.9);
    ctx.shadowBlur = 0;
  }
}
