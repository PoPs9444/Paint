'use strict';
(() => {
// ============================================================ utils
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const bridge = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.bridge;
const native = (action, payload = {}) => { if (!bridge) return false; bridge.postMessage(Object.assign({ action }, payload)); return true; };
document.body.classList.add(bridge ? 'native' : 'web');

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); }
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? d / mx : 0, mx];
}
function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// ============================================================ icons
const ICONS = {
  new: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  open: '<path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/><path d="M3 11h18"/>',
  print: '<path d="M7 9V4h10v5"/><rect x="3.5" y="9" width="17" height="7.5" rx="1.5"/><path d="M7 14h10v6H7z"/>',
  save: '<path d="M12 3.5v10.5"/><path d="M7.5 9.5L12 14l4.5-4.5"/><path d="M4 14.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4.5"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  undo: '<path d="M8.5 5L4.5 9l4 4"/><path d="M4.5 9h9.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15.5 5l4 4-4 4"/><path d="M19.5 9H10a5.5 5.5 0 0 0 0 11h3"/>',
  select: '<rect x="4.5" y="5.5" width="15" height="13" rx="1" stroke-dasharray="2.6 2.2"/>',
  chev: '<path d="M7.5 10l4.5 4.5 4.5-4.5"/>',
  caretDown: '<path d="M6 9l6 6 6-6z" fill="currentColor"/>',
  pencil: '<path d="M4.5 19.5l1.2-4.3L16.2 4.7a1.8 1.8 0 0 1 2.6 0l.5.5a1.8 1.8 0 0 1 0 2.6L8.8 18.3z"/><path d="M14.5 6.5l3 3"/>',
  brush: '<path d="M20 4c-3 1.8-7.5 6.3-9.3 9.2l1.6 1.6C15.2 13 18.6 8 20 4z"/><path d="M10.2 13.7c-2.2-.2-3.8 1.2-4 3.2-.1 1.2-.9 2-2.2 2.4 3.5 1.2 7.4.2 7.8-3.6"/>',
  eraser: '<path d="M8.5 19.5L4.2 15.2a1.6 1.6 0 0 1 0-2.3l8.7-8.7a1.6 1.6 0 0 1 2.3 0l4.6 4.6a1.6 1.6 0 0 1 0 2.3L12 19.5z"/><path d="M8.3 9l7 7"/><path d="M12 19.5h8"/>',
  bucket: '<path d="M4.5 11.5L11 5l7.5 7.5-6.5 6.5a1.5 1.5 0 0 1-2.1 0L4.5 13.6a1.5 1.5 0 0 1 0-2.1z"/><path d="M4.5 12.5h14"/><path d="M8 3.5l3 3"/><path d="M20 15.5s1.8 2.2 1.8 3.4a1.8 1.8 0 0 1-3.6 0c0-1.2 1.8-3.4 1.8-3.4z"/>',
  picker: '<path d="M14.5 5.5l4 4"/><path d="M15.8 3.8a2.4 2.4 0 0 1 3.4 3.4l-1.9 1.9-3.4-3.4z"/><path d="M14 7.5l-8.3 8.3-.9 3.4 3.4-.9L16.5 10"/>',
  text: '<path d="M5.5 6V4.5h13V6"/><path d="M12 4.5v15"/><path d="M9 19.5h6"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
  grid: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M12 4v16M4 12h16"/>',
  pixelate: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
  fillOutline: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
  fillSolid: '<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor"/>',
  fillBoth: '<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor" fill-opacity=".4"/>',
  rotL: '<rect x="9" y="9.5" width="10.5" height="10.5" rx="1.2"/><path d="M4.5 13V9a4 4 0 0 1 4-4h4"/><path d="M10.5 2.8L12.7 5l-2.2 2.2"/>',
  rotR: '<rect x="4.5" y="9.5" width="10.5" height="10.5" rx="1.2"/><path d="M19.5 13V9a4 4 0 0 0-4-4h-4"/><path d="M13.5 2.8L11.3 5l2.2 2.2"/>',
  crop: '<path d="M7 3v13.5a.5.5 0 0 0 .5.5H21"/><path d="M3 7h13.5a.5.5 0 0 1 .5.5V21"/>',
  resize: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M9 15l6-6"/><path d="M11 9h4v4"/>',
  invert: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  flipH: '<path d="M12 3v18" stroke-dasharray="2 2.2"/><path d="M9 7.5L4 17.5h5z"/><path d="M15 7.5l5 10h-5z"/>',
  flipV: '<path d="M3 12h18" stroke-dasharray="2 2.2"/><path d="M7.5 9L17.5 4v5z"/><path d="M7.5 15l10 5v-5z"/>',
  rot180: '<rect x="7.5" y="7.5" width="9" height="9" rx="1.2"/><path d="M4 12a8 8 0 0 1 13.7-5.6"/><path d="M18.3 2.8v3.9h-3.9"/><path d="M20 12a8 8 0 0 1-13.7 5.6"/><path d="M5.7 21.2v-3.9h3.9"/>',
  swap: '<path d="M5 9h13.5l-3.2-3.2"/><path d="M19 15H5.5l3.2 3.2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  layers: '<path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16.5L12 21l9-4.5"/>',
  zoom: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" opacity=".35"/><path d="M4 4l16 16"/>',
  rectSel: '<rect x="4.5" y="5.5" width="15" height="13" rx="1" stroke-dasharray="2.6 2.2"/>',
  freeSel: '<path d="M6 7c3-4 12-3 13 2s-5 4-7 7-6 3-7 0 0-6 1-9z" stroke-dasharray="2.6 2.2"/>',
};
function icon(name) {
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
function paintIcons(root = document) {
  $$('[data-icon]', root).forEach((el) => {
    if ([...el.children].some((c) => c.tagName.toLowerCase() === 'svg')) return;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  });
}

// ============================================================ shapes geometry
function normPts(pts) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const mnx = Math.min(...xs), mxx = Math.max(...xs), mny = Math.min(...ys), mxy = Math.max(...ys);
  return 'M' + pts.map((p) => `${((p[0] - mnx) / (mxx - mnx)).toFixed(4)} ${((p[1] - mny) / (mxy - mny)).toFixed(4)}`).join('L') + 'Z';
}
function regPoly(n, rot = -Math.PI / 2) {
  const pts = []; for (let i = 0; i < n; i++) { const a = rot + (i * 2 * Math.PI) / n; pts.push([Math.cos(a), Math.sin(a)]); }
  return normPts(pts);
}
function starPts(n, inner, rot = -Math.PI / 2) {
  const pts = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? inner : 1, a = rot + (i * Math.PI) / n; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
  return normPts(pts);
}
const UNIT = {
  rect: 'M0 0L1 0L1 1L0 1Z',
  ellipse: 'M0.5 0C0.77614 0 1 0.22386 1 0.5C1 0.77614 0.77614 1 0.5 1C0.22386 1 0 0.77614 0 0.5C0 0.22386 0.22386 0 0.5 0Z',
  triangle: 'M0.5 0L1 1L0 1Z',
  rtriangle: 'M0 0L1 1L0 1Z',
  diamond: 'M0.5 0L1 0.5L0.5 1L0 0.5Z',
  pentagon: regPoly(5),
  hexagon: regPoly(6),
  octagon: regPoly(8, -Math.PI / 2 + Math.PI / 8),
  arrowR: 'M0 0.3L0.55 0.3L0.55 0L1 0.5L0.55 1L0.55 0.7L0 0.7Z',
  arrowL: 'M1 0.3L0.45 0.3L0.45 0L0 0.5L0.45 1L0.45 0.7L1 0.7Z',
  arrowU: 'M0.3 1L0.3 0.45L0 0.45L0.5 0L1 0.45L0.7 0.45L0.7 1Z',
  arrowD: 'M0.3 0L0.3 0.55L0 0.55L0.5 1L1 0.55L0.7 0.55L0.7 0Z',
  star4: starPts(4, 0.38),
  star5: starPts(5, 0.42),
  star6: starPts(6, 0.55),
  heart: 'M0.5 0.22C0.5 0.08 0.38 0 0.26 0C0.1 0 0 0.13 0 0.3C0 0.6 0.3 0.8 0.5 1C0.7 0.8 1 0.6 1 0.3C1 0.13 0.9 0 0.74 0C0.62 0 0.5 0.08 0.5 0.22Z',
  lightning: 'M0.58 0L0.08 0.56L0.44 0.56L0.3 1L0.92 0.4L0.56 0.4L0.78 0Z',
  callout: 'M0.12 0L0.88 0Q1 0 1 0.12L1 0.6Q1 0.72 0.88 0.72L0.45 0.72L0.2 1L0.26 0.72L0.12 0.72Q0 0.72 0 0.6L0 0.12Q0 0 0.12 0Z',
};
const SHAPE_LIST = [
  ['line', 'Line'], ['rect', 'Rectangle'], ['roundrect', 'Rounded rectangle'], ['ellipse', 'Ellipse'], ['triangle', 'Triangle'],
  ['rtriangle', 'Right triangle'], ['diamond', 'Diamond'], ['pentagon', 'Pentagon'], ['hexagon', 'Hexagon'], ['octagon', 'Octagon'],
  ['arrowR', 'Right arrow'], ['arrowL', 'Left arrow'], ['arrowU', 'Up arrow'], ['arrowD', 'Down arrow'], ['star4', '4-point star'],
  ['star5', '5-point star'], ['star6', '6-point star'], ['heart', 'Heart'], ['lightning', 'Lightning'], ['callout', 'Callout'],
];
function mapD(d, x, y, w, h) {
  let i = 0;
  return d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (m) => { const v = parseFloat(m); const r = i++ % 2 === 0 ? x + v * w : y + v * h; return +r.toFixed(3); });
}
function shapeD(type, x, y, w, h) {
  if (type === 'roundrect') {
    const r = Math.min(w, h) * 0.2;
    return `M${x + r} ${y}L${x + w - r} ${y}Q${x + w} ${y} ${x + w} ${y + r}L${x + w} ${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}L${x + r} ${y + h}Q${x} ${y + h} ${x} ${y + h - r}L${x} ${y + r}Q${x} ${y} ${x + r} ${y}Z`;
  }
  return mapD(UNIT[type] || UNIT.rect, x, y, w, h);
}

// ============================================================ state
function loadJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
const settings = Object.assign({ aa: true, grid: false, transparent: false, autoSize: true, w: 1280, h: 720, custom: [] }, loadJSON('paint.settings'));
function saveSettings() { try { localStorage.setItem('paint.settings', JSON.stringify(settings)); } catch (e) { /* ignore */ } }

const TOOL_DEFAULTS = {
  pencil: { size: 1, strength: 100 }, brush: { size: 13, strength: 100 }, eraser: { size: 16, strength: 100 },
  spray: { size: 30, strength: 40 }, shape: { size: 3, strength: 100 }, text: { size: 24, strength: 100 }, fill: { size: 1, strength: 12 },
};
const USES_SIZE = new Set(['pencil', 'brush', 'eraser', 'spray', 'shape', 'text']);
const USES_STRENGTH = new Set(['pencil', 'brush', 'eraser', 'spray', 'shape', 'fill']);
const BRUSHES = [['brush', 'Brush'], ['calli1', 'Calligraphy brush 1'], ['calli2', 'Calligraphy brush 2'], ['marker', 'Marker'], ['crayon', 'Crayon'], ['watercolor', 'Watercolor brush']];

const S = {
  w: settings.w, h: settings.h, zoom: 1, layers: [], active: 0,
  tool: 'select', prevTool: 'pencil', brushType: 'brush', shape: 'rect', fillMode: 'outline', selectMode: 'rect', transparentSel: false,
  L: '#000000', R: '#ffffff', opts: JSON.parse(JSON.stringify(TOOL_DEFAULTS)),
  font: { family: 'Arial', bold: false, italic: false, underline: false, opaque: false },
  dirty: false, fileName: 'Untitled', filePath: null,
  sel: null, shapeP: null, textP: null, undo: [], redo: [], clip: null,
};
let nextId = 1, layerCount = 0, drag = null, afterSave = null;

