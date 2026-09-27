// Memory: search everything you've eaten and saved, plus patterns over time.

import { state, ui, refresh } from '../store.js';
import { html, ago, cap, STATUS, ratingBadge, verdictChip } from '../ui.js';
import { search, insights } from '../logic.js';

export function render() {
  return html`
  <div class="page-head"><h1>Food memory</h1></div>
  <input id="memory-q" class="big-search" type="search" value="${ui.memoryQ}" data-input="memoryQ" autocomplete="off" enterkeyhint="search"
    placeholder="That pizza I loved? Places around GK?" aria-label="Search your food memory">
  ${examples()}
  <div id="memory-results">${ui.memoryQ.trim() ? results() : overview()}</div>`;
}

/** A few one-tap searches drawn from the user's own data. */
function examples() {
  const pick = (values, n) => [...new Set(values.filter(Boolean))].slice(0, n);
  const terms = [
    ...pick(state.restaurants.map((r) => r.area), 2),
    ...pick([...state.dishes.map((d) => d.cuisine), ...state.restaurants.map((r) => r.cuisine)], 2),
    ...pick(state.restaurants.map((r) => r.recommendedBy), 2),
  ];
  if (!terms.length) return '';
  return html`<div class="chips scroll">${terms.map((t) => html`
    <button type="button" class="chip ${ui.memoryQ === t ? 'on' : ''}" data-action="memoryTry" data-q="${t}">${t}</button>`)}</div>`;
}

function results() {
  const r = search(ui.memoryQ);
  if (!r) return html`<div class="empty" style="margin-top:14px">Try a dish, ingredient, cuisine, area or friend’s name.</div>`;
  const none = !r.dishes.length && !r.rdishes.length && !r.places.length;
  if (none) return html`<div class="empty" style="margin-top:14px">Nothing matches “${r.terms.join(' ')}”.</div>`;
  const eatingOut = r.rdishes.length ? html`<h2 class="section-title">Eating out</h2><div class="list">${r.rdishes.map(({ r: place, d }) => html`
    <a class="row" href="#/restaurant/${place.id}">
      <div class="row-main">
        <div class="row-title">${d.name} ${verdictChip(d.verdict)}${d.tried ? '' : html` <span class="chip accent">to try</span>`}</div>
        <div class="row-sub clip">${[place.name, place.area].filter(Boolean).join(' · ')}${d.notes ? ` — ${d.notes}` : ''}</div>
      </div>
      ${ratingBadge(d.rating, 'sm')}
    </a>`)}</div>` : '';
  const places = r.places.length ? html`<h2 class="section-title">Places</h2><div class="list">${r.places.map(({ r: place }) => html`
    <a class="row" href="#/restaurant/${place.id}">
      <div class="row-main">
        <div class="row-title">${place.name}${place.status === 'want' ? html` <span class="chip accent">want to go</span>` : ''}</div>
        <div class="row-sub clip">${[place.area, place.cuisine, place.recommendedBy ? `via ${place.recommendedBy}` : ''].filter(Boolean).join(' · ')}</div>
      </div>
    </a>`)}</div>` : '';
  const home = r.dishes.length ? html`<h2 class="section-title">Home cooking</h2><div class="list">${r.dishes.map(({ d }) => html`
    <a class="row" href="#/dish/${d.id}">
      <div class="row-main">
        <div class="row-title">${d.name}</div>
        <div class="row-sub clip">${[STATUS[d.status], d.cuisine].filter(Boolean).join(' · ')}</div>
      </div>
      ${ratingBadge(d.rating, 'sm')}
    </a>`)}</div>` : '';
  return r.placesFirst ? html`${places}${eatingOut}${home}` : html`${eatingOut}${places}${home}`;
}

