// Shared dialogs (add/edit forms, "Make this", save-for-later) and the actions that open them.

import { state, ui, update, uid, byId } from './store.js';
import { html, openModal, closeModal, toast, todayISO, STATUS, SLOTS, KINDS, cap } from './ui.js';
import { availability, cookMessage, whatsappUrl, findPantry, ingKey, nameList, slotFor } from './logic.js';
import { DIET, guessDiet } from './diet.js';
import { videoFields } from './catalog.js';
import { recipeFor } from './recipes.js';

// ---------- form helpers ----------

const lines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter(Boolean);
const str = (fd, k) => String(fd.get(k) || '').trim();
const num = (fd, k) => (str(fd, k) === '' ? null : Number(str(fd, k)));
const titleCase = (s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
const cookName = () => state.settings.cookName?.trim() || 'your cook';

/** "Paneer - 200 g" / "Paneer: 200 g" / "Paneer" → { name, qty } */
export function parseIngredients(text) {
  return lines(text).map((l) => {
    const t = l.replace(/^[-•*]\s*/, '');
    const m = t.match(/^(.+?)\s+[-–—]\s+(.+)$/) || t.match(/^(.+?)\s*[:|–—]\s*(.+)$/);
    return m ? { name: m[1].trim(), qty: m[2].trim() } : { name: t, qty: '' };
  });
}
const ingText = (ings) => (ings || []).map((i) => (i.qty ? `${i.name} - ${i.qty}` : i.name)).join('\n');

const suggestions = (id, values) =>
  html`<datalist id="${id}">${[...new Set(values.filter(Boolean))].sort().map((v) => html`<option value="${v}">`)}</datalist>`;

const radios = (name, options, value) => html`<div class="pills">${Object.entries(options).map(([k, label]) => html`
  <label class="pill"><input type="radio" name="${name}" value="${k}" ${k === value ? 'checked' : ''}><span>${label}</span></label>`)}</div>`;

const ratingPicker = (value) => html`<div class="pills rating-pick">
  <label class="pill"><input type="radio" name="rating" value="" ${value == null ? 'checked' : ''}><span>–</span></label>
  ${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => html`
    <label class="pill"><input type="radio" name="rating" value="${n}" ${value === n ? 'checked' : ''}><span>${n}</span></label>`)}
</div>`;

const head = (title) => html`<header class="modal-head"><h2>${title}</h2>
  <button type="button" class="icon-btn" data-action="closeModal" aria-label="Close">✕</button></header>`;

const footer = (extra = '') => html`<div class="modal-actions">${extra}<span class="spacer"></span>
  <button type="button" class="btn ghost" data-action="closeModal">Cancel</button>
  <button type="submit" class="btn primary">Save</button></div>`;

// ---------- home dishes ----------

export function dishForm(dish = null, preset = {}) {
  const d = dish || { status: 'can_make', meals: [], ingredients: [], links: [], tags: [], ...preset };
  openModal(html`<form data-form="dish" class="modal-body">
    ${head(dish ? 'Edit dish' : 'Add a dish')}
    <input type="hidden" name="id" value="${dish?.id || ''}">
    <label class="field"><span>Dish</span><input name="name" required value="${d.name || ''}" placeholder="e.g. Palak Paneer" autocomplete="off" ${dish ? '' : 'autofocus'}></label>
    <div class="field"><span>Status</span>${radios('status', STATUS, d.status)}</div>
    <div class="field"><span>Diet</span>${radios('diet', DIET, d.diet || 'veg')}</div>
    <div class="field"><span>Your rating</span>${ratingPicker(d.rating ?? null)}</div>
    <div class="field"><div class="pills"><label class="pill"><input type="checkbox" name="favorite" ${d.favorite ? 'checked' : ''}><span>♥ Favourite</span></label></div></div>
    <div class="grid2">
      <label class="field"><span>Cuisine</span><input name="cuisine" list="dl-cuisine" value="${d.cuisine || ''}" placeholder="North Indian" autocomplete="off"></label>
      <label class="field"><span>Cook time <em>min</em></span><input name="cookTime" type="number" inputmode="numeric" min="0" value="${d.cookTime ?? ''}"></label>
    </div>
    ${suggestions('dl-cuisine', [...state.dishes.map((x) => x.cuisine), ...state.restaurants.map((r) => r.cuisine)])}
    <div class="field"><span>Good for</span><div class="pills">${SLOTS.map((s) => html`
      <label class="pill"><input type="checkbox" name="meals" value="${s}" ${d.meals?.includes(s) ? 'checked' : ''}><span>${cap(s)}</span></label>`)}</div></div>
    <label class="field"><span>Ingredients <em>one per line, e.g. “Paneer - 200 g”</em></span><textarea name="ingredients" rows="6">${ingText(d.ingredients)}</textarea></label>
    <label class="field"><span>Method <em>one step per line</em></span><textarea name="method" rows="5" placeholder="Soak the rajma overnight">${(d.method || []).join('\n')}</textarea></label>
    <label class="field"><span>Recipe / video links <em>one per line</em></span><textarea name="links" rows="2" placeholder="https://youtube.com/…">${(d.links || []).join('\n')}</textarea></label>
    <label class="field"><span>Instructions for ${cookName()} <em>added to the WhatsApp message</em></span><textarea name="instructions" rows="2" placeholder="Less oil, medium spicy">${d.instructions || ''}</textarea></label>
    <label class="field"><span>Tags <em>comma separated</em></span><input name="tags" value="${(d.tags || []).join(', ')}" placeholder="high protein, quick, comfort"></label>
    <label class="field"><span>Notes</span><textarea name="notes" rows="2">${d.notes || ''}</textarea></label>
    ${footer(dish ? html`<button type="button" class="btn ghost danger" data-action="deleteDish" data-id="${dish.id}">Delete</button>` : '')}
  </form>`);
}

function saveDish(fd) {
  const id = str(fd, 'id');
  const data = {
    name: str(fd, 'name'),
    status: str(fd, 'status') || 'can_make',
    diet: str(fd, 'diet') || 'veg',
    rating: num(fd, 'rating'),
    favorite: fd.has('favorite'),
    cuisine: str(fd, 'cuisine'),
    cookTime: num(fd, 'cookTime'),
    meals: fd.getAll('meals'),
    ingredients: parseIngredients(fd.get('ingredients')),
    method: lines(fd.get('method')).map((l) => l.replace(/^\d+[.)]\s*/, '')),
    links: lines(fd.get('links')),
    instructions: str(fd, 'instructions'),
    tags: str(fd, 'tags').split(',').map((t) => t.trim()).filter(Boolean),
    notes: str(fd, 'notes'),
  };
  if (!data.name) return;
  let newId = id;
  update((s) => {
    const existing = id && byId(s.dishes, id);
    // Keep titles/channels only for links that are still there.
    const known = existing?.linkInfo || {};
    data.linkInfo = Object.fromEntries(data.links.filter((l) => known[l]).map((l) => [l, known[l]]));
    if (existing) {
      // Once you change the ingredients they're yours, not the video's.
      if (ingText(existing.ingredients) !== ingText(data.ingredients)) data.recipeFrom = '';
      Object.assign(existing, data);
    } else {
      newId = uid();
      // A dish we know from the catalogue gets its video, ingredients and method for whatever you left blank.
      const video = data.links.length ? {} : videoFields(data.name);
      const recipe = recipeFor(data.name);
      const fill = recipe ? {
        ...(data.ingredients.length ? {} : { ingredients: recipe.ingredients, recipeFrom: recipe.recipeFrom }),
        ...(data.method.length ? {} : { method: recipe.method }),
      } : {};
      s.dishes.push({ id: newId, archived: false, from: null, addedOn: todayISO(), recipeFrom: '', ...data, ...video, ...fill });
    }
  });
  closeModal();
  toast(id ? 'Saved' : `Added ${data.name}`);
  if (!id) location.hash = `#/dish/${newId}`;
}