const ws = $('#workspace'), stage = $('#stage'), layersEl = $('#layers'), floatEl = $('#float'), svg = $('#svg');
const handlesEl = $('#handles'), cursorEl = $('#brushcursor'), ghost = $('#ghost');
const textbox = $('#textbox'), textarea = $('#textarea'), texttools = $('#texttools');

// ============================================================ canvas helpers
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function cloneCanvas(src) { const c = makeCanvas(src.width, src.height); c.getContext('2d').drawImage(src, 0, 0); return c; }
function mkLayer(name, canvas) { return { id: nextId++, name, canvas, ctx: canvas.getContext('2d'), visible: true, opacity: 1 }; }
function blankLayer(name, fill) {
  const c = makeCanvas(S.w, S.h);
  if (fill) { const x = c.getContext('2d'); x.fillStyle = fill; x.fillRect(0, 0, c.width, c.height); }
  return mkLayer(name, c);
}
function setLayerCanvas(l, c) { l.canvas = c; l.ctx = c.getContext('2d'); }
const AL = () => S.layers[S.active];
const tmp = makeCanvas(S.w, S.h), tctx = tmp.getContext('2d');
function ensureTmp() { if (tmp.width !== S.w || tmp.height !== S.h) { tmp.width = S.w; tmp.height = S.h; } }
function scaleCanvas(c, w, h) {
  const r = makeCanvas(w, h), x = r.getContext('2d');
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, r.width, r.height); return r;
}
function rotCanvas(c, deg) {
  const r = deg === 180 ? makeCanvas(c.width, c.height) : makeCanvas(c.height, c.width), x = r.getContext('2d');
  x.translate(r.width / 2, r.height / 2); x.rotate((deg * Math.PI) / 180); x.drawImage(c, -c.width / 2, -c.height / 2); return r;
}
function flipCanvas(c, dir) {
  const r = makeCanvas(c.width, c.height), x = r.getContext('2d');
  if (dir === 'h') { x.translate(c.width, 0); x.scale(-1, 1); } else { x.translate(0, c.height); x.scale(1, -1); }
  x.drawImage(c, 0, 0); return r;
}
function skewCanvas(c, hd, vd, bg) {
  const th = Math.tan((hd * Math.PI) / 180), tv = Math.tan((vd * Math.PI) / 180);
  const r = makeCanvas(c.width + Math.abs(th) * c.height, c.height + Math.abs(tv) * c.width), x = r.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, r.width, r.height); }
  x.setTransform(1, tv, th, 1, th < 0 ? -th * c.height : 0, tv < 0 ? -tv * c.width : 0); x.drawImage(c, 0, 0); return r;
}
function pixelOp(c, fn) { const x = c.getContext('2d'); const img = x.getImageData(0, 0, c.width, c.height); fn(img.data, c.width, c.height); x.putImageData(img, 0, 0); return c; }
function invertData(d) { for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } }
function blurPass(d, W, H, r, horiz) {
  const out = new Uint8ClampedArray(d.length), len = horiz ? W : H, lines = horiz ? H : W, win = 2 * r + 1;
  for (let l = 0; l < lines; l++) {
    const base = horiz ? l * W * 4 : l * 4, step = horiz ? 4 : W * 4;
    for (let ch = 0; ch < 4; ch++) {
      const at = (i) => base + (i < 0 ? 0 : i >= len ? len - 1 : i) * step + ch;
      let sum = 0; for (let i = -r; i <= r; i++) sum += d[at(i)];
      for (let i = 0; i < len; i++) { out[base + i * step + ch] = sum / win; sum += d[at(i + r + 1)] - d[at(i - r)]; }
    }
  }
  d.set(out);
}
function blurData(d, W, H) { for (let k = 0; k < 2; k++) { blurPass(d, W, H, 2, true); blurPass(d, W, H, 2, false); } }
function pixelateData(d, W, H) {
  const b = 8;
  for (let by = 0; by < H; by += b) for (let bx = 0; bx < W; bx += b) {
    let r = 0, g = 0, bl = 0, a = 0, n = 0;
    for (let y = by; y < Math.min(by + b, H); y++) for (let x = bx; x < Math.min(bx + b, W); x++) { const i = (y * W + x) * 4; r += d[i]; g += d[i + 1]; bl += d[i + 2]; a += d[i + 3]; n++; }
    for (let y = by; y < Math.min(by + b, H); y++) for (let x = bx; x < Math.min(bx + b, W); x++) { const i = (y * W + x) * 4; d[i] = r / n; d[i + 1] = g / n; d[i + 2] = bl / n; d[i + 3] = a / n; }
  }
}
function flatten() {
  const c = makeCanvas(S.w, S.h), x = c.getContext('2d');
  for (const l of S.layers) { if (!l.visible) continue; x.globalAlpha = l.opacity; x.drawImage(l.canvas, 0, 0); }
  const s = S.sel; if (s && s.float) { x.globalAlpha = AL().opacity; x.drawImage(s.float, s.x, s.y, s.w, s.h); }
  return c;
}
function syncLayers() {
  layersEl.replaceChildren(...S.layers.map((l) => { l.canvas.classList.toggle('hiddenlayer', !l.visible); l.canvas.style.opacity = l.opacity; return l.canvas; }));
  renderLayerPanel();
}

// ============================================================ history
function snapshot() {
  return { w: S.w, h: S.h, active: S.active, layers: S.layers.map((l) => ({ id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, canvas: cloneCanvas(l.canvas) })) };
}
function restore(s) {
  S.w = s.w; S.h = s.h;
  S.layers = s.layers.map((L) => ({ id: L.id, name: L.name, visible: L.visible, opacity: L.opacity, canvas: L.canvas, ctx: L.canvas.getContext('2d') }));
  S.active = Math.min(s.active, S.layers.length - 1);
  afterDocChange();
}
function trimHistory() {
  const bytes = (s) => s.layers.length * s.w * s.h * 4;
  let total = S.undo.reduce((a, s) => a + bytes(s), 0);
  while (S.undo.length > 3 && (S.undo.length > 60 || total > 700e6)) total -= bytes(S.undo.shift());
}
function pushHistory() { S.undo.push(snapshot()); S.redo.length = 0; trimHistory(); setDirty(true); updateUI(); }
function beginOp() { pushHistory(); return S.undo[S.undo.length - 1].layers[S.active].canvas; }
function undo() { commitAll(); if (!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); setDirty(true); }
function redo() { commitAll(); if (!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); setDirty(true); }

// ============================================================ title / dirty
let lastTitle = '';
function setDirty(v) { S.dirty = v; updateTitle(); }
function updateTitle() {
  const t = `${S.fileName}${S.dirty ? ' *' : ''} - Paint`;
  if (t === lastTitle) return; lastTitle = t;
  $('#title').textContent = t; document.title = t; native('title', { title: t, dirty: S.dirty });
}

// ============================================================ zoom / layout
const ZOOMS = [0.125, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];
const zToSlider = (z) => Math.round((1000 * Math.log(z / 0.1)) / Math.log(80));
const sliderToZ = (v) => 0.1 * Math.pow(80, v / 1000);
function applyZoom() {
  const z = S.zoom;
  stage.style.width = S.w * z + 'px'; stage.style.height = S.h * z + 'px';
  stage.classList.toggle('pix', z >= 1);
  svg.setAttribute('width', S.w * z); svg.setAttribute('height', S.h * z);
  updateGrid(); renderOverlays(); if (S.textP) styleTextarea();
  $('#zoom-input').value = Math.round(z * 1000) / 10 + '%';
  $('#zoom-slider').value = zToSlider(z);
}
function setZoom(z, cx, cy) {
  z = clamp(z, 0.1, 8);
  const r = ws.getBoundingClientRect();
  if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
  const sr = stage.getBoundingClientRect(); const dx = (cx - sr.left) / S.zoom, dy = (cy - sr.top) / S.zoom;
  S.zoom = z; applyZoom();
  const sr2 = stage.getBoundingClientRect();
  ws.scrollLeft += sr2.left + dx * z - cx; ws.scrollTop += sr2.top + dy * z - cy;
}
function zoomStep(dir) {
  const z = S.zoom;
  const next = dir > 0 ? ZOOMS.find((v) => v > z + 1e-6) : [...ZOOMS].reverse().find((v) => v < z - 1e-6);
  if (next) setZoom(next);
}
function fitZoom() {
  const aw = ws.clientWidth - 140, ah = ws.clientHeight - 140;
  if (aw < 50 || ah < 50) { setZoom(1); return; }
  setZoom(Math.min(1, aw / S.w, ah / S.h));
}
function updateGrid() {
  const g = $('#gridlines');
  if (!settings.grid) { g.style.display = 'none'; return; }
  const z = S.zoom, step = z >= 4 ? 1 : z >= 1 ? 10 : 50, px = step * z;
  g.style.display = 'block';
  g.style.backgroundImage = 'linear-gradient(to right, rgba(0,0,0,.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.22) 1px, transparent 1px)';
  g.style.backgroundSize = `${px}px ${px}px`;
}
function docPt(e) { const r = stage.getBoundingClientRect(); return { x: (e.clientX - r.left) / S.zoom, y: (e.clientY - r.top) / S.zoom }; }
function afterDocChange() { ensureTmp(); syncLayers(); applyZoom(); updateUI(); }

// ============================================================ compositing
function grow(bb, x, y, r) { bb.x0 = Math.min(bb.x0, x - r); bb.y0 = Math.min(bb.y0, y - r); bb.x1 = Math.max(bb.x1, x + r); bb.y1 = Math.max(bb.y1, y + r); }
function union(a, b) { return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }; }
function bbRect(bb) {
  if (!bb) return [0, 0, S.w, S.h];
  const x = Math.max(0, Math.floor(bb.x0) - 2), y = Math.max(0, Math.floor(bb.y0) - 2);
  return [x, y, Math.min(S.w, Math.ceil(bb.x1) + 2) - x, Math.min(S.h, Math.ceil(bb.y1) + 2) - y];
}
function recomposite(base, alpha, erase, bb) {
  const [x, y, w, h] = bbRect(bb); if (w <= 0 || h <= 0) return;
  const c = AL().ctx; c.save();
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.clearRect(x, y, w, h); c.drawImage(base, x, y, w, h, x, y, w, h);
  c.globalAlpha = alpha; c.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
  c.drawImage(tmp, x, y, w, h, x, y, w, h); c.restore();
}
function thresholdTmp(bb) {
  const [x, y, w, h] = bbRect(bb); if (w <= 0 || h <= 0) return;
  pixelOp({ width: w, height: h, getContext: () => ({ getImageData: () => tctx.getImageData(x, y, w, h), putImageData: (img) => tctx.putImageData(img, x, y) }) },
    (d) => { for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0; });
}

