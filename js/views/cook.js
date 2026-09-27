// Cook: the home-cooking library.

import { state, ui, refresh } from '../store.js';
import { html, ago, STATUS, ratingBadge, dietMark } from '../ui.js';
import { mealStats } from '../logic.js';

const FILTERS = { all: 'All', can_make: 'Can make', learning: 'To learn', want_to_try: 'Want to try', fav: '♥', archived: 'Archived' };
const SORTS = { rating: 'Top rated', stale: 'Longest ago', recent: 'Recently had', az: 'A–Z' };

// Archived dishes only show up under their own filter.
const inFilter = (d, f) => (f === 'archived' ? d.archived
  : !d.archived && (f === 'all' || (f === 'fav' ? d.favorite : d.status === f)));

export function render() {
  if (ui.cookFilter === 'archived' && !state.dishes.some((d) => d.archived)) ui.cookFilter = 'all';
  return html`
  <div class="page-head"><h1>Home cooking</h1>
    <div class="row-actions">
      <a class="btn sm" href="#/ideas">Dish ideas</a>
      <button type="button" class="btn primary sm" data-action="addDish">+ Dish</button>
    </div></div>
  <div class="seg scroll">${Object.entries(FILTERS).filter(([k]) => k !== 'archived' || state.dishes.some((d) => d.archived)).map(([k, label]) => html`
    <button type="button" class="${ui.cookFilter === k ? 'on' : ''}" data-action="cookFilter" data-f="${k}">${label}
      <span class="count">${state.dishes.filter((d) => inFilter(d, k)).length}</span></button>`)}</div>
  <div class="toolbar">
    <input id="cook-q" type="search" placeholder="Search dishes, ingredients, tags" value="${ui.cookQ}" data-input="cookQ" autocomplete="off" enterkeyhint="search">
    <select data-change="cookSort" aria-label="Sort">${Object.entries(SORTS).map(([k, label]) => html`
      <option value="${k}" ${ui.cookSort === k ? 'selected' : ''}>${label}</option>`)}</select>
  </div>
  <div id="cook-results" style="margin-top:12px">${results()}</div>`;
}

function results() {
  const stats = mealStats();
  const last = (d) => stats.dish.get(d.id)?.last || '';
  const q = ui.cookQ.trim().toLowerCase();
  let list = state.dishes.filter((d) => inFilter(d, ui.cookFilter));
  if (q) {
    list = list.filter((d) => [d.name, d.cuisine, d.notes, ...(d.tags || []), ...(d.ingredients || []).map((i) => i.name)]
      .join(' ').toLowerCase().includes(q));
  }
  const byName = (a, b) => a.name.localeCompare(b.name);
  const sorters = {
    rating: (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || byName(a, b),
    stale: (a, b) => (last(a) || '9').localeCompare(last(b) || '9') || byName(a, b),
    recent: (a, b) => last(b).localeCompare(last(a)) || byName(a, b),
    az: byName,
  };
  list.sort(sorters[ui.cookSort]);

  if (!list.length) {
    return state.dishes.length ? html`<div class="empty">No dishes match.</div>`
      : html`<div class="empty">No dishes yet. Start with the ones your cook already makes.
        <div><a class="btn primary sm" href="#/ideas">Pick from popular dishes</a></div></div>`;
  }
  return html`<div class="list">${list.map((d) => {
    const l = last(d);
    const sub = [d.cuisine, l ? `had ${ago(l)}` : 'not logged yet'].filter(Boolean).join(' · ');
    return html`<a class="row" href="#/dish/${d.id}">
      <div class="row-main">
        <div class="row-title">${d.name}${d.diet !== 'veg' ? dietMark(d.diet) : ''}${d.favorite ? html` <span class="fav">♥</span>` : ''}</div>
        <div class="row-sub clip">${sub}</div>
      </div>
      <div class="row-side">
        ${d.status !== 'can_make' ? html`<span class="chip ${d.status === 'learning' ? 'warn' : 'accent'}">${STATUS[d.status]}</span>` : ''}
        ${ratingBadge(d.rating, 'sm')}
      </div>
    </a>`;
  })}</div>`;
}

export const actions = {
  cookFilter: ({ f }) => {
    ui.cookFilter = f;
    refresh();
  },
};

export const inputs = {
  cookQ: (v) => {
    ui.cookQ = v;
    document.getElementById('cook-results').innerHTML = results().s;
  },
};

export const changes = {
  cookSort: (el) => {
    ui.cookSort = el.value;
    refresh();
  },
};