function overview() {
  const x = insights();
  const total = x.split.home + x.split.out + x.split.order;
  const segments = [
    ['home', 'Home', 'var(--cat-home)'],
    ['out', 'Ate out', 'var(--cat-out)'],
    ['order', 'Ordered in', 'var(--cat-order)'],
  ];
  const maxCuisine = x.cuisines[0]?.[1] || 1;

  return html`<div class="insights">
    <section class="card wide">
      <h2 class="card-title">Last 30 days</h2>
      ${total ? html`
        <div class="big-num">${Math.round((x.split.home / total) * 100)}% <span class="muted" style="font-size:15px;font-family:var(--sans);font-weight:500">of logged meals at home</span></div>
        <div class="split-bar" role="img" aria-label="${segments.map(([k, label]) => `${label}: ${x.split[k]}`).join(', ')}">
          ${segments.filter(([k]) => x.split[k]).map(([k, label, color]) => html`
            <span style="flex:${x.split[k]};background:${color}" title="${label}: ${x.split[k]} meals"></span>`)}
        </div>
        <div class="legend">${segments.map(([k, label, color]) => html`<span><i style="background:${color}"></i>${label} · ${x.split[k]}</span>`)}</div>`
      : html`<p class="hint">Log meals with “Had it” and restaurant visits to see how you eat.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">Home favourites</h2>
      ${x.topHome.length ? html`<ul class="mini-list">${x.topHome.map((d) => html`
        <li><a class="grow" href="#/dish/${d.id}">${d.name}</a>${ratingBadge(d.rating, 'sm')}</li>`)}</ul>`
      : html`<p class="hint">Rate home dishes to see your favourites.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">Best dishes out</h2>
      ${x.topOut.length ? html`<ul class="mini-list">${x.topOut.map(({ r, d }) => html`
        <li><a class="grow" href="#/restaurant/${r.id}">${d.name} <span class="sub">· ${r.name}</span></a>${ratingBadge(d.rating, 'sm')}</li>`)}</ul>`
      : html`<p class="hint">Rate dishes at restaurants to remember what to order.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">Haven’t had in a while</h2>
      ${x.longTime.length ? html`<ul class="mini-list">${x.longTime.map(({ d, last }) => html`
        <li><a class="grow" href="#/dish/${d.id}">${d.name}</a><span class="sub">${ago(last)}</span>
          <button type="button" class="btn xs" data-action="make" data-id="${d.id}">Make</button></li>`)}</ul>`
      : html`<p class="hint">Nothing you’ve been neglecting.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">What you actually eat</h2>
      ${x.cuisines.length ? html`<ul class="bars">${x.cuisines.map(([c, n]) => html`
        <li><span>${c}</span><span class="muted">${n}</span>
          <span class="track"><span class="fill" style="width:${Math.round((n / maxCuisine) * 100)}%" title="${c}: ${n} meals"></span></span></li>`)}</ul>
        <p class="hint">Cuisines of meals logged in the last 90 days.</p>`
      : html`<p class="hint">Set cuisines on dishes and places to see this.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">Your regulars</h2>
      ${x.regulars.length ? html`<ul class="mini-list">${x.regulars.map(({ r, count, last }) => html`
        <li><a class="grow" href="#/restaurant/${r.id}">${r.name}</a><span class="sub">${count}× · ${ago(last)}</span></li>`)}</ul>`
      : html`<p class="hint">Log restaurant meals to see where you keep going back.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">Still to try</h2>
      <ul class="mini-list">
        <li><a class="grow" href="#/cook" data-action="goCook" data-f="want_to_try">Dishes to cook</a><span class="sub">${x.toTry.dishes}</span></li>
        <li><a class="grow" href="#/cook" data-action="goCook" data-f="learning">${cap(state.settings.cookName || 'Your cook')} is learning</a><span class="sub">${x.toTry.learning}</span></li>
        <li><a class="grow" href="#/out" data-action="goOut">Places to go</a><span class="sub">${x.toTry.places}</span></li>
        <li><span class="grow">Dishes to order somewhere</span><span class="sub">${x.toTry.rdishes}</span></li>
      </ul>
    </section>

    <section class="card wide">
      <h2 class="card-title">${x.year} so far</h2>
      <p style="margin:0">${x.newDishes} new dish${x.newDishes === 1 ? '' : 'es'} and ${x.newPlaces} new place${x.newPlaces === 1 ? '' : 's'} discovered.</p>
    </section>
  </div>`;
}

export const actions = {
  memoryTry: ({ q }) => {
    ui.memoryQ = ui.memoryQ === q ? '' : q;
    refresh();
  },
  goCook: ({ f }) => {
    ui.cookFilter = f;
    location.hash = '#/cook';
  },
  goOut: () => {
    ui.outFilter = 'want';
    location.hash = '#/out';
  },
};

export const inputs = {
  memoryQ: (v) => {
    ui.memoryQ = v;
    document.getElementById('memory-results').innerHTML = (v.trim() ? results() : overview()).s;
  },
};