// ============================================================ freehand tools
function bresenham(x0, y0, x1, y1, fn) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 100000; guard++) {
    fn(x0, y0); if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function walk(a, b, step, fn) {
  const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / step));
  for (let i = 1; i <= n; i++) fn({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n });
}
function sprayAt(d, p) {
  const s = d.size, n = Math.max(2, Math.round(((s * s) / 30) * (S.opts.spray.strength / 100) * 2));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * s / 2;
    tctx.fillRect(Math.floor(p.x + Math.cos(a) * r), Math.floor(p.y + Math.sin(a) * r), 1, 1);
  }
  grow(d.bb, p.x, p.y, s / 2 + 2);
}
function dab(d, a, b, first) {
  const ctx = tctx, s = d.size;
  ctx.fillStyle = d.color; ctx.strokeStyle = d.color;
  grow(d.bb, a.x, a.y, s + 2); grow(d.bb, b.x, b.y, s + 2);
  if (d.tool === 'pencil' || d.tool === 'eraser') {
    const off = Math.floor(s / 2);
    bresenham(Math.floor(a.x), Math.floor(a.y), Math.floor(b.x), Math.floor(b.y), (x, y) => ctx.fillRect(x - off, y - off, s, s));
    return;
  }
  if (d.tool === 'spray') { sprayAt(d, b); return; }
  const t = S.brushType;
  if (t === 'brush' || t === 'marker') {
    if (first || (a.x === b.x && a.y === b.y)) { ctx.beginPath(); ctx.arc(b.x, b.y, s / 2, 0, Math.PI * 2); ctx.fill(); return; }
    ctx.lineWidth = s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  } else if (t === 'calli1' || t === 'calli2') {
    const ang = t === 'calli1' ? -Math.PI / 4 : Math.PI / 4, dx = (Math.cos(ang) * s) / 2, dy = (Math.sin(ang) * s) / 2;
    ctx.beginPath(); ctx.moveTo(a.x + dx, a.y + dy); ctx.lineTo(b.x + dx, b.y + dy); ctx.lineTo(b.x - dx, b.y - dy); ctx.lineTo(a.x - dx, a.y - dy); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b.x + dx, b.y + dy); ctx.lineTo(b.x - dx, b.y - dy); ctx.stroke();
  } else if (t === 'crayon') {
    const pts = first ? [b] : []; if (!first) walk(a, b, Math.max(1, s / 4), (p) => pts.push(p));
    for (const p of pts) {
      const n = Math.ceil((s * s) / 8) + 2;
      for (let i = 0; i < n; i++) {
        const an = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * s / 2;
        ctx.globalAlpha = 0.35 + Math.random() * 0.65; ctx.fillRect(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr, 1.3, 1.3);
      }
    }
    ctx.globalAlpha = 1;
  } else if (t === 'watercolor') {
    const [r, g, bl] = hexToRgb(d.color);
    const pts = first ? [b] : []; if (!first) walk(a, b, Math.max(1, s / 5), (p) => pts.push(p));
    for (const p of pts) {
      const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s / 2);
      gr.addColorStop(0, `rgba(${r},${g},${bl},0.14)`); gr.addColorStop(0.7, `rgba(${r},${g},${bl},0.08)`); gr.addColorStop(1, `rgba(${r},${g},${bl},0)`);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function startStroke(pt, sec) {
  commitAll();
  const tool = S.tool, o = S.opts[tool];
  let color = tool === 'eraser' ? (sec ? 'transparent' : S.active === 0 ? S.R : 'transparent') : sec ? S.R : S.L;
  const erase = color === 'transparent';
  let alpha = o.strength / 100;
  if (tool === 'brush' && S.brushType === 'marker') alpha *= 0.55;
  if (tool === 'spray') alpha = 1;
  const base = beginOp(); ensureTmp(); tctx.clearRect(0, 0, S.w, S.h);
  drag = { type: 'stroke', tool, color: erase ? '#000000' : color, erase, alpha, base, last: pt, cur: pt, size: o.size, bb: { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y } };
  dab(drag, pt, pt, true);
  recomposite(base, alpha, erase, drag.bb);
  if (tool === 'spray') {
    const d = drag;
    d.timer = setInterval(() => { tctx.fillStyle = d.color; sprayAt(d, d.cur); recomposite(d.base, d.alpha, d.erase, d.bb); }, 30);
  }
}
function moveStroke(e) {
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  const list = evs.length ? evs : [e];
  for (const ev of list) { const p = docPt(ev); dab(drag, drag.last, p, false); drag.last = p; drag.cur = p; }
  recomposite(drag.base, drag.alpha, drag.erase, drag.bb);
}

// ============================================================ fill & picker
function floodFill(pt, sec) {
  commitAll();
  const x = Math.floor(pt.x), y = Math.floor(pt.y);
  if (x < 0 || y < 0 || x >= S.w || y >= S.h) return;
  const color = sec ? S.R : S.L, W = S.w, H = S.h, L = AL();
  const img = L.ctx.getImageData(0, 0, W, H), d = img.data;
  const i0 = (y * W + x) * 4, tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3];
  const tol = (S.opts.fill.strength / 100) * 255;
  const [fr, fg, fb] = color === 'transparent' ? [0, 0, 0] : hexToRgb(color), fa = color === 'transparent' ? 0 : 255;
  if (tol < 1 && fr === tr && fg === tg && fb === tb && fa === ta) return;
  const match = (k) => { const i = k * 4; return Math.abs(d[i] - tr) <= tol && Math.abs(d[i + 1] - tg) <= tol && Math.abs(d[i + 2] - tb) <= tol && Math.abs(d[i + 3] - ta) <= tol; };
  const seen = new Uint8Array(W * H), stack = [x, y];
  const paint = (k) => { const i = k * 4; d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = fa; seen[k] = 1; };
  while (stack.length) {
    const cy = stack.pop(), cx = stack.pop();
    if (seen[cy * W + cx] || !match(cy * W + cx)) continue;
    let lx = cx, rx = cx;
    while (lx > 0 && !seen[cy * W + lx - 1] && match(cy * W + lx - 1)) lx--;
    while (rx < W - 1 && !seen[cy * W + rx + 1] && match(cy * W + rx + 1)) rx++;
    for (let i = lx; i <= rx; i++) paint(cy * W + i);
    for (const ny of [cy - 1, cy + 1]) {
      if (ny < 0 || ny >= H) continue;
      let span = false;
      for (let i = lx; i <= rx; i++) {
        const k = ny * W + i;
        if (!seen[k] && match(k)) { if (!span) { stack.push(i, ny); span = true; } } else span = false;
      }
    }
  }
  pushHistory(); L.ctx.putImageData(img, 0, 0); refreshThumbs();
}
function pickColor(pt, sec) {
  const x = Math.floor(pt.x), y = Math.floor(pt.y);
  if (x < 0 || y < 0 || x >= S.w || y >= S.h) return;
  const c = makeCanvas(1, 1), cx = c.getContext('2d');
  for (const l of S.layers) if (l.visible) { cx.globalAlpha = l.opacity; cx.drawImage(l.canvas, x, y, 1, 1, 0, 0, 1, 1); }
  const p = cx.getImageData(0, 0, 1, 1).data;
  setColor(sec ? 'R' : 'L', p[3] === 0 ? 'transparent' : rgbToHex(p[0], p[1], p[2]));
  setTool(S.prevTool || 'pencil');
}

// ============================================================ shapes
function shapeBounds(p) { return { x: Math.min(p.x1, p.x2), y: Math.min(p.y1, p.y2), w: Math.abs(p.x2 - p.x1), h: Math.abs(p.y2 - p.y1) }; }
function renderShape() {
  const p = S.shapeP; if (!p) return;
  const o = S.opts.shape, strokeC = p.sec ? S.R : S.L, fillC = p.sec ? S.L : S.R;
  const mode = p.type === 'line' ? 'outline' : S.fillMode;
  const erase = strokeC === 'transparent' && (mode !== 'both' || fillC === 'transparent');
  const b = shapeBounds(p), pad = o.size + 4;
  const nb = { x0: b.x - pad, y0: b.y - pad, x1: b.x + b.w + pad, y1: b.y + b.h + pad };
  const bb = p.bb ? union(p.bb, nb) : nb; p.bb = nb;
  const [rx, ry, rw, rh] = bbRect(bb); tctx.clearRect(rx, ry, rw, rh);
  const ctx = tctx; ctx.save();
  ctx.lineWidth = o.size; ctx.lineJoin = 'miter'; ctx.miterLimit = 4; ctx.lineCap = 'butt';
  const sc = erase ? '#000000' : strokeC, fc = erase ? '#000000' : fillC;
  if (p.type === 'line') {
    ctx.lineCap = 'round'; ctx.strokeStyle = sc;
    ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
  } else if (b.w > 0 || b.h > 0) {
    const path = new Path2D(shapeD(p.type, b.x, b.y, b.w, b.h));
    if (['ellipse', 'heart', 'roundrect', 'callout'].includes(p.type)) ctx.lineJoin = 'round';
    if (mode === 'fill') { if (sc !== 'transparent') { ctx.fillStyle = sc; ctx.fill(path); } }
    else {
      if (mode === 'both' && fc !== 'transparent') { ctx.fillStyle = fc; ctx.fill(path); }
      if (sc !== 'transparent') { ctx.strokeStyle = sc; ctx.stroke(path); }
    }
  }
  ctx.restore();
  if (!settings.aa) thresholdTmp(nb);
  recomposite(p.base, o.strength / 100, erase, bb);
}
function startShape(pt, sec) {
  commitAll();
  const base = beginOp(); ensureTmp(); tctx.clearRect(0, 0, S.w, S.h);
  S.shapeP = { type: S.shape, x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y, sec, base, bb: null };
  drag = { type: 'shapeNew' };
}
function constrain(p, pt, shift) {
  let x2 = pt.x, y2 = pt.y;
  if (shift) {
    const dx = pt.x - p.x1, dy = pt.y - p.y1;
    if (p.type === 'line') {
      const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(dx, dy);
      x2 = p.x1 + Math.cos(a) * len; y2 = p.y1 + Math.sin(a) * len;
    } else { const m = Math.max(Math.abs(dx), Math.abs(dy)); x2 = p.x1 + Math.sign(dx || 1) * m; y2 = p.y1 + Math.sign(dy || 1) * m; }
  }
  p.x2 = x2; p.y2 = y2;
}
function insideShape(pt) {
  const p = S.shapeP, tol = 6 / S.zoom + S.opts.shape.size / 2;
  if (p.type === 'line') {
    const vx = p.x2 - p.x1, vy = p.y2 - p.y1, L2 = vx * vx + vy * vy || 1;
    const t = clamp(((pt.x - p.x1) * vx + (pt.y - p.y1) * vy) / L2, 0, 1);
    return Math.hypot(pt.x - (p.x1 + t * vx), pt.y - (p.y1 + t * vy)) <= tol + 2;
  }
  const b = shapeBounds(p);
  return pt.x >= b.x - tol && pt.x <= b.x + b.w + tol && pt.y >= b.y - tol && pt.y <= b.y + b.h + tol;
}
function commitShape() { if (!S.shapeP) return; S.shapeP = null; renderOverlays(); refreshThumbs(); }
function cancelShape() {
  const p = S.shapeP; if (!p) return;
  const c = AL().ctx; c.clearRect(0, 0, S.w, S.h); c.drawImage(p.base, 0, 0);
  S.undo.pop(); S.shapeP = null; if (!S.undo.length) setDirty(false); renderOverlays(); updateUI();
}
function resizeRect(r, h, dx, dy, keep) {
  let x = r.x, y = r.y, w = r.w, hh = r.h;
  if (h.includes('w')) { x += dx; w -= dx; }
  if (h.includes('e')) w += dx;
  if (h.includes('n')) { y += dy; hh -= dy; }
  if (h.includes('s')) hh += dy;
  if (keep && r.w && r.h && h.length === 2) {
    const ratio = r.w / r.h;
    if (Math.abs(w) / ratio > Math.abs(hh)) { const nh = Math.abs(w) / ratio * Math.sign(hh || 1); if (h.includes('n')) y -= nh - hh; hh = nh; }
    else { const nw = Math.abs(hh) * ratio * Math.sign(w || 1); if (h.includes('w')) x -= nw - w; w = nw; }
  }
  if (w < 0) { x += w; w = -w; } if (hh < 0) { y += hh; hh = -hh; }
  return { x, y, w: Math.max(1, w), h: Math.max(1, hh) };
}