function deleteDish({ id }) {
  const d = byId(state.dishes, id);
  if (!d || !confirm(`Delete “${d.name}”? Your meal history is kept.`)) return;
  closeModal();
  if (location.hash.startsWith('#/dish/')) location.hash = '#/cook';
  update((s) => {
    s.dishes = s.dishes.filter((x) => x.id !== id);
    s.plan = s.plan.filter((p) => p.dishId !== id);
  });
  toast('Deleted');
}

/** Log that a home dish was eaten; clears it from the menu. */
export function logHomeMeal(dishId, date = todayISO(), slot = '', planId = '') {
  const d = byId(state.dishes, dishId);
  if (!d) return;
  const meal = { id: uid(), date, slot: slot || slotFor(d, ui.slot), kind: 'home', dishId, label: d.name };
  let cleared = [];
  update((s) => {
    s.meals.push(meal);
    cleared = s.plan.filter((p) => p.id === planId || (p.dishId === dishId && p.date === date));
    s.plan = s.plan.filter((p) => !cleared.includes(p));
  });
  toast(`Logged ${d.name}`, () => update((s) => {
    s.meals = s.meals.filter((m) => m.id !== meal.id);
    s.plan.push(...cleared);
  }));
}

// ---------- "Make this" → WhatsApp ----------

