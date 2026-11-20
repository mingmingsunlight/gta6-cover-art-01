// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone at the requested size.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the title words,
// `layout`, `grade`, `size` and `subtitle` the rest of the scene.
// window.__shotReady is set once painted.
import { SIZES } from './cover.js';

export async function runShot(shot, query, state, setPhoto, redraw, els) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const layout = query.get('layout');
  if (layout) {
    state.layout = layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === layout));
  }
  const grade = query.get('grade');
  if (grade) {
    state.grade = grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === grade));
  }
  const size = SIZES[query.get('size') ?? 'square'];
  if (size) {
    state.size = size;
    els.sizeSelect.value = query.get('size') ?? 'square';
  }
  const title = query.get('caption') ?? 'Sunset Heist';
  state.title = title;
  els.titleInput.value = title;
  const subtitle = query.get('subtitle');
  if (subtitle !== null) {
    state.subtitle = subtitle;
    els.subtitleInput.value = subtitle;
  }
  const photo = query.get('photo') ?? 'pier';
  await setPhoto(0, `samples/${photo}.jpg`);
  await setPhoto(1, `samples/${photo === 'pier' ? 'boulevard' : 'pier'}.jpg`);
  await setPhoto(2, `samples/${photo}.jpg`);
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