// ============================================================ selection
function pathTo(ctx, rel, x, y, w, h) {
  ctx.moveTo(x + rel[0][0] * w, y + rel[0][1] * h);
  for (let i = 1; i < rel.length; i++) ctx.lineTo(x + rel[i][0] * w, y + rel[i][1] * h);
  ctx.closePath();
}
function holeFill(ctx, s) {
  ctx.save(); ctx.beginPath();
  if (s.path) pathTo(ctx, s.path, s.x, s.y, s.w, s.h); else ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  if (S.active === 0 && S.R !== 'transparent') { ctx.fillStyle = S.R; ctx.fillRect(s.x, s.y, s.w, s.h); } else ctx.clearRect(s.x, s.y, s.w, s.h);
  ctx.restore();
}
function lift() {
  const s = S.sel; if (!s || s.orig) return;
  pushHistory();
  const L = AL(), o = makeCanvas(s.w, s.h), oc = o.getContext('2d');
  if (s.path) { oc.save(); oc.beginPath(); pathTo(oc, s.path, 0, 0, s.w, s.h); oc.clip(); }
  oc.drawImage(L.canvas, -s.x, -s.y); if (s.path) oc.restore();
  holeFill(L.ctx, s);
  s.orig = o; s.path = null; deriveFloat(); renderOverlays();
}
function deriveFloat() {
  const s = S.sel; if (!s || !s.orig) return;
  const f = cloneCanvas(s.orig);
  if (S.transparentSel && S.R !== 'transparent') {
    const [r, g, b] = hexToRgb(S.R);
    pixelOp(f, (d) => { for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - r) < 10 && Math.abs(d[i + 1] - g) < 10 && Math.abs(d[i + 2] - b) < 10) d[i + 3] = 0; });
  }
  s.float = f;
  floatEl.width = f.width; floatEl.height = f.height;
  const fc = floatEl.getContext('2d'); fc.clearRect(0, 0, f.width, f.height); fc.drawImage(f, 0, 0);
}
function scaledOrig() {
  const s = S.sel;
  if (s.orig.width !== Math.round(s.w) || s.orig.height !== Math.round(s.h)) s.orig = scaleCanvas(s.orig, s.w, s.h);
  return s.orig;
}
function stampFloat() {
  const s = S.sel; if (!s || !s.float) return;
  const c = AL().ctx; c.save();
  c.imageSmoothingEnabled = s.w !== s.float.width || s.h !== s.float.height; c.imageSmoothingQuality = 'high';
  c.drawImage(s.float, s.x, s.y, s.w, s.h); c.restore();
}
function commitSel() {
  if (!S.sel) return;
  stampFloat(); S.sel = null; renderOverlays(); refreshThumbs(); updateUI();
}
function deleteSelection() {
  const s = S.sel; if (!s) return;
  if (!s.orig) { pushHistory(); holeFill(AL().ctx, s); }
  S.sel = null; renderOverlays(); refreshThumbs(); updateUI();
}
function selectAll() { commitAll(); setTool('select'); S.sel = { x: 0, y: 0, w: S.w, h: S.h, path: null }; renderOverlays(); updateUI(); }
function selectionCanvas() {
  const s = S.sel; if (!s) return null;
  if (s.float) return s.w === s.float.width && s.h === s.float.height ? cloneCanvas(s.float) : scaleCanvas(s.float, s.w, s.h);
  const c = makeCanvas(s.w, s.h), x = c.getContext('2d');
  if (s.path) { x.beginPath(); pathTo(x, s.path, 0, 0, s.w, s.h); x.clip(); }
  x.drawImage(AL().canvas, -s.x, -s.y); return c;
}
function startSelect(e, pt, h) {
  const s = S.sel;
  if (s && h && !h.startsWith('c-')) { lift(); drag = { type: 'selResize', h, start: { x: s.x, y: s.y, w: s.w, h: s.h }, pt0: pt }; return; }
  if (s && pt.x >= s.x && pt.x <= s.x + s.w && pt.y >= s.y && pt.y <= s.y + s.h) {
    if (s.float && (e.altKey || e.metaKey)) stampFloat();
    lift(); drag = { type: 'selMove', dx: pt.x - s.x, dy: pt.y - s.y }; return;
  }
  commitAll();
  const p = { x: clamp(pt.x, 0, S.w), y: clamp(pt.y, 0, S.h) };
  drag = { type: 'selNew', x0: p.x, y0: p.y, pts: [p], free: S.selectMode === 'free' };
  S.sel = null; renderOverlays();
}
function moveSelNew(e, pt) {
  const p = { x: clamp(pt.x, 0, S.w), y: clamp(pt.y, 0, S.h) };
  if (drag.free) {
    const last = drag.pts[drag.pts.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 0.7 / S.zoom) drag.pts.push(p);
    const xs = drag.pts.map((q) => q.x), ys = drag.pts.map((q) => q.y);
    const x = Math.floor(Math.min(...xs)), y = Math.floor(Math.min(...ys));
    drag.box = { x, y, w: Math.ceil(Math.max(...xs)) - x, h: Math.ceil(Math.max(...ys)) - y };
  } else {
    let x1 = p.x, y1 = p.y;
    if (e.shiftKey) { const m = Math.max(Math.abs(x1 - drag.x0), Math.abs(y1 - drag.y0)); x1 = drag.x0 + Math.sign(x1 - drag.x0 || 1) * m; y1 = drag.y0 + Math.sign(y1 - drag.y0 || 1) * m; }
    const x = Math.round(Math.min(drag.x0, x1)), y = Math.round(Math.min(drag.y0, y1));
    S.sel = { x, y, w: Math.round(Math.max(drag.x0, x1)) - x, h: Math.round(Math.max(drag.y0, y1)) - y, path: null };
  }
  renderOverlays();
}
function endSelNew() {
  if (drag.free) {
    const b = drag.box;
    if (drag.pts.length < 3 || !b || b.w < 1 || b.h < 1) S.sel = null;
    else S.sel = { x: b.x, y: b.y, w: b.w, h: b.h, path: drag.pts.map((q) => [(q.x - b.x) / b.w, (q.y - b.y) / b.h]) };
  } else if (S.sel && (S.sel.w < 1 || S.sel.h < 1)) S.sel = null;
}

// ============================================================ text
const fontCss = (f) => (f.startsWith('-') ? f : `"${f}"`) + ', sans-serif';
const fontStr = (fs) => `${S.font.italic ? 'italic ' : ''}${S.font.bold ? 'bold ' : ''}${fs}px ${fontCss(S.font.family)}`;
function styleTextarea() {
  const z = S.zoom, fs = S.opts.text.size;
  textarea.style.font = fontStr(fs * z);
  textarea.style.lineHeight = fs * 1.25 * z + 'px';
  textarea.style.color = S.L === 'transparent' ? '#888' : S.L;
  textarea.style.textDecoration = S.font.underline ? 'underline' : 'none';
  textbox.style.background = S.font.opaque && S.R !== 'transparent' ? S.R : 'transparent';
  $('#tt-bold').classList.toggle('on', S.font.bold); $('#tt-italic').classList.toggle('on', S.font.italic);
  $('#tt-underline').classList.toggle('on', S.font.underline); $('#tt-opaque').classList.toggle('on', S.font.opaque);
  $('#font-family').value = S.font.family; $('#font-size').value = fs;
  growText();
}
function growText() {
  if (!S.textP) return;
  const need = textarea.scrollHeight / S.zoom;
  if (need > S.textP.h + 0.5) { S.textP.h = need; renderOverlays(); }
}
function openText(r) {
  const fs = S.opts.text.size;
  if (r.w < 8) { r.w = Math.max(160, fs * 7); r.h = fs * 1.25 + 2; }
  r.h = Math.max(r.h, fs * 1.25 + 2);
  S.textP = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
  textarea.value = '';
  textbox.style.display = 'block'; texttools.style.display = 'flex';
  renderOverlays(); styleTextarea();
  setTimeout(() => textarea.focus(), 0);
}
function wrapText(ctx, txt, maxW) {
  const out = [], W = (s) => ctx.measureText(s).width;
  for (const para of txt.split('\n')) {
    let line = '';
    for (const tk of para.split(/(\s+)/)) {
      if (!tk) continue;
      if (W(line + tk) <= maxW) { line += tk; continue; }
      if (/^\s+$/.test(tk)) { out.push(line); line = ''; continue; }
      if (line) { out.push(line.replace(/\s+$/, '')); line = ''; }
      if (W(tk) <= maxW) { line = tk; continue; }
      for (const ch of tk) { if (W(line + ch) > maxW && line) { out.push(line); line = ch; } else line += ch; }
    }
    out.push(line);
  }
  return out;
}
function commitText() {
  const t = S.textP; if (!t) return;
  S.textP = null; textbox.style.display = 'none'; texttools.style.display = 'none';
  const txt = textarea.value; textarea.value = ''; textarea.blur();
  if (txt.trim()) {
    pushHistory();
    const ctx = AL().ctx, fs = S.opts.text.size, lh = fs * 1.25;
    ctx.save();
    if (S.font.opaque && S.R !== 'transparent') { ctx.fillStyle = S.R; ctx.fillRect(t.x, t.y, t.w, t.h); }
    ctx.font = fontStr(fs); ctx.textBaseline = 'middle';
    if (S.L === 'transparent') { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; } else ctx.fillStyle = S.L;
    wrapText(ctx, txt, t.w).forEach((ln, i) => {
      const cy = t.y + i * lh + lh / 2;
      ctx.fillText(ln, t.x, cy);
      if (S.font.underline && ln) ctx.fillRect(t.x, cy + fs * 0.36, ctx.measureText(ln).width, Math.max(1, fs / 14));
    });
    ctx.restore(); refreshThumbs();
  }
  renderOverlays(); ws.focus();
}

function commitAll() { commitText(); commitShape(); commitSel(); }
function discardPending() {
  S.sel = null; S.shapeP = null; S.textP = null; drag = null;
  textbox.style.display = 'none'; texttools.style.display = 'none'; textarea.value = '';
}