export function openMake(dishId, planId = '') {
  const dish = byId(state.dishes, dishId);
  if (!dish) return;
  const plan = planId ? byId(state.plan, planId) : null;
  const when = plan && plan.date > todayISO() ? 'tomorrow' : 'today';
  const slot = plan?.slot || slotFor(dish, ui.slot);
  const av = availability(dish);
  const phone = state.settings.cookPhone;
  openModal(html`<form data-form="make" class="modal-body">
    ${head(`Make ${dish.name}`)}
    <input type="hidden" name="dishId" value="${dish.id}">
    <input type="hidden" name="planId" value="${planId}">
    <div class="grid2">
      <label class="field"><span>When</span><select name="when" data-change="makePreview">
        <option value="today" ${when === 'today' ? 'selected' : ''}>Today</option>
        <option value="tomorrow" ${when === 'tomorrow' ? 'selected' : ''}>Tomorrow</option></select></label>
      <label class="field"><span>Meal</span><select name="slot" data-change="makePreview">${SLOTS.map((s) => html`
        <option value="${s}" ${s === slot ? 'selected' : ''}>${cap(s)}</option>`)}</select></label>
    </div>
    ${av.rows.length ? html`<div class="avail">
      ${av.have.length ? html`<div><span class="chip good">At home</span>${nameList(av.have, 8)}</div>` : ''}
      ${av.out.length ? html`<div><span class="chip bad">Need</span>${nameList(av.out, 8)}</div>` : ''}
      ${av.unknown.length ? html`<div><span class="chip warn">Check</span>${nameList(av.unknown, 8)}</div>` : ''}
      ${av.out.length || av.unknown.length ? html`<div class="hint">Anything missing goes on your shopping list once this is on the menu.</div>` : ''}
    </div>` : html`<p class="hint">No ingredients saved for this dish yet.</p>`}
    <label class="field"><span>Message <em>edit freely</em></span><textarea name="text" rows="9">${cookMessage(dish, when, slot)}</textarea></label>
    <p class="hint">${phone ? `Opens your WhatsApp chat with ${cookName()}.` : 'WhatsApp will ask who to send it to. Add a number in Settings to skip that.'}</p>
    <div class="modal-actions">
      <button type="button" class="btn ghost" data-action="planOnly">Just add to menu</button>
      <span class="spacer"></span>
      <button type="button" class="btn" data-action="copyMake">Copy</button>
      <button type="submit" class="btn primary">Send on WhatsApp</button>
    </div>
  </form>`);
}

function planFromForm(form, sent) {
  const el = (n) => form.elements.namedItem(n).value;
  const dishId = el('dishId');
  const date = el('when') === 'tomorrow' ? todayISO(1) : todayISO();
  const slot = el('slot');
  update((s) => {
    let p = byId(s.plan, el('planId')) || s.plan.find((x) => x.dishId === dishId && x.date === date && x.slot === slot);
    if (!p) {
      p = { id: uid(), dishId, sent: false };
      s.plan.push(p);
    }
    p.date = date;
    p.slot = slot;
    if (sent) p.sent = true;
  });
  return el('text');
}

// ---------- restaurants ----------

