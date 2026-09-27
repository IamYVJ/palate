// A single home dish.

import { state, update, byId } from '../store.js';
import { html, ago, fmtDate, cap, safeUrl, youtubeId, STATUS, ratingBadge, dietMark, todayISO, toast } from '../ui.js';
import { CREATORS, creatorsFor, creatorSearchUrl } from '../creators.js';
import { DIET } from '../diet.js';
import { availability, mealStats } from '../logic.js';

const MARK = {
  have: ['✓', 'good'],
  out: ['✕', 'bad'],
  unknown: ['?', 'warn'],
};

export function render(id) {
  const d = byId(state.dishes, id);
  if (!d) return html`<a class="back" href="#/cook">‹ Home cooking</a><div class="empty">That dish doesn’t exist any more.</div>`;
  const stat = mealStats().dish.get(d.id);
  const av = availability(d);
  const from = d.from?.restaurantId && byId(state.restaurants, d.from.restaurantId);
  const cook = state.settings.cookName || 'your cook';
  const links = d.links || [];
  const videos = links.filter(youtubeId);
  const pages = links.filter((l) => !youtubeId(l));

  return html`
  <a class="back" href="#/cook">‹ Home cooking</a>
  <header class="detail-head">
    <div>
      <h1>${d.name}${d.favorite ? html` <span class="fav" title="Favourite">♥</span>` : ''}</h1>
      <p class="muted">${[d.cuisine, d.cookTime ? `${d.cookTime} min` : '', d.meals?.map(cap).join(' / ')].filter(Boolean).join(' · ')}</p>
    </div>
    ${ratingBadge(d.rating)}
  </header>
  <div class="chips">
    ${d.archived ? html`<span class="chip">Archived</span>` : ''}
    <span class="chip ${d.status === 'can_make' ? 'good' : d.status === 'learning' ? 'warn' : 'accent'}">${STATUS[d.status]}</span>
    <span class="chip">${dietMark(d.diet)} ${DIET[d.diet]}</span>
    ${(d.tags || []).map((t) => html`<span class="chip">${t}</span>`)}
  </div>
  <div class="facts">
    <span>Last had <strong>${stat ? ago(stat.last) : 'never'}</strong></span>
    <span>Logged <strong>${stat?.count || 0}×</strong></span>
    ${from ? html`<span>From <a href="#/restaurant/${from.id}">${from.name}</a></span>` : ''}
  </div>

  ${d.archived ? html`<div class="notice">Archived: hidden from suggestions and your lists, but its history is kept.
    <div><button type="button" class="btn sm" data-action="archiveDish" data-id="${d.id}" data-on="">Restore</button></div></div>` : ''}
  ${!d.archived && d.status === 'learning' ? html`<div class="notice">${cap(cook)} is learning this one. Share the recipe below, and once it turns out well, add it to the regular rotation.
    <div><button type="button" class="btn sm" data-action="setStatus" data-id="${d.id}" data-status="can_make">Learned it ✓</button></div></div>` : ''}
  ${!d.archived && d.status === 'want_to_try' ? html`<div class="notice">On your want-to-try list.
    <div><button type="button" class="btn sm" data-action="setStatus" data-id="${d.id}" data-status="learning">Ask ${cook} to learn it</button></div></div>` : ''}

  <div class="card-actions">
    <button type="button" class="btn primary" data-action="make" data-id="${d.id}">Make this</button>
    <button type="button" class="btn" data-action="ate" data-id="${d.id}">Had it</button>
    <button type="button" class="btn ghost" data-action="editDish" data-id="${d.id}">Edit</button>
    ${d.archived ? '' : html`<button type="button" class="btn ghost" data-action="archiveDish" data-id="${d.id}" data-on="1">Archive</button>`}
  </div>

  <h2 class="section-title">Recipe</h2>
  ${videos.map((url) => videoCard(url, d.linkInfo?.[url]))}
  ${pages.length || d.instructions ? html`<div class="card" style="margin-top:10px">
    ${pages.length ? html`<ul class="links">${pages.map((l) => html`<li><a href="${safeUrl(l)}" target="_blank" rel="noopener">${prettyUrl(l)}</a></li>`)}</ul>` : ''}
    ${d.instructions ? html`<p class="prose"><strong>For ${cook}:</strong> ${d.instructions}</p>` : ''}
  </div>` : ''}
  <div class="find">
    <span class="find-label">${videos.length ? 'Other videos from' : 'Find a video from'}</span>
    <div class="chips">${creatorsFor(d).map((k) => html`
      <a class="chip" href="${creatorSearchUrl(k, `${d.name} recipe`)}" target="_blank" rel="noopener" title="${CREATORS[k].bestFor}">${CREATORS[k].name}</a>`)}
      <a class="chip" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${d.name} recipe`)}" target="_blank" rel="noopener">All of YouTube</a>
    </div>
    ${links.length ? '' : html`<p class="hint">Found a good one? Paste its link with <strong>Edit</strong> and it goes into the WhatsApp message for ${cook}.</p>`}
  </div>

  <h2 class="section-title">Ingredients ${av.rows.length ? html`<span class="muted">${av.have.length} of ${av.rows.length} at home</span>` : ''}</h2>
  ${av.rows.length ? html`<ul class="list ings">${av.rows.map((r) => html`
    <li class="ing">
      <span class="ing-mark ${MARK[r.avail][1]}">${MARK[r.avail][0]}</span>
      <span class="ing-name">${r.name} ${r.qty ? html`<span class="ing-qty">· ${r.qty}</span>` : ''}</span>
      ${r.avail === 'have'
        ? html`<span class="ing-note">${r.item?.status === 'low' ? 'running low' : ''}</span>`
        : html`<button type="button" class="btn xs" data-action="haveIt" data-name="${r.name}" data-item="${r.item?.id || ''}">Have it</button>`}
    </li>`)}</ul>`
    : html`<div class="empty">No ingredients yet. <div><button type="button" class="btn sm" data-action="editDish" data-id="${d.id}">Add ingredients</button></div></div>`}

  ${d.notes ? html`<h2 class="section-title">Notes</h2><div class="card"><p class="prose">${d.notes}</p></div>` : ''}

  ${stat ? html`<h2 class="section-title">History</h2>
    <div class="chips">${stat.dates.slice().sort().reverse().slice(0, 12).map((x) => html`<span class="chip">${fmtDate(x)}</span>`)}</div>` : ''}`;
}

function videoCard(url, info) {
  const id = youtubeId(url);
  return html`<a class="video" href="${safeUrl(url)}" target="_blank" rel="noopener">
    <span class="video-thumb"><img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy" width="320" height="180"><span class="video-play" aria-hidden="true"></span></span>
    <span class="video-meta"><strong>${info?.title || 'Recipe video'}</strong><span>${info?.channel ? `${info.channel} · ` : ''}YouTube</span></span>
  </a>`;
}

function prettyUrl(u) {
  try {
    const url = new URL(u);
    return url.hostname.replace(/^www\./, '') + (url.pathname.length > 1 ? url.pathname.slice(0, 28) + (url.pathname.length > 28 ? '…' : '') : '');
  } catch {
    return u;
  }
}

export const actions = {
  setStatus: ({ id, status }) => update((s) => { byId(s.dishes, id).status = status; }),
  archiveDish: ({ id, on }) => {
    const archived = !!on;
    update((s) => {
      byId(s.dishes, id).archived = archived;
      // An archived dish shouldn't keep sitting on the menu or the shopping list.
      if (archived) s.plan = s.plan.filter((p) => p.dishId !== id || p.date < todayISO());
    });
    toast(archived ? 'Archived. Find it under Cook → Archived.' : 'Restored');
  },
};