// ============================================================ overlays
const CUR = { nw: 'nwse-resize', se: 'nwse-resize', ne: 'nesw-resize', sw: 'nesw-resize', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', p1: 'move', p2: 'move' };
function boxHandles(x, y, w, h) {
  return [['nw', x, y], ['n', x + w / 2, y], ['ne', x + w, y], ['e', x + w, y + h / 2], ['se', x + w, y + h], ['s', x + w / 2, y + h], ['sw', x, y + h], ['w', x, y + h / 2]];
}
function ants(d) { return `<path class="ants-bg" d="${d}"/><path class="ants" d="${d}"/>`; }
function renderOverlays() {
  const z = S.zoom; let out = ''; const hs = [];
  const s = S.sel;
  if (s) {
    const x = Math.round(s.x * z) + 0.5, y = Math.round(s.y * z) + 0.5, w = Math.round(s.w * z), h = Math.round(s.h * z);
    if (s.path) out += ants('M' + s.path.map((p) => `${(s.x + p[0] * s.w) * z} ${(s.y + p[1] * s.h) * z}`).join('L') + 'Z');
    out += ants(`M${x} ${y}h${w}v${h}h${-w}Z`);
    if (!(drag && drag.type === 'selNew')) hs.push(...boxHandles(x, y, w, h));
  }
  if (drag && drag.type === 'selNew' && drag.free && drag.pts.length > 1) out += ants('M' + drag.pts.map((p) => `${p.x * z} ${p.y * z}`).join('L'));
  if (s && s.float) {
    floatEl.style.display = 'block';
    floatEl.style.left = s.x * z + 'px'; floatEl.style.top = s.y * z + 'px';
    floatEl.style.width = s.w * z + 'px'; floatEl.style.height = s.h * z + 'px';
    floatEl.style.opacity = AL().opacity;
  } else floatEl.style.display = 'none';
  if (S.shapeP && !(drag && drag.type === 'shapeNew')) {
    const p = S.shapeP;
    if (p.type === 'line') hs.push(['p1', p.x1 * z, p.y1 * z], ['p2', p.x2 * z, p.y2 * z]);
    else { const b = shapeBounds(p); out += `<rect class="shapebox" x="${b.x * z}" y="${b.y * z}" width="${b.w * z}" height="${b.h * z}"/>`; hs.push(...boxHandles(b.x * z, b.y * z, b.w * z, b.h * z)); }
  }
  if (S.textP) {
    const t = S.textP;
    Object.assign(textbox.style, { left: t.x * z + 'px', top: t.y * z + 'px', width: t.w * z + 'px', height: t.h * z + 'px' });
    hs.push(...boxHandles(t.x * z - 2, t.y * z - 2, t.w * z + 4, t.h * z + 4));
    const wr = ws.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const left = sr.left - wr.left + ws.scrollLeft + t.x * z;
    let top = sr.top - wr.top + ws.scrollTop + t.y * z - 46;
    if (top < ws.scrollTop + 4) top = sr.top - wr.top + ws.scrollTop + (t.y + t.h) * z + 12;
    texttools.style.left = Math.max(4, left) + 'px'; texttools.style.top = top + 'px';
  }
  svg.innerHTML = out;
  handlesEl.innerHTML = hs.map(([n, x, y]) => `<div class="h" data-h="${n}" style="left:${x}px;top:${y}px;cursor:${CUR[n]}"></div>`).join('');
  updateStatus();
}
function updateStatus() {
  const s = S.sel || (drag && drag.type === 'selNew' && drag.box);
  $('#st-sel').textContent = s ? `Selection: ${Math.round(s.w)} × ${Math.round(s.h)} px` : S.shapeP ? `Shape: ${Math.round(shapeBounds(S.shapeP).w)} × ${Math.round(shapeBounds(S.shapeP).h)} px` : 'Selection: None';
  if (!(drag && drag.type === 'canvasResize')) $('#st-size').textContent = `${S.w} × ${S.h} px`;
}
function updatePos(pt) {
  const x = Math.floor(pt.x), y = Math.floor(pt.y);
  $('#st-pos').textContent = x >= 0 && y >= 0 && x < S.w && y < S.h ? `X: ${x}, Y: ${y}` : 'X: –, Y: –';
}
function updateCursor(e, pt) {
  const t = S.tool, onHandle = e.target.closest && e.target.closest('[data-h]');
  let show = false;
  if (['pencil', 'brush', 'eraser', 'spray'].includes(t) && !onHandle && !drag?.type?.startsWith('canvas')) {
    const sz = S.opts[t].size, z = S.zoom, px = sz * z;
    if (px >= 5) {
      show = true;
      cursorEl.className = t === 'eraser' || t === 'pencil' ? '' : 'round';
      let l, tp;
      if (t === 'eraser' || t === 'pencil') { const off = Math.floor(sz / 2); l = (Math.floor(pt.x) - off) * z; tp = (Math.floor(pt.y) - off) * z; }
      else { l = pt.x * z - px / 2; tp = pt.y * z - px / 2; }
      Object.assign(cursorEl.style, { left: l + 'px', top: tp + 'px', width: px + 'px', height: px + 'px' });
    }
  }
  cursorEl.style.display = show ? 'block' : 'none';
  ws.style.cursor = show ? 'none' : t === 'text' ? 'text' : t === 'select' && S.sel && inside(pt, S.sel) ? 'move' : 'crosshair';
}
const inside = (pt, r) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;

// ============================================================ pointer
function isTyping(t) {
  return t && (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || (t.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes(t.type)));
}
ws.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#texttools') || e.target === textarea) return;
  if (e.button !== 0 && e.button !== 2) return;
  hidePopups();
  const pt = docPt(e), sec = e.button === 2 || (e.ctrlKey && e.button === 0);
  const hEl = e.target.closest('[data-h]'), h = hEl ? hEl.dataset.h : null;
  try { ws.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  e.preventDefault();
  if (h && h.startsWith('c-')) { commitAll(); drag = { type: 'canvasResize', h: h.slice(2), cx: e.clientX, cy: e.clientY, nw: S.w, nh: S.h }; return; }
  if (S.textP) {
    if (h) { drag = { type: 'textResize', h, start: { ...S.textP }, pt0: pt }; return; }
    if (e.target === textbox) { drag = { type: 'textMove', start: { ...S.textP }, pt0: pt }; return; }
    commitText(); if (S.tool === 'text') return;
  }
  switch (S.tool) {
    case 'select': startSelect(e, pt, h); break;
    case 'pencil': case 'brush': case 'eraser': case 'spray': startStroke(pt, sec); break;
    case 'fill': floodFill(pt, sec); break;
    case 'picker': pickColor(pt, sec); break;
    case 'text': commitAll(); drag = { type: 'textNew', x0: pt.x, y0: pt.y }; break;
    case 'shape': {
      if (S.shapeP) {
        const p = S.shapeP;
        if (h) { drag = { type: 'shapeHandle', h, start: { ...p }, pt0: pt }; return; }
        if (insideShape(pt)) { drag = { type: 'shapeMove', start: { ...p }, pt0: pt }; return; }
        commitShape();
      }
      startShape(pt, sec); break;
    }
  }
});
ws.addEventListener('pointermove', (e) => {
  const pt = docPt(e);
  updateCursor(e, pt); updatePos(pt);
  if (!drag) return;
  const z = S.zoom;
  switch (drag.type) {
    case 'stroke': moveStroke(e); break;
    case 'selNew': moveSelNew(e, pt); break;
    case 'selMove': S.sel.x = Math.round(pt.x - drag.dx); S.sel.y = Math.round(pt.y - drag.dy); renderOverlays(); break;
    case 'selResize': {
      const r = resizeRect(drag.start, drag.h, pt.x - drag.pt0.x, pt.y - drag.pt0.y, e.shiftKey);
      Object.assign(S.sel, { x: Math.round(r.x), y: Math.round(r.y), w: Math.max(1, Math.round(r.w)), h: Math.max(1, Math.round(r.h)) });
      renderOverlays(); break;
    }
    case 'shapeNew': constrain(S.shapeP, pt, e.shiftKey); renderShape(); updateStatus(); break;
    case 'shapeMove': {
      const p = S.shapeP, st = drag.start, dx = pt.x - drag.pt0.x, dy = pt.y - drag.pt0.y;
      p.x1 = st.x1 + dx; p.y1 = st.y1 + dy; p.x2 = st.x2 + dx; p.y2 = st.y2 + dy; renderShape(); renderOverlays(); break;
    }
    case 'shapeHandle': {
      const p = S.shapeP;
      if (drag.h === 'p1') { p.x1 = pt.x; p.y1 = pt.y; } else if (drag.h === 'p2') { p.x2 = pt.x; p.y2 = pt.y; }
      else { const r = resizeRect(shapeBounds(drag.start), drag.h, pt.x - drag.pt0.x, pt.y - drag.pt0.y, e.shiftKey); p.x1 = r.x; p.y1 = r.y; p.x2 = r.x + r.w; p.y2 = r.y + r.h; }
      renderShape(); renderOverlays(); break;
    }
    case 'textNew': {
      const x = Math.min(drag.x0, pt.x), y = Math.min(drag.y0, pt.y), w = Math.abs(pt.x - drag.x0), h = Math.abs(pt.y - drag.y0);
      drag.rect = { x, y, w, h };
      Object.assign(ghost.style, { display: 'block', left: x * z + 'px', top: y * z + 'px', width: w * z + 'px', height: h * z + 'px' }); break;
    }
    case 'textMove': S.textP.x = Math.round(drag.start.x + pt.x - drag.pt0.x); S.textP.y = Math.round(drag.start.y + pt.y - drag.pt0.y); renderOverlays(); break;
    case 'textResize': { const r = resizeRect(drag.start, drag.h, pt.x - drag.pt0.x, pt.y - drag.pt0.y, false); Object.assign(S.textP, { x: Math.round(r.x), y: Math.round(r.y), w: Math.max(20, Math.round(r.w)), h: Math.round(r.h) }); renderOverlays(); growText(); break; }
    case 'canvasResize': {
      const dx = (e.clientX - drag.cx) / z, dy = (e.clientY - drag.cy) / z, h = drag.h;
      let nw = S.w, nh = S.h;
      if (h.includes('e')) nw = S.w + dx; if (h.includes('w')) nw = S.w - dx;
      if (h.includes('s')) nh = S.h + dy; if (h.includes('n')) nh = S.h - dy;
      drag.nw = clamp(Math.round(nw), 1, 20000); drag.nh = clamp(Math.round(nh), 1, 20000);
      Object.assign(ghost.style, { display: 'block', left: (h.includes('w') ? S.w - drag.nw : 0) * z + 'px', top: (h.includes('n') ? S.h - drag.nh : 0) * z + 'px', width: drag.nw * z + 'px', height: drag.nh * z + 'px' });
      $('#st-size').textContent = `${drag.nw} × ${drag.nh} px`; break;
    }
  }
});
function endDrag() {
  if (!drag) return;
  const d = drag;
  switch (d.type) {
    case 'stroke': if (d.timer) clearInterval(d.timer); drag = null; refreshThumbs(); break;
    case 'selNew': endSelNew(); drag = null; renderOverlays(); updateUI(); break;
    case 'shapeNew': {
      drag = null; const b = shapeBounds(S.shapeP);
      if (b.w < 2 && b.h < 2) cancelShape(); else renderOverlays();
      break;
    }
    case 'textNew': drag = null; ghost.style.display = 'none'; openText(d.rect || { x: d.x0, y: d.y0, w: 0, h: 0 }); break;
    case 'canvasResize': {
      drag = null; ghost.style.display = 'none';
      if (d.nw !== S.w || d.nh !== S.h) resizeCanvas(d.nw, d.nh, d.h.includes('w') ? d.nw - S.w : 0, d.h.includes('n') ? d.nh - S.h : 0);
      updateStatus(); break;
    }
    default: drag = null; renderOverlays();
  }
}
ws.addEventListener('pointerup', endDrag);
ws.addEventListener('pointercancel', endDrag);
ws.addEventListener('lostpointercapture', endDrag);
ws.addEventListener('pointerleave', () => { cursorEl.style.display = 'none'; $('#st-pos').textContent = 'X: –, Y: –'; });
ws.addEventListener('scroll', () => { if (S.textP) renderOverlays(); });
document.addEventListener('contextmenu', (e) => { if (!isTyping(e.target)) e.preventDefault(); });
ws.addEventListener('wheel', (e) => {
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(S.zoom * Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY); }
}, { passive: false });
let gestureZoom = 1;
document.addEventListener('gesturestart', (e) => { e.preventDefault(); gestureZoom = S.zoom; });
document.addEventListener('gesturechange', (e) => { e.preventDefault(); setZoom(gestureZoom * e.scale, e.clientX, e.clientY); });
textarea.addEventListener('input', growText);