export function restaurantForm(r = null, preset = {}) {
  const d = r || { status: 'been', ...preset };
  openModal(html`<form data-form="restaurant" class="modal-body">
    ${head(r ? 'Edit place' : d.status === 'want' ? 'Save a place to try' : 'Add a place')}
    <input type="hidden" name="id" value="${r?.id || ''}">
    <label class="field"><span>Name</span><input name="name" required value="${d.name || ''}" autocomplete="off" ${r ? '' : 'autofocus'}></label>
    <div class="field">${radios('status', { been: 'Been there', want: 'Want to go' }, d.status)}</div>
    <div class="grid2">
      <label class="field"><span>Area</span><input name="area" list="dl-area" value="${d.area || ''}" placeholder="GK 1" autocomplete="off"></label>
      <label class="field"><span>Cuisine</span><input name="cuisine" list="dl-cuisine" value="${d.cuisine || ''}" placeholder="Italian" autocomplete="off"></label>
    </div>
    ${suggestions('dl-area', state.restaurants.map((x) => x.area))}
    ${suggestions('dl-cuisine', [...state.dishes.map((x) => x.cuisine), ...state.restaurants.map((x) => x.cuisine)])}
    <label class="field"><span>Recommended by</span><input name="recommendedBy" list="dl-rec" value="${d.recommendedBy || ''}" autocomplete="off"></label>
    ${suggestions('dl-rec', state.restaurants.map((x) => x.recommendedBy))}
    <label class="field"><span>Map or website link</span><input name="mapUrl" type="url" value="${d.mapUrl || ''}" placeholder="https://maps.app.goo.gl/…"></label>
    ${r ? '' : html`<label class="field"><span>Dishes to try here <em>one per line</em></span><textarea name="toTry" rows="2">${d.toTry || ''}</textarea></label>`}
    <label class="field"><span>Notes</span><textarea name="notes" rows="2">${d.notes || ''}</textarea></label>
    ${footer(r ? html`<button type="button" class="btn ghost danger" data-action="deleteRestaurant" data-id="${r.id}">Delete</button>` : '')}
  </form>`);
}

function saveRestaurant(fd) {
  const id = str(fd, 'id');
  const data = {
    name: str(fd, 'name'),
    status: str(fd, 'status') || 'been',
    area: str(fd, 'area'),
    cuisine: str(fd, 'cuisine'),
    recommendedBy: str(fd, 'recommendedBy'),
    mapUrl: str(fd, 'mapUrl'),
    notes: str(fd, 'notes'),
  };
  if (!data.name) return;
  let newId = id;
  update((s) => {
    const existing = id && byId(s.restaurants, id);
    if (existing) Object.assign(existing, data);
    else {
      newId = uid();
      const dishes = lines(fd.get('toTry')).map((name) => ({ id: uid(), name, tried: false, rating: null, verdict: '', notes: '', addedOn: todayISO() }));
      s.restaurants.push({ id: newId, addedOn: todayISO(), dishes, ...data });
    }
  });
  closeModal();
  toast(id ? 'Saved' : `Added ${data.name}`);
  if (!id) location.hash = `#/restaurant/${newId}`;
}

function deleteRestaurant({ id }) {
  const r = byId(state.restaurants, id);
  if (!r || !confirm(`Delete “${r.name}” and its ${r.dishes.length} dish notes?`)) return;
  closeModal();
  location.hash = '#/out';
  update((s) => { s.restaurants = s.restaurants.filter((x) => x.id !== id); });
  toast('Deleted');
}

export function rdishForm(rid, did = '') {
  const r = byId(state.restaurants, rid);
  if (!r) return;
  const existing = did ? r.dishes.find((x) => x.id === did) : null;
  const d = existing || { tried: true, verdict: '' };
  openModal(html`<form data-form="rdish" class="modal-body">
    ${head(existing ? 'Edit dish' : `A dish at ${r.name}`)}
    <input type="hidden" name="rid" value="${r.id}"><input type="hidden" name="did" value="${did}">
    <label class="field"><span>Dish</span><input name="name" required value="${d.name || ''}" autocomplete="off" ${existing ? '' : 'autofocus'}></label>
    <div class="field">${radios('tried', { yes: 'Had it', no: 'Want to try' }, d.tried ? 'yes' : 'no')}</div>
    <div class="field"><span>Rating</span>${ratingPicker(d.rating ?? null)}</div>
    <div class="field"><span>Next time</span>${radios('verdict', { reorder: 'Reorder', '': 'Maybe', skip: 'Skip' }, d.verdict || '')}</div>
    <label class="field"><span>Notes</span><textarea name="notes" rows="2" placeholder="Ask for it less spicy">${d.notes || ''}</textarea></label>
    ${footer(existing ? html`<button type="button" class="btn ghost danger" data-action="deleteRdish" data-rid="${r.id}" data-did="${did}">Delete</button>` : '')}
  </form>`);
}

function saveRdish(fd) {
  const rid = str(fd, 'rid');
  const did = str(fd, 'did');
  const data = {
    name: str(fd, 'name'),
    tried: str(fd, 'tried') !== 'no',
    rating: num(fd, 'rating'),
    verdict: str(fd, 'verdict'),
    notes: str(fd, 'notes'),
  };
  if (!data.name) return;
  update((s) => {
    const r = byId(s.restaurants, rid);
    const existing = did && r.dishes.find((x) => x.id === did);
    if (existing) Object.assign(existing, data);
    else r.dishes.push({ id: uid(), addedOn: todayISO(), ...data });
    if (data.tried && r.status === 'want') r.status = 'been';
  });
  closeModal();
  toast('Saved');
}

