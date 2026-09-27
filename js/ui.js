// Small rendering, date and feedback helpers shared by every view.

export class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

function out(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(out).join('');
  return esc(v);
}

/** Tagged template: interpolated values are HTML-escaped unless they came from html`` or raw(). */
export function html(strings, ...vals) {
  let s = strings[0];
  for (let i = 0; i < vals.length; i++) s += out(vals[i]) + strings[i + 1];
  return new Raw(s);
}

// ---------- labels ----------

export const STATUS = { can_make: 'Can make', learning: 'To learn', want_to_try: 'Want to try' };
export const SLOTS = ['breakfast', 'lunch', 'dinner'];
export const KINDS = { fresh: 'Fresh', staple: 'Staples', special: 'Special' };
export const VERDICT = { reorder: 'Reorder', skip: 'Skip' };
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

/** Only let http(s) links through to href attributes (data can come from imported backups). */
export const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '#');

export const ratingBadge = (r, size = '') =>
  r == null ? '' : html`<span class="rating ${size} ${r >= 8 ? 'hi' : r >= 6 ? 'mid' : ''}" title="${r}/10">${r}</span>`;

/** The Indian food mark: green dot for veg, amber for egg, brown triangle for non-veg. */
export const dietMark = (diet) => {
  const label = { veg: 'Vegetarian', egg: 'Contains egg', nonveg: 'Non-vegetarian' }[diet];
  return label ? html`<span class="diet ${diet}" role="img" aria-label="${label}" title="${label}"></span>` : '';
};

export const verdictChip = (v) =>
  v === 'reorder' ? html`<span class="chip good">Reorder</span>` : v === 'skip' ? html`<span class="chip bad">Skip</span>` : '';

// ---------- dates (stored as local YYYY-MM-DD strings) ----------

export function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return isoDate(d);
}

/** Whole days from `iso` to today; Infinity when there is no date. */
export function daysSince(iso) {
  if (!iso) return Infinity;
  const [y, m, d] = iso.split('-').map(Number);
  const n = new Date();
  return Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(y, m - 1, d)) / 86400000);
}

export function ago(iso) {
  const d = daysSince(iso);
  if (d === Infinity) return 'never';
  if (d < 0) return d === -1 ? 'tomorrow' : `in ${-d} days`;
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  if (d < 365) return `${Math.round(d / 30)} months ago`;
  const y = Math.round(d / 36.5) / 10;
  return `${y} year${y === 1 ? '' : 's'} ago`;
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const opts = { day: 'numeric', month: 'short' };
  if (y !== new Date().getFullYear()) opts.year = 'numeric';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

export function dayLabel(iso) {
  const d = daysSince(iso);
  return d === 0 ? 'today' : d === -1 ? 'tomorrow' : d === 1 ? 'yesterday' : fmtDate(iso);
}

// ---------- modal & toast ----------

const $ = (id) => document.getElementById(id);

export function openModal(content) {
  const d = $('modal');
  d.innerHTML = out(content);
  // On phones, don't throw the keyboard up over a sheet the moment it opens.
  if (matchMedia('(pointer: coarse)').matches) d.querySelectorAll('[autofocus]').forEach((el) => el.removeAttribute('autofocus'));
  d.style.transform = '';
  if (!d.open) d.showModal();
  d.scrollTop = 0;
  d.querySelector('[autofocus]')?.focus();
}

export function closeModal() {
  const d = $('modal');
  if (d.open) d.close();
  d.style.transform = '';
}

let toastTimer;
let toastUndo = null;

/** Brief confirmation at the bottom of the screen, optionally with an Undo button. */
export function toast(msg, undo) {
  const el = $('toast');
  toastUndo = undo || null;
  el.innerHTML = out(html`<span>${msg}</span>${undo ? html`<button type="button" data-action="toastUndo">Undo</button>` : ''}`);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), undo ? 5000 : 2500);
}

export function runToastUndo() {
  const fn = toastUndo;
  toastUndo = null;
  $('toast').classList.remove('show');
  fn?.();
}