// ============================================================ document ops
/** Size for a new image: fills the visible workspace (like Paint on a big screen) unless a fixed size is set. */
function defaultSize() {
  if (!settings.autoSize) return [settings.w, settings.h];
  const aw = ws.clientWidth, ah = ws.clientHeight;
  if (aw < 300 || ah < 200) return [1280, 720];
  const w = Math.floor((aw - 140) / 10) * 10, h = Math.floor((ah - 130) / 10) * 10;
  return [clamp(w, 400, 3840), clamp(h, 300, 2160)];
}
function newDoc(w, h, keepBlank) {
  discardPending();
  S.w = w; S.h = h; layerCount = 0;
  S.layers = [blankLayer('Background', keepBlank || settings.transparent ? null : '#ffffff')];
  S.active = 0; S.undo = []; S.redo = []; S.fileName = 'Untitled'; S.filePath = null;
  afterDocChange(); setDirty(false);
  S.zoom = 1; applyZoom();
  requestAnimationFrame(() => { if (ws.clientWidth > 200 && (S.w > ws.clientWidth - 120 || S.h > ws.clientHeight - 120)) fitZoom(); });
}
function resizeCanvas(nw, nh, ox, oy) {
  pushHistory();
  S.layers.forEach((l, i) => {
    const c = makeCanvas(nw, nh), x = c.getContext('2d');
    if (i === 0 && !settings.transparent) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, nw, nh); }
    x.drawImage(l.canvas, ox, oy); setLayerCanvas(l, c);
  });
  S.w = nw; S.h = nh; afterDocChange();
}
function loadImageURL(url, name, path) {
  const img = new Image();
  img.onload = () => {
    newDoc(img.naturalWidth, img.naturalHeight, true);
    AL().ctx.drawImage(img, 0, 0); refreshThumbs();
    S.fileName = name || 'Untitled'; S.filePath = path || null; setDirty(false); lastTitle = ''; updateTitle();
  };
  img.onerror = () => toast('Could not open this image');
  img.src = url;
}
function pasteImageURL(url) {
  const img = new Image();
  img.onload = () => { const c = makeCanvas(img.naturalWidth, img.naturalHeight); c.getContext('2d').drawImage(img, 0, 0); pasteCanvas(c); };
  img.src = url;
}
function pasteCanvas(c) {
  if (!c) { toast('Nothing to paste'); return; }
  commitAll(); setTool('select');
  pushHistory();
  if (c.width > S.w || c.height > S.h) {
    const nw = Math.max(S.w, c.width), nh = Math.max(S.h, c.height);
    S.layers.forEach((l, i) => { const n = makeCanvas(nw, nh), x = n.getContext('2d'); if (i === 0 && !settings.transparent) { x.fillStyle = '#fff'; x.fillRect(0, 0, nw, nh); } x.drawImage(l.canvas, 0, 0); setLayerCanvas(l, n); });
    S.w = nw; S.h = nh; afterDocChange();
  }
  const sr = stage.getBoundingClientRect(), wr = ws.getBoundingClientRect();
  let x = Math.max(0, Math.floor((wr.left - sr.left) / S.zoom) + 4), y = Math.max(0, Math.floor((wr.top - sr.top) / S.zoom) + 4);
  if (x + c.width > S.w) x = Math.max(0, S.w - c.width); if (y + c.height > S.h) y = Math.max(0, S.h - c.height);
  S.sel = { x, y, w: c.width, h: c.height, path: null, orig: c };
  deriveFloat(); renderOverlays(); updateUI();
}
function copy() {
  commitText(); commitShape();
  const c = selectionCanvas() || flatten(); S.clip = c;
  native('copy', { data: c.toDataURL('image/png') });
  toast(S.sel ? 'Selection copied' : 'Image copied');
}
function cut() { if (!S.sel) { copy(); return; } copy(); deleteSelection(); }
function paste() { if (!native('paste')) pasteCanvas(S.clip); }
function save(as) {
  commitAll();
  const data = flatten().toDataURL('image/png');
  if (native('save', { data, path: as ? '' : S.filePath || '', name: S.fileName })) return;
  const a = document.createElement('a'); a.download = S.fileName.replace(/\.[^.]+$/, '') + '.png'; a.href = data;
  document.body.appendChild(a); a.click(); a.remove(); onSaved('', a.download);
}
function onSaved(path, name) {
  S.filePath = path || null; S.fileName = name || S.fileName; setDirty(false);
  const f = afterSave; afterSave = null; if (f) f();
}
function print() {
  commitAll(); const data = flatten().toDataURL('image/png');
  if (native('print', { data })) return;
  const w = window.open(''); if (!w) return;
  w.document.write(`<img src="${data}" style="max-width:100%" onload="window.print()">`);
}
function openFile() {
  confirmDiscard(() => { if (!native('open')) $('#file-input').click(); });
}
$('#file-input').addEventListener('change', (e) => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => loadImageURL(r.result, f.name, null); r.readAsDataURL(f); e.target.value = '';
});
async function confirmDiscard(next) {
  commitAll();
  if (!S.dirty) { next(); return; }
  const v = await modal(`<h3>Paint</h3><p>Do you want to save changes to ${esc(S.fileName)}?</p>`,
    [{ label: 'Cancel', value: 'cancel' }, { label: "Don't Save", value: 'discard' }, { label: 'Save', value: 'save', primary: true }]);
  if (v === 'discard') next(); else if (v === 'save') { afterSave = next; save(false); }
}
function clearCmd() {
  if (S.sel) { deleteSelection(); return; }
  commitAll(); pushHistory();
  const l = AL(); l.ctx.clearRect(0, 0, S.w, S.h);
  if (S.active === 0 && !settings.transparent) { l.ctx.fillStyle = '#ffffff'; l.ctx.fillRect(0, 0, S.w, S.h); }
  refreshThumbs();
}

// image transforms
function selOp(fn) { commitText(); commitShape(); lift(); fn(S.sel); deriveFloat(); renderOverlays(); }
function rotate(deg) {
  if (S.sel) {
    selOp((s) => {
      s.orig = rotCanvas(scaledOrig(), deg);
      if (deg !== 180) { const cx = s.x + s.w / 2, cy = s.y + s.h / 2; [s.w, s.h] = [s.h, s.w]; s.x = Math.round(cx - s.w / 2); s.y = Math.round(cy - s.h / 2); }
    });
    return;
  }
  commitAll(); pushHistory();
  S.layers.forEach((l) => setLayerCanvas(l, rotCanvas(l.canvas, deg)));
  if (deg !== 180) [S.w, S.h] = [S.h, S.w];
  afterDocChange();
}
function flip(dir) {
  if (S.sel) { selOp((s) => { s.orig = flipCanvas(scaledOrig(), dir); }); return; }
  commitAll(); pushHistory(); S.layers.forEach((l) => setLayerCanvas(l, flipCanvas(l.canvas, dir))); afterDocChange();
}
function invert() {
  if (S.sel) { selOp((s) => pixelOp(s.orig, invertData)); return; }
  commitAll(); pushHistory(); pixelOp(AL().canvas, invertData); refreshThumbs();
}
function filterSel(fn) { if (!S.sel) { toast('Select an area first'); return; } selOp((s) => pixelOp(scaledOrig(), fn)); }
function crop() {
  if (!S.sel) { toast('Select an area to crop first'); return; }
  commitText(); commitShape();
  const s = S.sel, r = { x: s.x, y: s.y, w: s.w, h: s.h };
  stampFloat(); S.sel = null;
  pushHistory();
  S.layers.forEach((l) => { const c = makeCanvas(r.w, r.h); c.getContext('2d').drawImage(l.canvas, -r.x, -r.y); setLayerCanvas(l, c); });
  S.w = Math.round(r.w); S.h = Math.round(r.h); afterDocChange();
}
async function resizeDialog() {
  commitText(); commitShape();
  const s = S.sel, bw = s ? s.w : S.w, bh = s ? s.h : S.h;
  const html = `<h3>Resize and Skew${s ? ' — selection' : ''}</h3>
  <fieldset><legend>Resize</legend>
    <div class="frow"><label><input type="radio" name="rzby" value="pct" checked> Percentage</label>
    <label><input type="radio" name="rzby" value="px"> Pixels</label></div>
    <div class="frow"><label class="w">Horizontal:</label><input type="number" id="rz-h" value="100" min="1"></div>
    <div class="frow"><label class="w">Vertical:</label><input type="number" id="rz-v" value="100" min="1"></div>
    <div class="frow"><label><input type="checkbox" id="rz-keep" checked> Maintain aspect ratio</label></div>
  </fieldset>
  <fieldset><legend>Skew (degrees)</legend>
    <div class="frow"><label class="w">Horizontal:</label><input type="number" id="sk-h" value="0" min="-89" max="89"></div>
    <div class="frow"><label class="w">Vertical:</label><input type="number" id="sk-v" value="0" min="-89" max="89"></div>
  </fieldset>`;
  const p = modal(html, [{ label: 'Cancel', value: false }, { label: 'OK', value: true, primary: true }]);
  const H = $('#rz-h'), V = $('#rz-v'), keep = $('#rz-keep');
  const byPx = () => $('input[name=rzby]:checked').value === 'px';
  $$('input[name=rzby]').forEach((r) => r.addEventListener('change', () => {
    if (byPx()) { H.value = Math.round((bw * H.value) / 100); V.value = Math.round((bh * V.value) / 100); }
    else { H.value = Math.round((H.value / bw) * 100); V.value = Math.round((V.value / bh) * 100); }
  }));
  H.addEventListener('input', () => { if (keep.checked) V.value = byPx() ? Math.round((H.value * bh) / bw) : H.value; });
  V.addEventListener('input', () => { if (keep.checked) H.value = byPx() ? Math.round((V.value * bw) / bh) : V.value; });
  setTimeout(() => { H.focus(); H.select(); }, 0);
  if (!(await p)) return;
  let nw = +H.value || 0, nh = +V.value || 0;
  if (!byPx()) { nw = (bw * nw) / 100; nh = (bh * nh) / 100; }
  nw = clamp(Math.round(nw), 1, 20000); nh = clamp(Math.round(nh), 1, 20000);
  const sh = clamp(+$('#sk-h').value || 0, -89, 89), sv = clamp(+$('#sk-v').value || 0, -89, 89);
  if (s) {
    selOp((sel) => {
      let c = scaleCanvas(sel.orig, nw, nh);
      if (sh || sv) c = skewCanvas(c, sh, sv, null);
      sel.orig = c; sel.w = c.width; sel.h = c.height;
    });
    return;
  }
  pushHistory();
  S.layers.forEach((l, i) => {
    let c = nw === S.w && nh === S.h ? l.canvas : scaleCanvas(l.canvas, nw, nh);
    if (sh || sv) c = skewCanvas(c, sh, sv, i === 0 && !settings.transparent ? '#ffffff' : null);
    setLayerCanvas(l, c);
  });
  S.w = S.layers[0].canvas.width; S.h = S.layers[0].canvas.height; afterDocChange();
}

// layers
function layerAdd() { commitAll(); pushHistory(); S.layers.splice(S.active + 1, 0, blankLayer('Layer ' + ++layerCount)); S.active++; syncLayers(); updateUI(); }
function layerDup() {
  commitAll(); pushHistory(); const l = AL();
  const n = mkLayer(l.name + ' copy', cloneCanvas(l.canvas)); n.opacity = l.opacity; n.visible = l.visible;
  S.layers.splice(S.active + 1, 0, n); S.active++; syncLayers();
}
function layerDelete() {
  if (S.layers.length < 2) { toast('An image needs at least one layer'); return; }
  commitAll(); pushHistory(); S.layers.splice(S.active, 1); S.active = Math.max(0, S.active - 1); syncLayers();
}
function layerMove(dir) {
  const i = S.active, j = i + dir; if (j < 0 || j >= S.layers.length) return;
  commitAll(); pushHistory(); [S.layers[i], S.layers[j]] = [S.layers[j], S.layers[i]]; S.active = j; syncLayers();
}
function layerMerge() {
  if (S.active === 0) { toast('No layer below to merge into'); return; }
  commitAll(); pushHistory(); const l = AL(), below = S.layers[S.active - 1];
  below.ctx.save(); below.ctx.globalAlpha = l.opacity; if (l.visible) below.ctx.drawImage(l.canvas, 0, 0); below.ctx.restore();
  S.layers.splice(S.active, 1); S.active--; syncLayers();
}
function selectLayer(i) { if (i === S.active) return; commitAll(); S.active = i; renderLayerPanel(); }
function renderLayerPanel() {
  const panel = $('#layerpanel'); if (panel.classList.contains('hidden')) return;
  const list = $('#layerlist'); list.innerHTML = '';
  for (let i = S.layers.length - 1; i >= 0; i--) {
    const l = S.layers[i], row = document.createElement('div');
    row.className = 'lrow' + (i === S.active ? ' sel' : '');
    row.innerHTML = `<button class="eye" title="Show/hide">${icon(l.visible ? 'eye' : 'eyeOff')}</button><canvas width="88" height="66"></canvas><span class="lname"></span>`;
    row.querySelector('.lname').textContent = l.name;
    row.addEventListener('click', (e) => { if (!e.target.closest('.eye')) selectLayer(i); });
    row.querySelector('.eye').addEventListener('click', () => { commitAll(); pushHistory(); l.visible = !l.visible; syncLayers(); });
    row.querySelector('.lname').addEventListener('dblclick', () => {
      const inp = document.createElement('input'); inp.value = l.name; row.querySelector('.lname').replaceWith(inp); inp.focus(); inp.select();
      const done = () => { l.name = inp.value.trim() || l.name; renderLayerPanel(); };
      inp.addEventListener('blur', done); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); e.stopPropagation(); });
    });
    list.appendChild(row);
  }
  $('#layer-opacity').value = Math.round(AL().opacity * 100); $('#layer-opacity-val').textContent = Math.round(AL().opacity * 100) + '%';
  drawThumbs();
}
function drawThumbs() {
  const cs = $$('#layerlist canvas');
  cs.forEach((c, k) => {
    const l = S.layers[S.layers.length - 1 - k]; if (!l) return;
    const x = c.getContext('2d'); x.clearRect(0, 0, 88, 66);
    const sc = Math.min(88 / S.w, 66 / S.h), w = S.w * sc, h = S.h * sc;
    x.drawImage(l.canvas, (88 - w) / 2, (66 - h) / 2, w, h);
  });
}
let thumbRaf = 0;
function refreshThumbs() { if ($('#layerpanel').classList.contains('hidden') || thumbRaf) return; thumbRaf = requestAnimationFrame(() => { thumbRaf = 0; drawThumbs(); }); }
$('#layer-opacity').addEventListener('pointerdown', () => { commitAll(); pushHistory(); });
$('#layer-opacity').addEventListener('input', (e) => { const l = AL(); l.opacity = e.target.value / 100; l.canvas.style.opacity = l.opacity; $('#layer-opacity-val').textContent = e.target.value + '%'; });