function visitForm({ id }) {
  const r = byId(state.restaurants, id);
  openModal(html`<form data-form="visit" class="modal-body">
    ${head(`Log a meal from ${r.name}`)}
    <input type="hidden" name="rid" value="${r.id}">
    <div class="field">${radios('kind', { out: 'Ate there', order: 'Ordered in' }, 'out')}</div>
    <div class="grid2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${todayISO()}" max="${todayISO()}"></label>
      <label class="field"><span>Meal</span><select name="slot">${SLOTS.map((s) => html`<option value="${s}" ${s === ui.slot ? 'selected' : ''}>${cap(s)}</option>`)}</select></label>
    </div>
    <p class="hint">Rate what you had with “+ Dish” on the restaurant page.</p>
    ${footer()}
  </form>`);
}

function saveVisit(fd) {
  const rid = str(fd, 'rid');
  update((s) => {
    const r = byId(s.restaurants, rid);
    s.meals.push({ id: uid(), date: str(fd, 'date') || todayISO(), slot: str(fd, 'slot'), kind: str(fd, 'kind') || 'out', restaurantId: rid, label: r.name });
    if (r.status === 'want') r.status = 'been';
  });
  closeModal();
  toast('Logged');
}

/** Restaurant → home loop: add a loved restaurant dish to the "to learn" list. */
function toHome({ rid, did }) {
  const r = byId(state.restaurants, rid);
  const rd = r?.dishes.find((x) => x.id === did);
  if (!rd) return;
  const linked = state.dishes.find((d) => d.from?.rdishId === did);
  if (linked) {
    location.hash = `#/dish/${linked.id}`;
    return;
  }
  const id = uid();
  update((s) => {
    s.dishes.push({
      id, name: rd.name, status: 'learning', diet: guessDiet(rd), archived: false, rating: null, favorite: false, cuisine: r.cuisine || '',
      meals: [], ingredients: [], method: [], recipeFrom: '', ...videoFields(rd.name), ...recipeFor(rd.name),
      cookTime: null, tags: [], instructions: '',
      notes: `Loved it at ${r.name}${rd.rating ? ` (${rd.rating}/10)` : ''}.${rd.notes ? ` ${rd.notes}` : ''}`,
      from: { restaurantId: r.id, rdishId: rd.id }, addedOn: todayISO(),
    });
  });
  location.hash = `#/dish/${id}`;
  toast(`Added to ${cookName()}’s “to learn” list`);
}

// ---------- kitchen ----------

export function pantryForm({ id }) {
  const p = byId(state.pantry, id);
  if (!p) return;
  openModal(html`<form data-form="pantry" class="modal-body">
    ${head('Kitchen item')}
    <input type="hidden" name="id" value="${p.id}">
    <label class="field"><span>Name</span><input name="name" required value="${p.name}" autocomplete="off"></label>
    <div class="field"><span>Kind</span>${radios('kind', { staple: 'Staple', fresh: 'Fresh', special: 'Special' }, p.kind)}</div>
    <div class="field"><span>Status</span>${radios('status', { have: 'Have', low: 'Running low', out: 'Out' }, p.status)}</div>
    <label class="field"><span>Bought / restocked on</span><input type="date" name="since" value="${p.since || ''}" max="${todayISO()}"></label>
    ${footer(html`<button type="button" class="btn ghost danger" data-action="deletePantry" data-id="${p.id}">Delete</button>`)}
  </form>`);
}

function savePantry(fd) {
  update((s) => {
    const p = byId(s.pantry, str(fd, 'id'));
    const status = str(fd, 'status');
    Object.assign(p, { name: str(fd, 'name') || p.name, kind: str(fd, 'kind'), since: str(fd, 'since') || p.since });
    if (status !== p.status && status === 'have' && !str(fd, 'since')) p.since = todayISO();
    p.status = status;
  });
  closeModal();
}

/** Mark an ingredient as available, adding it to the kitchen if it isn't tracked yet. */
export function markHave(name, itemId = '', kind = 'staple') {
  update((s) => {
    const p = (itemId && byId(s.pantry, itemId)) || findPantry(name);
    if (p) {
      p.status = 'have';
      p.since = todayISO();
    } else {
      s.pantry.push({ id: uid(), name: titleCase(name), kind, status: 'have', since: todayISO() });
    }
  });
}

