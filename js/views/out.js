// Out: restaurants you've been to and ones you want to try.

import { state, ui, refresh } from '../store.js';
import { html, ago, ratingBadge } from '../ui.js';
import { mealStats } from '../logic.js';

export function render() {
  const been = state.restaurants.filter((r) => r.status !== 'want');
  const want = state.restaurants.filter((r) => r.status === 'want');
  const pool = ui.outFilter === 'want' ? want : been;
  const areas = [...new Set(pool.map((r) => r.area).filter(Boolean))].sort();
  if (!areas.includes(ui.outArea)) ui.outArea = '';

  return html`
  <div class="page-head"><h1>Eating out</h1>
    <button type="button" class="btn primary sm" data-action="addRestaurant">+ Place</button></div>
  <div class="seg">
    <button type="button" class="${ui.outFilter === 'been' ? 'on' : ''}" data-action="outFilter" data-f="been">Been <span class="count">${been.length}</span></button>
    <button type="button" class="${ui.outFilter === 'want' ? 'on' : ''}" data-action="outFilter" data-f="want">Want to go <span class="count">${want.length}</span></button>
  </div>
  <div class="toolbar">
    <input id="out-q" type="search" placeholder="Search places, dishes, people" value="${ui.outQ}" data-input="outQ" autocomplete="off">
  </div>
  ${areas.length > 1 ? html`<div class="chips scroll">${['', ...areas].map((a) => html`
    <button type="button" class="chip ${ui.outArea === a ? 'on' : ''}" data-action="outArea" data-a="${a}">${a || 'All areas'}</button>`)}</div>` : ''}
  <div id="out-results" style="margin-top:12px">${results(pool)}</div>`;
}

function results(pool) {
  const stats = mealStats().rest;
  const q = ui.outQ.trim().toLowerCase();
  let list = pool.filter((r) => !ui.outArea || r.area === ui.outArea);
  if (q) {
    list = list.filter((r) => [r.name, r.area, r.cuisine, r.recommendedBy, r.notes, ...r.dishes.map((d) => d.name)]
      .join(' ').toLowerCase().includes(q));
  }
  const last = (r) => stats.get(r.id)?.last || '';
  list.sort(ui.outFilter === 'want'
    ? (a, b) => (b.addedOn || '').localeCompare(a.addedOn || '')
    : (a, b) => last(b).localeCompare(last(a)) || a.name.localeCompare(b.name));

  if (!list.length) {
    return html`<div class="empty">${pool.length ? 'No places match.'
      : ui.outFilter === 'want' ? 'Save places friends recommend, or ones you spot on Instagram, so they’re here when you’re deciding.'
      : 'Add restaurants you’ve been to and rate the dishes, so you remember what to order next time.'}</div>`;
  }

  return html`<div class="list">${list.map((r) => {
    const best = r.dishes.filter((d) => d.tried && d.verdict !== 'skip' && d.rating != null).sort((a, b) => b.rating - a.rating)[0];
    const toTry = r.dishes.filter((d) => !d.tried);
    const sub = ui.outFilter === 'want'
      ? [r.area, r.cuisine, r.recommendedBy ? `via ${r.recommendedBy}` : ''].filter(Boolean).join(' · ')
      : [r.area, r.cuisine, last(r) ? ago(last(r)) : ''].filter(Boolean).join(' · ');
    return html`<a class="row" href="#/restaurant/${r.id}">
      <div class="row-main">
        <div class="row-title">${r.name}</div>
        <div class="row-sub clip">${sub}</div>
        ${best ? html`<div class="row-sub clip">★ ${best.name}</div>` : toTry.length ? html`<div class="row-sub clip">To try: ${toTry.map((d) => d.name).join(', ')}</div>` : ''}
      </div>
      ${best ? ratingBadge(best.rating, 'sm') : ''}
    </a>`;
  })}</div>`;
}

const currentPool = () => state.restaurants.filter((r) => (ui.outFilter === 'want' ? r.status === 'want' : r.status !== 'want'));

export const actions = {
  outFilter: ({ f }) => {
    ui.outFilter = f;
    refresh();
  },
  outArea: ({ a }) => {
    ui.outArea = a;
    refresh();
  },
};

export const inputs = {
  outQ: (v) => {
    ui.outQ = v;
    document.getElementById('out-results').innerHTML = results(currentPool()).s;
  },
};