// ============================================================ tools / colors UI
function optKey() { return S.tool === 'shape' ? 'shape' : S.tool; }
function setTool(t) {
  if (t !== S.tool) {
    commitText(); commitShape(); if (t !== 'select') commitSel();
    if (t === 'picker') S.prevTool = S.tool;
    S.tool = t;
  }
  updateUI();
}
function setColor(slot, col) {
  S[slot] = col; renderSwatches();
  if (S.shapeP) renderShape();
  if (S.textP) styleTextarea();
  if (S.sel && S.sel.orig && S.transparentSel && slot === 'R') { deriveFloat(); renderOverlays(); }
}
function renderSwatches() {
  for (const k of ['L', 'R']) { const el = $('#swatch-' + k); el.classList.toggle('transparent', S[k] === 'transparent'); el.style.background = S[k] === 'transparent' ? '' : S[k]; }
}
function updateUI() {
  $$('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === S.tool));
  $$('#shapes button').forEach((b) => b.classList.toggle('active', S.tool === 'shape' && b.dataset.shape === S.shape));
  const k = optKey(), o = S.opts[k];
  const sb = $('#sizebox');
  sb.classList.toggle('nosize', !USES_SIZE.has(k)); sb.classList.toggle('nostrength', !USES_STRENGTH.has(k));
  if (o) {
    $('#size').value = Math.min(100, o.size); $('#strength').value = o.strength;
    $('#size-val').textContent = o.size + 'px';
    $('#strength-val').textContent = `${k === 'fill' ? 'Tolerance' : k === 'spray' ? 'Density' : 'Strength'} ${o.strength}%`;
  }
  $('#btn-undo').disabled = !S.undo.length; $('#btn-redo').disabled = !S.redo.length;
  $('#btn-blur').disabled = !S.sel; $('#btn-pixelate').disabled = !S.sel;
  $('#btn-grid').classList.toggle('on', settings.grid);
  $('#fill-icon').innerHTML = icon({ outline: 'fillOutline', fill: 'fillSolid', both: 'fillBoth' }[S.fillMode]);
  updateStatus();
}
function onSlider(which, v) {
  const k = optKey(), o = S.opts[k]; if (!o) return;
  o[which] = +v; updateUI();
  if (S.shapeP) renderShape();
  if (S.textP && which === 'size') styleTextarea();
}
$('#size').addEventListener('input', (e) => onSlider('size', e.target.value));
$('#strength').addEventListener('input', (e) => onSlider('strength', e.target.value));

const PALETTE = [
  '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#b97a57', '#ffaec9', '#ffc90e', '#b5e61d',
  '#ffffff', '#c3c3c3', '#9c5a3c', '#f7977a', '#ffdcb9', '#fff8a8', '#7fcfc4', '#7092be', '#c8bfe7', '#f49ac1', '#c8a24f', '#efe4b0', '#d9f37f', '#99d9ea',
];
function renderPalette() {
  const p = $('#palette'); p.innerHTML = '';
  const colors = PALETTE.slice(0, 28).filter((c) => c);
  const custom = settings.custom.slice(0, 13);
  const all = [...colors, 'transparent', ...custom];
  while (all.length < 42) all.push(null);
  all.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'pal' + (c === 'transparent' ? ' transparent' : '') + (c ? '' : ' empty');
    if (c && c !== 'transparent') b.style.background = c;
    b.title = c === 'transparent' ? 'Transparent (erases)' : c ? c.toUpperCase() + ' — left: L, right: R' : 'Custom color — click to add';
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!c) { openColorPicker(b, e.button === 2 ? 'R' : 'L'); return; }
      setColor(e.button === 2 || e.ctrlKey ? 'R' : 'L', c);
    });
    p.appendChild(b);
  });
}
function addCustom(hex) {
  if (PALETTE.includes(hex)) return;
  settings.custom = [hex, ...settings.custom.filter((c) => c !== hex)].slice(0, 13); saveSettings(); renderPalette();
}

// color picker popover
function openColorPicker(anchor, slot) {
  const pop = $('#colorpop');
  const start = S[slot] === 'transparent' ? '#ffffff' : S[slot];
  let [h, s, v] = rgbToHsv(...hexToRgb(start));
  pop.innerHTML = `<div class="panel-head"><span>Color ${slot}</span><button class="xbtn">✕</button></div>
    <canvas class="sv" width="220" height="150"></canvas><canvas class="hue" width="220" height="14"></canvas>
    <div class="row"><div class="preview"></div><input class="hex" spellcheck="false"><button class="ok">Add</button></div>`;
  pop.classList.remove('hidden');
  const r = anchor.getBoundingClientRect();
  pop.style.left = clamp(r.left - 100, 8, innerWidth - 252) + 'px'; pop.style.top = r.bottom + 8 + 'px';
  const sv = pop.querySelector('.sv'), hue = pop.querySelector('.hue'), hex = pop.querySelector('.hex'), prev = pop.querySelector('.preview');
  const cur = () => rgbToHex(...hsvToRgb(h, s, v));
  const draw = () => {
    const x = sv.getContext('2d');
    x.fillStyle = rgbToHex(...hsvToRgb(h, 1, 1)); x.fillRect(0, 0, 220, 150);
    let g = x.createLinearGradient(0, 0, 220, 0); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 220, 150);
    g = x.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 220, 150);
    x.strokeStyle = v > 0.5 ? '#000' : '#fff'; x.lineWidth = 2; x.beginPath(); x.arc(s * 220, (1 - v) * 150, 6, 0, Math.PI * 2); x.stroke();
    const y = hue.getContext('2d'); const hg = y.createLinearGradient(0, 0, 220, 0);
    for (let i = 0; i <= 6; i++) hg.addColorStop(i / 6, rgbToHex(...hsvToRgb((i * 60) % 360, 1, 1)));
    y.fillStyle = hg; y.fillRect(0, 0, 220, 14); y.fillStyle = '#fff'; y.fillRect((h / 360) * 220 - 1.5, 0, 3, 14);
    prev.style.background = cur(); if (document.activeElement !== hex) hex.value = cur();
  };
  const apply = () => { draw(); setColor(slot, cur()); };
  const dragOn = (el, fn) => el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId); fn(e);
    const mv = (ev) => fn(ev), up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
  });
  dragOn(sv, (e) => { const b = sv.getBoundingClientRect(); s = clamp((e.clientX - b.left) / b.width, 0, 1); v = 1 - clamp((e.clientY - b.top) / b.height, 0, 1); apply(); });
  dragOn(hue, (e) => { const b = hue.getBoundingClientRect(); h = clamp(((e.clientX - b.left) / b.width) * 360, 0, 359.9); apply(); });
  hex.addEventListener('input', () => { const m = hex.value.trim().match(/^#?([0-9a-f]{6})$/i); if (m) { [h, s, v] = rgbToHsv(...hexToRgb('#' + m[1])); apply(); } });
  hex.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') pop.querySelector('.ok').click(); });
  pop.querySelector('.ok').addEventListener('click', () => { addCustom(cur()); setColor(slot, cur()); pop.classList.add('hidden'); });
  pop.querySelector('.xbtn').addEventListener('click', () => pop.classList.add('hidden'));
  draw();
}

// ============================================================ menus / modal / toast
function showMenu(anchor, items) {
  const m = $('#menu'); m.innerHTML = '';
  items.forEach((it) => {
    if (it === '-') { m.insertAdjacentHTML('beforeend', '<div class="sep"></div>'); return; }
    const d = document.createElement('div'); d.className = 'mi' + (it.disabled ? ' disabled' : '');
    d.innerHTML = `<span class="ck">${it.checked ? '✓' : ''}</span>${it.icon ? icon(it.icon) : ''}<span>${esc(it.label)}</span>`;
    d.addEventListener('click', () => { hidePopups(); it.action(); });
    m.appendChild(d);
  });
  m.classList.remove('hidden');
  const r = anchor.getBoundingClientRect(), mh = m.offsetHeight, mw = m.offsetWidth;
  m.style.left = clamp(r.left, 6, innerWidth - mw - 6) + 'px';
  m.style.top = (r.bottom + mh + 6 > innerHeight ? r.top - mh - 4 : r.bottom + 4) + 'px';
}
function hidePopups() { $('#menu').classList.add('hidden'); }
document.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#menu') && !e.target.closest('[data-menu-anchor]')) hidePopups();
  if (!e.target.closest('#colorpop') && !e.target.closest('.swatch') && !e.target.closest('.pal')) $('#colorpop').classList.add('hidden');
  ['layerpanel', 'settingspanel'].forEach((id) => {
    if (id === 'settingspanel' && !e.target.closest('#settingspanel') && !e.target.closest('#btn-settings')) $('#settingspanel').classList.add('hidden');
  });
}, true);
let modalDone = null, modalButtons = [];
function modal(html, buttons) {
  return new Promise((res) => {
    const m = $('#modal'); modalButtons = buttons;
    m.innerHTML = html + `<div class="btns">${buttons.map((b, i) => `<button data-i="${i}" class="${b.primary ? 'primary' : ''}">${esc(b.label)}</button>`).join('')}</div>`;
    $('#modal-wrap').classList.remove('hidden');
    modalDone = (v) => { $('#modal-wrap').classList.add('hidden'); modalDone = null; res(v); };
    $$('.btns button', m).forEach((b) => b.addEventListener('click', () => modalDone && modalDone(buttons[+b.dataset.i].value)));
    const p = m.querySelector('.btns .primary'); if (p) p.focus();
  });
}
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1600); }

