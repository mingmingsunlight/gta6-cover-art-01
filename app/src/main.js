// Wires the cover maker: photos in, layout and grade, caption, live preview,
// export as a PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080. A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js).
// Photos are read on the person's own machine and never uploaded.
import { drawPoster, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const sizeSelect = document.getElementById('size');
const zoomSlider = document.getElementById('zoom');
const zoomValue = document.getElementById('zoom-value');
const panelSelect = document.getElementById('panel');

const state = {
  photos: [null, null, null],
  layout: 'hero',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'Vice City',
  titleColor: '#ffffff',
  titlePos: 'bottom',
  size: SIZES.square,
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 2, zoom: 1, ox: 0, oy: 0 },
  ],
};

let selectedPanel = 0;

function redraw() {
  drawPoster(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function setPhoto(slot, source) {
  try {
    const img = typeof source === 'string' ? await loadImage(source) : source;
    state.photos[slot] = img;
    document.querySelector(`[data-slot="${slot}"] .thumb`).textContent = 'Loaded';
    redraw();
  } catch {
    status.textContent = 'That photo could not be read.';
  }
}

// Photo slots: a file input per slot, plus the two free sample photos.
document.querySelectorAll('.slot').forEach((slotEl) => {
  const slot = Number(slotEl.dataset.slot);
  slotEl.querySelector('input[type=file]').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await setPhoto(slot, URL.createObjectURL(file));
    status.textContent = `Photo ${slot + 1} loaded from your machine.`;
  });
  slotEl.querySelectorAll('[data-sample]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await setPhoto(slot, `samples/${btn.dataset.sample}.jpg`);
      status.textContent = `Photo ${slot + 1} is the ${btn.dataset.sample} sample.`;
    });
  });
});

// Drag and drop a photo onto the preview: it fills the selected panel's slot.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (!file) return;
  await setPhoto(state.panels[selectedPanel].photo, URL.createObjectURL(file));
});

// Drag on the preview pans the selected panel's photo; shift-drag zooms it.
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  dragging = { x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[selectedPanel];
  panel.ox += (e.clientX - dragging.x) / rect.width;
  panel.oy += (e.clientY - dragging.y) / rect.height;
  panel.ox = Math.max(-0.5, Math.min(0.5, panel.ox));
  panel.oy = Math.max(-0.5, Math.min(0.5, panel.oy));
  dragging = { x: e.clientX, y: e.clientY };
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });

panelSelect.addEventListener('change', () => {
  selectedPanel = Number(panelSelect.value);
  const panel = state.panels[selectedPanel];
  zoomSlider.value = panel.zoom;
  zoomValue.textContent = `${panel.zoom.toFixed(1)}x`;
});
zoomSlider.addEventListener('input', () => {
  const panel = state.panels[selectedPanel];
  panel.zoom = Number(zoomSlider.value);
  zoomValue.textContent = `${panel.zoom.toFixed(1)}x`;
  redraw();
});

// Layout, grade, caption and export size.
document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
document.getElementById('title-color').addEventListener('change', (e) => {
  state.titleColor = e.target.value;
  redraw();
});
document.getElementById('title-pos').addEventListener('change', (e) => {
  state.titlePos = e.target.value;
  redraw();
});
sizeSelect.addEventListener('change', () => {
  state.size = SIZES[sizeSelect.value];
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  const off = document.createElement('canvas');
  drawPoster(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cover-${state.size.w}x${state.size.h}.png`;
    a.click();
    status.textContent = `Saved cover-${state.size.w}x${state.size.h}.png`;
  }, 'image/png');
});

// Screenshot mode: ?shot=editor or ?shot=cover, with photo, caption, layout,
// grade and size in the query. window.__shotReady is set once painted.
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, setPhoto, redraw, {
    titleInput, subtitleInput, sizeSelect,
  });
} else {
  // Default scene: the two samples in, third panel reuses the pier shot.
  setPhoto(0, 'samples/boulevard.jpg');
  setPhoto(1, 'samples/pier.jpg');
  setPhoto(2, 'samples/pier.jpg');
}
