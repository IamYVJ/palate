// Entry point: hash router, rendering, and event delegation.
// Views return HTML strings; interactive elements declare what they do with data-* attributes:
//   data-action="name"  → click handler     data-form="name"   → submit handler (receives FormData)
//   data-input="name"   → input handler     data-change="name" → change handler

import { ui, subscribe } from './store.js';
import { closeModal, runToastUndo } from './ui.js';
import { currentSlot } from './logic.js';
import * as modals from './modals.js';
import { openCapture } from './modals.js';
import * as today from './views/today.js';
import * as cook from './views/cook.js';
import * as dish from './views/dish.js';
import * as kitchen from './views/kitchen.js';
import * as out from './views/out.js';
import * as restaurant from './views/restaurant.js';
import * as memory from './views/memory.js';
import * as settings from './views/settings.js';

const views = { today, cook, dish, kitchen, out, restaurant, memory, settings };
const TITLES = { today: 'Today', cook: 'Home cooking', dish: 'Dish', kitchen: 'Kitchen', out: 'Eating out', restaurant: 'Place', memory: 'Food memory', settings: 'Settings' };
const TAB_FOR = { dish: 'cook', restaurant: 'out' };

const modules = [modals, ...Object.values(views)];
const collect = (key) => Object.assign({}, ...modules.map((m) => m[key] || {}));
const actions = { ...collect('actions'), closeModal, toastUndo: runToastUndo };
const forms = collect('forms');
const inputs = collect('inputs');
const changes = collect('changes');

function route() {
  const [name, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  return views[name] ? { name, param: decodeURIComponent(rest.join('/')) } : { name: 'today', param: '' };
}

function render() {
  const { name, param } = route();
  const main = document.getElementById('view');
  // Keep focus (and caret) in a text field that survives the re-render.
  const a = document.activeElement;
  const keep = a?.id && main.contains(a) ? { id: a.id, start: a.selectionStart, end: a.selectionEnd } : null;

  main.innerHTML = views[name].render(param).s;

  const tab = TAB_FOR[name] || name;
  document.querySelectorAll('.tabbar a').forEach((el) => {
    const on = el.dataset.tab === tab;
    el.classList.toggle('active', on);
    if (on) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
  document.title = name === 'today' ? 'Palate' : `${TITLES[name]} · Palate`;

  if (keep) {
    const el = document.getElementById(keep.id);
    if (el) {
      el.focus({ preventScroll: true });
      try { el.setSelectionRange(keep.start, keep.end); } catch { /* not a text field */ }
    }
  }
}

// ---------- events ----------

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  e.preventDefault();
  actions[el.dataset.action](el.dataset, el, e);
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form || !forms[form.dataset.form]) return;
  e.preventDefault();
  forms[form.dataset.form](new FormData(form), form, e);
});

document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (el) inputs[el.dataset.input]?.(el.value, el);
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el) changes[el.dataset.change]?.(el, e);
});

const dialog = document.getElementById('modal');
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) closeModal(); // backdrop
});

window.addEventListener('hashchange', () => {
  closeModal();
  render();
  window.scrollTo(0, 0);
});

// ---------- start ----------

ui.slot = currentSlot();
subscribe(render);
render();

// Shared into Palate (bookmarklet, share sheet, or a link like ?url=…): open the save dialog.
const params = new URLSearchParams(location.search);
if (params.has('url') || params.has('text')) {
  history.replaceState(null, '', location.pathname + location.hash);
  openCapture({ url: params.get('url') || '', text: params.get('text') || '', title: params.get('title') || '' });
}
