// Today: what's on the menu and what to eat next.

import { state, ui, update, refresh, byId, isEmpty } from '../store.js';
import { html, todayISO, daysSince, dayLabel, cap, SLOTS, ratingBadge } from '../ui.js';
import { recommend, availability, useSoon, nameList } from '../logic.js';
import { logHomeMeal } from '../modals.js';
import { showInstallTip, installMode } from '../pwa.js';

export function render() {
  if (isEmpty()) return welcome();
  const today = todayISO();
  const plans = state.plan
    .filter((p) => byId(state.dishes, p.dishId))
    .sort((a, b) => a.date.localeCompare(b.date) || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));
  const past = plans.filter((p) => p.date < today);
  const upcoming = plans.filter((p) => p.date >= today);
  const recs = recommend(ui.slot);
  const soon = useSoon();
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return html`
  ${showInstallTip() ? installTip() : ''}
  <section class="hero">
    <p class="eyebrow">${date}</p>
    <h1>What’s for ${ui.slot}?</h1>
    <div class="seg">${SLOTS.map((s) => html`
      <button type="button" class="${s === ui.slot ? 'on' : ''}" data-action="setSlot" data-slot="${s}">${cap(s)}</button>`)}</div>
  </section>

  ${past.length ? html`
    <h2 class="section-title">Did you have these?</h2>
    <div class="list">${past.map(pastRow)}</div>` : ''}

  ${upcoming.length ? html`
    <h2 class="section-title">On the menu</h2>
    <div class="list">${upcoming.map(planRow)}</div>` : ''}

  ${soon.length ? html`<div class="notice"><strong>Use soon:</strong> ${soon.map((p, i) => html`${i ? ', ' : ''}${p.name.toLowerCase()} <span class="muted">(${daysSince(p.since)} days)</span>`)}</div>` : ''}

  <h2 class="section-title">Suggestions <span class="muted">what ${state.settings.cookName || 'your cook'} can make</span></h2>
  ${recs.length ? html`<div class="stack">${recs.map(recCard)}</div>` : emptyRecs()}`;
}

function recCard({ dish: d, reasons }) {
  return html`<article class="card">
    <div class="rec-top">
      <div>
        <a class="rec-name" href="#/dish/${d.id}">${d.name}</a>${d.favorite ? html` <span class="fav" title="Favourite">♥</span>` : ''}
        <div class="rec-meta">${[d.cuisine, d.cookTime ? `${d.cookTime} min` : ''].filter(Boolean).join(' · ')}</div>
      </div>
      ${ratingBadge(d.rating)}
    </div>
    <div class="chips">${reasons.map((r) => html`<span class="chip ${r.tone}">${r.text}</span>`)}</div>
    <div class="card-actions">
      <button type="button" class="btn primary sm" data-action="make" data-id="${d.id}">Make this</button>
      <button type="button" class="btn sm" data-action="ate" data-id="${d.id}">Had it</button>
    </div>
  </article>`;
}

function planRow(p) {
  const d = byId(state.dishes, p.dishId);
  const av = availability(d);
  return html`<div class="row">
    <div class="row-main">
      <a class="row-title" href="#/dish/${d.id}">${d.name}</a>
      <div class="row-sub">${cap(p.slot)} · ${dayLabel(p.date)}${p.sent ? ' · sent ✓' : ''}</div>
      ${av.out.length ? html`<div class="chips"><span class="chip bad">need ${nameList(av.out, 3)}</span></div>` : ''}
    </div>
    <div class="row-actions">
      ${p.sent ? '' : html`<button type="button" class="btn sm" data-action="make" data-id="${d.id}" data-plan="${p.id}">Send</button>`}
      <button type="button" class="btn sm" data-action="planDone" data-plan="${p.id}" title="Had it" aria-label="Had it">✓</button>
      <button type="button" class="btn sm ghost" data-action="planRemove" data-plan="${p.id}" title="Take off the menu" aria-label="Take off the menu">✕</button>
    </div>
  </div>`;
}

function pastRow(p) {
  const d = byId(state.dishes, p.dishId);
  return html`<div class="row">
    <div class="row-main">
      <div class="row-title">${d.name}</div>
      <div class="row-sub">Planned for ${p.slot}, ${dayLabel(p.date)}</div>
    </div>
    <div class="row-actions">
      <button type="button" class="btn sm" data-action="planDone" data-plan="${p.id}">Had it</button>
      <button type="button" class="btn sm ghost" data-action="planRemove" data-plan="${p.id}">Didn’t</button>
    </div>
  </div>`;
}

function emptyRecs() {
  const any = state.dishes.some((d) => !d.archived && d.status === 'can_make');
  return html`<div class="empty">
    ${any ? `Nothing tagged for ${ui.slot} yet.` : 'Add the dishes your cook already makes and suggestions will show up here.'}
    <div><button type="button" class="btn primary sm" data-action="addDish">Add a dish</button></div>
  </div>`;
}

function installTip() {
  return html`<div class="install-tip">
    <img src="icons/icon-192.png" alt="" width="40" height="40">
    <div class="row-main"><strong>Put Palate on your home screen</strong><span>Opens full screen like an app, and works offline.</span></div>
    <button type="button" class="btn sm primary" data-action="install">${installMode() === 'ios' ? 'How' : 'Install'}</button>
    <button type="button" class="icon-btn" data-action="dismissInstallTip" aria-label="Not now">✕</button>
  </div>`;
}

function welcome() {
  return html`<section class="welcome">
    <h1>Palate</h1>
    <p class="tagline">Your food memory. Your kitchen. Your taste.</p>
    <p>Palate remembers what you like, what your cook can make, what’s in the kitchen and where you loved eating, then helps you decide what’s next.</p>
    <div class="stack">
      <a class="btn primary block" href="#/ideas">Pick the dishes your cook makes</a>
      <button type="button" class="btn block" data-action="addDish">Add a dish of your own</button>
      <button type="button" class="btn ghost block" data-action="loadSample">Explore with sample data</button>
    </div>
    <p class="hint">Everything is stored privately in this browser. You can export a backup from Settings.</p>
  </section>`;
}

export const actions = {
  setSlot: ({ slot }) => {
    ui.slot = slot;
    refresh();
  },
  planDone: ({ plan }) => {
    const p = byId(state.plan, plan);
    if (p) logHomeMeal(p.dishId, p.date, p.slot, p.id);
  },
  planRemove: ({ plan }) => update((s) => { s.plan = s.plan.filter((p) => p.id !== plan); }),
};
