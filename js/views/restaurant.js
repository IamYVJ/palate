// A single restaurant: dish-level memory, what to reorder, what to skip.

import { state, byId } from '../store.js';
import { html, ago, fmtDate, safeUrl, STATUS, ratingBadge, verdictChip } from '../ui.js';
import { mealStats } from '../logic.js';

const rank = { reorder: 0, '': 1, skip: 2 };

export function render(id) {
  const r = byId(state.restaurants, id);
  if (!r) return html`<a class="back" href="#/out">‹ Eating out</a><div class="empty">That place doesn’t exist any more.</div>`;
  const stat = mealStats().rest.get(r.id);
  const tried = r.dishes.filter((d) => d.tried)
    .sort((a, b) => rank[a.verdict || ''] - rank[b.verdict || ''] || (b.rating ?? -1) - (a.rating ?? -1));
  const toTry = r.dishes.filter((d) => !d.tried);
  const reorder = tried.filter((d) => d.verdict === 'reorder');
  const skip = tried.filter((d) => d.verdict === 'skip');

  return html`
  <a class="back" href="#/out">‹ Eating out</a>
  <header class="detail-head">
    <div>
      <h1>${r.name}</h1>
      <p class="muted">${[r.area, r.cuisine].filter(Boolean).join(' · ')}</p>
    </div>
  </header>
  <div class="facts">
    ${r.status === 'want' ? html`<span class="chip accent">Want to go</span>`
      : html`<span>Been <strong>${stat?.count || 0}×</strong></span>${stat ? html`<span>Last <strong>${ago(stat.last)}</strong></span>` : ''}`}
    ${r.recommendedBy ? html`<span>Recommended by <strong>${r.recommendedBy}</strong></span>` : ''}
  </div>

  ${reorder.length || skip.length ? html`<div class="card summary" style="margin-top:14px">
    ${reorder.length ? html`<div><strong>Order again:</strong> ${reorder.map((d) => d.name).join(', ')}</div>` : ''}
    ${skip.length ? html`<div><strong>Skip:</strong> ${skip.map((d) => d.name).join(', ')}</div>` : ''}
  </div>` : ''}

  <div class="card-actions">
    <button type="button" class="btn primary" data-action="logVisit" data-id="${r.id}">Log a meal</button>
    <button type="button" class="btn" data-action="addRdish" data-id="${r.id}">+ Dish</button>
    ${r.mapUrl ? html`<a class="btn" href="${safeUrl(r.mapUrl)}" target="_blank" rel="noopener">Map</a>` : ''}
    <button type="button" class="btn ghost" data-action="editRestaurant" data-id="${r.id}">Edit</button>
  </div>

  <h2 class="section-title">What you had</h2>
  ${tried.length ? html`<div class="list">${tried.map((d) => dishRow(r, d))}</div>`
    : html`<div class="empty">Nothing rated yet. Add the dishes you had with “+ Dish”.</div>`}

  ${toTry.length ? html`<h2 class="section-title">To try here</h2><div class="list">${toTry.map((d) => dishRow(r, d))}</div>` : ''}

  ${r.notes ? html`<h2 class="section-title">Notes</h2><div class="card"><p class="prose">${r.notes}</p></div>` : ''}

  ${stat ? html`<h2 class="section-title">Visits</h2>
    <div class="chips">${state.meals.filter((m) => m.restaurantId === r.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)
      .map((m) => html`<span class="chip">${fmtDate(m.date)}${m.kind === 'order' ? ' · ordered in' : ''}</span>`)}</div>` : ''}`;
}

function dishRow(r, d) {
  const home = state.dishes.find((x) => x.from?.rdishId === d.id);
  return html`<div class="row">
    <div class="row-main">
      <div class="row-title">${d.name} ${verdictChip(d.verdict)}</div>
      ${d.notes ? html`<div class="row-sub">${d.notes}</div>` : ''}
      ${home ? html`<a class="row-link" href="#/dish/${home.id}">At home: ${STATUS[home.status].toLowerCase()} →</a>` : ''}
      <div class="chips">
        <button type="button" class="btn xs" data-action="editRdish" data-rid="${r.id}" data-did="${d.id}">${d.tried ? 'Edit' : 'Had it? Rate it'}</button>
        ${d.tried && !home && d.verdict !== 'skip' ? html`<button type="button" class="btn xs" data-action="toHome" data-rid="${r.id}" data-did="${d.id}">Make at home</button>` : ''}
      </div>
    </div>
    ${ratingBadge(d.rating)}
  </div>`;
}