export function addPantryItems(text, kind) {
  const names = String(text).split(/[,\n]/).map((n) => n.trim()).filter(Boolean);
  if (!names.length) return 0;
  update((s) => {
    for (const name of names) {
      const p = s.pantry.find((x) => ingKey(x.name) === ingKey(name));
      if (p) {
        p.status = 'have';
        p.since = todayISO();
      } else {
        s.pantry.push({ id: uid(), name: titleCase(name), kind, status: 'have', since: todayISO() });
      }
    }
  });
  return names.length;
}

// ---------- save for later ----------

export function openCapture(shared = {}) {
  const url = shared.url || (String(shared.text || '').match(/https?:\/\/\S+/) || [])[0] || '';
  const text = String(shared.text || '').replace(url, '').trim();
  const title = String(shared.title || '').trim();
  captureDraft = { text, title };
  openModal(html`<div class="modal-body">
    ${head('Save for later')}
    ${title || text ? html`<p class="shared">${[title, text].filter(Boolean).join(' — ')}</p>` : html`<p class="hint">Found something good? Save it now, sort it out later.</p>`}
    <label class="field"><span>Link <em>optional: recipe, reel, video or map</em></span>
      <input id="capture-url" type="url" inputmode="url" value="${url}" placeholder="Paste a link" autocomplete="off"></label>
    <div class="choice-list">
      <button type="button" class="choice" data-action="captureDish">
        <strong>A dish to cook at home</strong><span>Goes on your “want to try” list</span></button>
      <button type="button" class="choice" data-action="captureRestaurant">
        <strong>A restaurant to try</strong><span>With who recommended it and what to order</span></button>
    </div>
  </div>`);
}
let captureDraft = {};
const capturedUrl = () => document.getElementById('capture-url')?.value.trim() || '';

// ---------- wiring ----------

export const actions = {
  addDish: () => dishForm(),
  editDish: ({ id }) => dishForm(byId(state.dishes, id)),
  deleteDish,
  make: ({ id, plan }) => openMake(id, plan || ''),
  ate: ({ id }) => logHomeMeal(id),
  addRestaurant: () => restaurantForm(),
  editRestaurant: ({ id }) => restaurantForm(byId(state.restaurants, id)),
  deleteRestaurant,
  addRdish: ({ id }) => rdishForm(id),
  editRdish: ({ rid, did }) => rdishForm(rid, did),
  deleteRdish: ({ rid, did }) => {
    if (!confirm('Delete this dish?')) return;
    closeModal();
    update((s) => {
      const r = byId(s.restaurants, rid);
      r.dishes = r.dishes.filter((x) => x.id !== did);
    });
  },
  logVisit: visitForm,
  toHome,
  editPantry: pantryForm,
  deletePantry: ({ id }) => {
    closeModal();
    update((s) => { s.pantry = s.pantry.filter((p) => p.id !== id); });
  },
  haveIt: ({ name, item }) => {
    markHave(name, item);
    toast(`${titleCase(name)} marked as at home`);
  },
  capture: () => openCapture(),
  captureDish: () => {
    const { text, title } = captureDraft;
    const url = capturedUrl();
    dishForm(null, { status: 'want_to_try', name: title, links: url ? [url] : [], notes: text });
  },
  captureRestaurant: () => {
    const { text, title } = captureDraft;
    restaurantForm(null, { status: 'want', name: title, mapUrl: capturedUrl(), notes: text });
  },
  copyMake: async (_, el) => {
    const text = planFromForm(el.closest('form'), false);
    closeModal();
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied — added to the menu');
    } catch {
      toast('Could not copy on this browser');
    }
  },
  planOnly: (_, el) => {
    planFromForm(el.closest('form'), false);
    closeModal();
    toast('Added to the menu');
  },
};

export const forms = {
  dish: saveDish,
  restaurant: saveRestaurant,
  rdish: saveRdish,
  visit: saveVisit,
  pantry: savePantry,
  make: (fd, form) => {
    const text = planFromForm(form, true);
    window.open(whatsappUrl(text, state.settings.cookPhone), '_blank', 'noopener');
    closeModal();
    toast('Sent and added to the menu');
  },
};

export const changes = {
  makePreview: (el) => {
    const f = el.form;
    const v = (n) => f.elements.namedItem(n).value;
    f.elements.namedItem('text').value = cookMessage(byId(state.dishes, v('dishId')), v('when'), v('slot'));
  },
};
