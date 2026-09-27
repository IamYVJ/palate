// Dish ideas: pick popular vegetarian dishes and add several to your library at once.

import { state, ui, update, refresh, uid } from '../store.js';
import { html, todayISO, toast, STATUS } from '../ui.js';
import { ingKey } from '../logic.js';
import { CATALOG } from '../catalog.js';

const REGIONS = { indian: 'Indian', international: 'International' };

const inLibrary = () => new Set(state.dishes.map((d) => ingKey(d.name)));

export function render() {
  const have = inLibrary();
  const cook = state.settings.cookName || 'your cook';
  return html`
  <a class="back" href="#/cook">‹ Home cooking</a>
  <div class="page-head"><h1>Dish ideas</h1></div>
  <p class="hint" style="margin-top:-6px">Popular vegetarian dishes. Tick the ones ${cook} already makes, or ones you’d like to try, and add them in one go. Ingredients are filled in, so you can edit them later.</p>
  <div class="seg" style="margin-top:12px">${Object.entries(REGIONS).map(([k, label]) => html`
    <button type="button" class="${ui.ideasRegion === k ? 'on' : ''}" data-action="ideasRegion" data-r="${k}">${label}
      <span class="count">${CATALOG.filter((c) => c.region === k && !have.has(ingKey(c.name))).length}</span></button>`)}</div>
  <div class="toolbar">
    <input id="ideas-q" type="search" placeholder="Search dishes or cuisines" value="${ui.ideasQ}" data-input="ideasQ" autocomplete="off" enterkeyhint="search">
  </div>
  <div id="ideas-list" style="margin-top:12px">${list()}</div>
  <div id="ideas-bar" class="pick-bar-wrap">${bar()}</div>`;
}

function list() {
  const have = inLibrary();
  const q = ui.ideasQ.trim().toLowerCase();
  const matches = CATALOG
    .map((c, i) => ({ ...c, i }))
    .filter((c) => c.region === ui.ideasRegion && (!q || `${c.name} ${c.cuisine} ${c.tags.join(' ')}`.toLowerCase().includes(q)));
  // Dishes already in the library are hidden; just say how many.
  const items = matches.filter((c) => !have.has(ingKey(c.name)));
  const already = matches.length - items.length;
  const note = already ? html`<p class="hint" style="text-align:center;margin-top:14px">${already} more already in your list.</p>` : '';
  if (!items.length) {
    return html`<div class="empty">${matches.length ? `You have all of these already.` : 'No ideas match.'}</div>`;
  }

  // Group by cuisine so a long list stays scannable.
  const groups = new Map();
  for (const c of items) groups.set(c.cuisine, [...(groups.get(c.cuisine) || []), c]);
  return html`${[...groups].map(([cuisine, dishes]) => html`
    <h2 class="section-title">${cuisine}</h2>
    <div class="list">${dishes.map((c) => html`<label class="row pick">
        <input type="checkbox" data-change="ideaPick" value="${c.i}" ${ui.ideaPicks.has(c.i) ? 'checked' : ''}>
        <span class="pick-box" aria-hidden="true"></span>
        <span class="row-main">
          <span class="row-title">${c.name}</span>
          <span class="row-sub clip" style="display:block">${[`${c.cookTime} min`, ...c.tags].join(' · ')}</span>
        </span>
      </label>`)}</div>`)}${note}`;
}

function bar() {
  const n = ui.ideaPicks.size;
  if (!n) return '';
  return html`<div class="pick-bar">
    <div class="pick-bar-head"><strong>${n} selected</strong>
      <button type="button" class="btn xs ghost" data-action="ideasClear">Clear</button></div>
    <div class="pick-bar-actions">${Object.entries(STATUS).map(([k, label]) => html`
      <button type="button" class="btn sm ${k === 'can_make' ? 'primary' : ''}" data-action="ideasAdd" data-status="${k}">${label}</button>`)}</div>
  </div>`;
}

const redrawBar = () => { document.getElementById('ideas-bar').innerHTML = bar().s; };

export const actions = {
  ideasRegion: ({ r }) => {
    ui.ideasRegion = r;
    refresh();
  },
  ideasClear: () => {
    ui.ideaPicks.clear();
    refresh();
  },
  ideasAdd: ({ status }) => {
    const have = inLibrary();
    const picks = [...ui.ideaPicks].map((i) => CATALOG[i]).filter((c) => c && !have.has(ingKey(c.name)));
    ui.ideaPicks.clear();
    update((s) => {
      for (const c of picks) {
        const { region, ...fields } = c;
        s.dishes.push({
          id: uid(), status, archived: false, rating: null, favorite: false, links: [], instructions: '', notes: '',
          from: null, addedOn: todayISO(), ...fields, ingredients: fields.ingredients.map((x) => ({ ...x })), tags: [...fields.tags],
        });
      }
    });
    toast(`Added ${picks.length} dish${picks.length === 1 ? '' : 'es'} as “${STATUS[status]}”`);
  },
};

export const changes = {
  ideaPick: (el) => {
    const i = Number(el.value);
    if (el.checked) ui.ideaPicks.add(i);
    else ui.ideaPicks.delete(i);
    redrawBar();
  },
};

export const inputs = {
  ideasQ: (v) => {
    ui.ideasQ = v;
    document.getElementById('ideas-list').innerHTML = list().s;
  },
};