// ============================================================ commands
const commands = {
  new: () => confirmDiscard(() => newDoc(...defaultSize())),
  open: openFile, save: () => save(false), saveAs: () => save(true), print, clear: clearCmd,
  undo, redo, copy, cut, paste, selectAll, delete: deleteSelection,
  crop, resize: resizeDialog, invert,
  rotL: () => rotate(-90), rotR: () => rotate(90), rot180: () => rotate(180), flipH: () => flip('h'), flipV: () => flip('v'),
  blur: () => filterSel(blurData), pixelate: () => filterSel(pixelateData),
  grid: () => { settings.grid = !settings.grid; saveSettings(); $('#set-grid').checked = settings.grid; updateGrid(); updateUI(); },
  layers: () => { $('#layerpanel').classList.toggle('hidden'); $('#btn-layers').classList.toggle('on', !$('#layerpanel').classList.contains('hidden')); renderLayerPanel(); },
  zoomIn: () => zoomStep(1), zoomOut: () => zoomStep(-1), zoom100: () => setZoom(1), fit: fitZoom,
  swap: () => { const l = S.L; S.L = S.R; setColor('R', l); setColor('L', S.L); },
  layerAdd, layerDup, layerDelete, layerMerge, layerUp: () => layerMove(1), layerDown: () => layerMove(-1),
  transparentSel: () => { S.transparentSel = !S.transparentSel; if (S.sel && S.sel.orig) { deriveFloat(); renderOverlays(); } },
};
function command(name) {
  if (document.activeElement === textarea && ['undo', 'redo', 'copy', 'cut', 'paste', 'selectAll'].includes(name)) { document.execCommand(name); return; }
  if (!$('#modal-wrap').classList.contains('hidden')) return;
  const f = commands[name]; if (f) f();
}
$$('[data-cmd]').forEach((b) => b.addEventListener('click', () => command(b.dataset.cmd)));
$$('[data-tool]').forEach((b) => b.addEventListener('click', (e) => {
  const t = b.dataset.tool;
  if (t === 'brush' && (S.tool === 'brush' || e.target.closest('.mini'))) { setTool('brush'); brushMenu(b); return; }
  setTool(t);
}));
function brushMenu(anchor) {
  showMenu(anchor, BRUSHES.map(([id, label]) => ({ label, checked: S.brushType === id, action: () => { S.brushType = id; setTool('brush'); } })));
}
$('#btn-swap').addEventListener('click', () => command('swap'));
$('#swatch-L').addEventListener('click', (e) => openColorPicker(e.currentTarget, 'L'));
$('#swatch-R').addEventListener('click', (e) => openColorPicker(e.currentTarget, 'R'));
$('#select-menu').dataset.menuAnchor = '1';
$('#select-menu').addEventListener('click', (e) => {
  showMenu(e.currentTarget, [
    { label: 'Rectangular selection', icon: 'rectSel', checked: S.selectMode === 'rect', action: () => { S.selectMode = 'rect'; setTool('select'); } },
    { label: 'Free-form selection', icon: 'freeSel', checked: S.selectMode === 'free', action: () => { S.selectMode = 'free'; setTool('select'); } },
    '-',
    { label: 'Select all   ⌘A', action: selectAll },
    { label: 'Delete selection', disabled: !S.sel, action: deleteSelection },
    { label: 'Crop to selection', disabled: !S.sel, action: crop },
    '-',
    { label: 'Transparent selection', checked: S.transparentSel, action: commands.transparentSel },
  ]);
});
$('#btn-fill').dataset.menuAnchor = '1';
$('#btn-fill').addEventListener('click', (e) => {
  const set = (m) => () => { S.fillMode = m; updateUI(); if (S.shapeP) renderShape(); };
  showMenu(e.currentTarget, [
    { label: 'Outline only (color L)', icon: 'fillOutline', checked: S.fillMode === 'outline', action: set('outline') },
    { label: 'Fill only (color L)', icon: 'fillSolid', checked: S.fillMode === 'fill', action: set('fill') },
    { label: 'Outline L + fill R', icon: 'fillBoth', checked: S.fillMode === 'both', action: set('both') },
  ]);
});
function buildShapes() {
  const box = $('#shapes');
  SHAPE_LIST.forEach(([id, label]) => {
    const b = document.createElement('button'); b.dataset.shape = id; b.title = label;
    const d = id === 'line' ? 'M5 19L19 5' : shapeD(id, 4, 4.5, 16, 15);
    b.innerHTML = `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="${d}"/></svg>`;
    b.addEventListener('click', () => {
      S.shape = id;
      if (S.shapeP && S.tool === 'shape' && (id === 'line') === (S.shapeP.type === 'line')) { S.shapeP.type = id; renderShape(); renderOverlays(); }
      setTool('shape'); updateUI();
    });
    box.appendChild(b);
  });
  const thumb = $('#fakethumb');
  const upd = () => { const r = box.clientHeight / box.scrollHeight; thumb.style.height = r * 58 + 'px'; thumb.style.top = (box.scrollTop / box.scrollHeight) * 58 + 'px'; };
  box.addEventListener('scroll', upd); upd();
}
// zoom controls
$('#zoom-slider').addEventListener('input', (e) => setZoom(sliderToZ(+e.target.value)));
$('#zoom-input').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); });
$('#zoom-input').addEventListener('change', (e) => { const v = parseFloat(e.target.value); if (v > 0) setZoom(v / 100); else applyZoom(); });
$('#zoom-menu').dataset.menuAnchor = '1';
$('#zoom-menu').addEventListener('click', (e) => {
  showMenu(e.currentTarget, [...ZOOMS.map((z) => ({ label: z * 100 + '%', checked: Math.abs(S.zoom - z) < 1e-6, action: () => setZoom(z) })), '-', { label: 'Fit to window', action: fitZoom }]);
});
// text toolbar
$('#font-family').addEventListener('change', (e) => { S.font.family = e.target.value; styleTextarea(); textarea.focus(); });
$('#font-size').addEventListener('input', (e) => { const v = clamp(+e.target.value || 1, 4, 400); S.opts.text.size = v; updateUI(); styleTextarea(); });
for (const [id, k] of [['tt-bold', 'bold'], ['tt-italic', 'italic'], ['tt-underline', 'underline'], ['tt-opaque', 'opaque']]) {
  $('#' + id).addEventListener('pointerdown', (e) => e.preventDefault());
  $('#' + id).addEventListener('click', () => { S.font[k] = !S.font[k]; styleTextarea(); textarea.focus(); });
}
// settings
$('#btn-settings').addEventListener('click', () => $('#settingspanel').classList.toggle('hidden'));
$('#btn-layers').addEventListener('click', () => command('layers'));
$$('[data-close]').forEach((b) => b.addEventListener('click', () => { $('#' + b.dataset.close).classList.add('hidden'); $('#btn-layers').classList.toggle('on', !$('#layerpanel').classList.contains('hidden')); }));
$('#set-aa').checked = settings.aa; $('#set-grid').checked = settings.grid; $('#set-transparent').checked = settings.transparent;
$('#set-w').value = settings.w; $('#set-h').value = settings.h; $('#set-auto').checked = settings.autoSize;
const syncSizeInputs = () => { $('#set-w').disabled = $('#set-h').disabled = settings.autoSize; };
syncSizeInputs();
$('#set-auto').addEventListener('change', (e) => { settings.autoSize = e.target.checked; saveSettings(); syncSizeInputs(); });
$('#set-aa').addEventListener('change', (e) => { settings.aa = e.target.checked; saveSettings(); if (S.shapeP) renderShape(); });
$('#set-grid').addEventListener('change', (e) => { settings.grid = e.target.checked; saveSettings(); updateGrid(); updateUI(); });
$('#set-transparent').addEventListener('change', (e) => { settings.transparent = e.target.checked; saveSettings(); });
$('#set-w').addEventListener('change', (e) => { settings.w = clamp(+e.target.value || 1280, 1, 10000); saveSettings(); });
$('#set-h').addEventListener('change', (e) => { settings.h = clamp(+e.target.value || 720, 1, 10000); saveSettings(); });

// ============================================================ keyboard
document.addEventListener('keydown', (e) => {
  if (!$('#modal-wrap').classList.contains('hidden')) {
    if (e.key === 'Escape' && modalDone) { e.preventDefault(); modalDone(modalButtons[0].value); }
    else if (e.key === 'Enter' && modalDone) { e.preventDefault(); const p = modalButtons.find((b) => b.primary); modalDone(p ? p.value : true); }
    return;
  }
  if (isTyping(e.target)) {
    if (e.key === 'Escape' && e.target === textarea) { e.preventDefault(); commitText(); }
    return;
  }
  const k = e.key.toLowerCase(), mod = e.metaKey || e.ctrlKey;
  if (mod) {
    const map = {
      n: 'new', o: 'open', s: e.shiftKey ? 'saveAs' : 'save', p: 'print', z: e.shiftKey ? 'redo' : 'undo', y: 'redo',
      c: 'copy', x: e.shiftKey ? 'crop' : 'cut', v: 'paste', a: 'selectAll', e: 'resize', g: 'grid', l: 'layers',
      i: e.shiftKey ? 'invert' : null, '=': 'zoomIn', '+': 'zoomIn', '-': 'zoomOut', '0': 'zoom100', '9': 'fit',
    };
    const cmd = map[k];
    if (cmd) { if (cmd === 'paste' && !bridge) return; e.preventDefault(); command(cmd); }
    return;
  }
  if (k === 'delete' || k === 'backspace') { e.preventDefault(); if (S.sel) deleteSelection(); else if (S.shapeP) cancelShape(); return; }
  if (k === 'escape') { commitAll(); hidePopups(); return; }
  if (k.startsWith('arrow')) {
    const st = e.shiftKey ? 10 : 1, dx = k === 'arrowleft' ? -st : k === 'arrowright' ? st : 0, dy = k === 'arrowup' ? -st : k === 'arrowdown' ? st : 0;
    if (S.sel) { e.preventDefault(); lift(); S.sel.x += dx; S.sel.y += dy; renderOverlays(); }
    else if (S.shapeP) { e.preventDefault(); const p = S.shapeP; p.x1 += dx; p.x2 += dx; p.y1 += dy; p.y2 += dy; renderShape(); renderOverlays(); }
    return;
  }
  const tools = { p: 'pencil', b: 'brush', e: 'eraser', g: 'fill', i: 'picker', t: 'text', a: 'spray', s: 'select' };
  if (tools[k]) { setTool(tools[k]); return; }
  const shapes = { l: 'line', r: 'rect', o: 'ellipse' };
  if (shapes[k]) { S.shape = shapes[k]; setTool('shape'); updateUI(); return; }
  if (k === 'x') { command('swap'); return; }
  if (k === '[' || k === ']') { const o = S.opts[optKey()]; if (o && USES_SIZE.has(optKey())) onSlider('size', clamp(o.size + (k === ']' ? Math.max(1, Math.round(o.size * 0.15)) : -Math.max(1, Math.round(o.size * 0.15))), 1, 100)); }
});
document.addEventListener('copy', (e) => { if (isTyping(e.target) || document.activeElement === textarea) return; e.preventDefault(); command('copy'); });
document.addEventListener('cut', (e) => { if (isTyping(e.target) || document.activeElement === textarea) return; e.preventDefault(); command('cut'); });
document.addEventListener('paste', (e) => {
  if (isTyping(e.target) || document.activeElement === textarea) return;
  e.preventDefault();
  if (bridge) { command('paste'); return; }
  const item = [...(e.clipboardData ? e.clipboardData.items : [])].find((i) => i.type.startsWith('image/'));
  if (item) { const r = new FileReader(); r.onload = () => pasteImageURL(r.result); r.readAsDataURL(item.getAsFile()); } else pasteCanvas(S.clip);
});
// drag & drop images
document.addEventListener('dragover', (e) => { e.preventDefault(); });
document.addEventListener('drop', (e) => {
  e.preventDefault();
  const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('image/')); if (!f) return;
  const r = new FileReader();
  r.onload = () => { if (S.dirty) pasteImageURL(r.result); else loadImageURL(r.result, f.name, null); };
  r.readAsDataURL(f);
});

// ============================================================ native API
window.paint = {
  command,
  loadImage: (url, name, path) => loadImageURL(url, name, path),
  openFile: (url, name, path) => confirmDiscard(() => loadImageURL(url, name, path)),
  onSaved, onSaveCancelled: () => { afterSave = null; },
  pasteImage: (url) => pasteImageURL(url),
  pasteInternal: () => pasteCanvas(S.clip),
  requestClose: () => confirmDiscard(() => native('forceClose')),
  isDirty: () => S.dirty,
};

// ============================================================ init
paintIcons(); buildShapes(); renderPalette(); renderSwatches();
newDoc(...defaultSize());
updateUI();
ws.tabIndex = -1;
native('ready');
})();
