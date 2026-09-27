// The "intelligence": ingredient matching, recommendations, shopping list, search and insights.
// Everything here is derived from state on demand; nothing is cached.

import { state, byId } from './store.js';
import { todayISO, daysSince, ago, STATUS, SLOTS, youtubeId } from './ui.js';

// ---------- ingredients vs. the kitchen ----------

const ASSUMED = new Set(['salt', 'water']);

/** Loose key so "Tomatoes" ~ "tomato" and "green chillies" ~ "green chilli". */
export function ingKey(s) {
  return String(s || '').toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9ऀ-ॿ]+/g, ' ')
    .trim().split(/\s+/).filter(Boolean)
    .map((w) => (w.length > 3 ? w.replace(/ies$/, 'i').replace(/y$/, 'i').replace(/oes$/, 'o').replace(/([^s])s$/, '$1') : w))
    .join(' ');
}

export function findPantry(name) {
  const k = ingKey(name);
  if (!k) return null;
  const items = state.pantry.map((p) => [p, ingKey(p.name)]);
  const exact = items.find(([, pk]) => pk === k);
  if (exact) return exact[0];
  // "Paneer" in the kitchen covers "fresh paneer" in a recipe (but not the other way round).
  const padded = ` ${k} `;
  const partial = items
    .filter(([, pk]) => pk.length >= 3 && padded.includes(` ${pk} `))
    .sort((a, b) => b[1].length - a[1].length)[0];
  return partial ? partial[0] : null;
}

/** 'have' (in stock or running low), 'out', or 'unknown' (not tracked in the kitchen). */
export function checkIngredient(name) {
  if (ASSUMED.has(ingKey(name))) return { avail: 'have', item: null };
  const item = findPantry(name);
  if (!item) return { avail: 'unknown', item: null };
  return { avail: item.status === 'out' ? 'out' : 'have', item };
}

export function availability(dish) {
  const rows = (dish.ingredients || []).map((i) => ({ ...i, ...checkIngredient(i.name) }));
  const have = rows.filter((r) => r.avail === 'have');
  const out = rows.filter((r) => r.avail === 'out');
  const unknown = rows.filter((r) => r.avail === 'unknown');
  const ratio = rows.length ? (have.length + 0.5 * unknown.length) / rows.length : 1;
  return { rows, have, out, unknown, ratio };
}

/** "paneer", "paneer & cream", "paneer, cream & basil", "paneer, cream +3" */
export const nameList = (rows, max = 2) => {
  const names = rows.map((r) => (r.name || r).toLowerCase());
  if (names.length > max) return `${names.slice(0, max).join(', ')} +${names.length - max}`;
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names.at(-1)}` : names.join('');
};

/** Fresh things that have been sitting a while, oldest first. */
export function useSoon(limit = 4) {
  return state.pantry
    .filter((p) => p.kind === 'fresh' && p.status !== 'out' && p.since && daysSince(p.since) >= 4)
    .sort((a, b) => a.since.localeCompare(b.since))
    .slice(0, limit);
}

// ---------- the food log ----------

export function mealStats() {
  const dish = new Map();
  const rest = new Map();
  const put = (map, id, date) => {
    const s = map.get(id) || { first: date, last: date, count: 0, dates: [] };
    s.count++;
    s.dates.push(date);
    if (date > s.last) s.last = date;
    if (date < s.first) s.first = date;
    map.set(id, s);
  };
  for (const m of state.meals) {
    if (m.dishId) put(dish, m.dishId, m.date);
    if (m.restaurantId) put(rest, m.restaurantId, m.date);
  }
  return { dish, rest };
}

export function currentSlot() {
  const h = new Date().getHours();
  return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner';
}

/** The meal to default to for a dish: this one if it suits, otherwise the next one it's made for. */
export function slotFor(dish, slot = currentSlot()) {
  const ok = dish.meals?.length ? dish.meals : SLOTS;
  if (ok.includes(slot)) return slot;
  return SLOTS.slice(SLOTS.indexOf(slot)).find((x) => ok.includes(x)) || ok[0];
}

// ---------- what should I eat? ----------

export function recommend(slot, limit = 6) {
  const stats = mealStats();
  const today = todayISO();
  const planned = new Set(state.plan.filter((p) => p.date === today).map((p) => p.dishId));
  return state.dishes
    .filter((d) => !d.archived && d.status === 'can_make' && !planned.has(d.id) && (!d.meals?.length || d.meals.includes(slot)))
    .map((d) => scoreDish(d, stats.dish.get(d.id)))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function scoreDish(dish, stat) {
  const days = daysSince(stat?.last);
  const av = availability(dish);
  const fresh = av.have.filter((r) => r.item?.kind === 'fresh' && r.item.since && daysSince(r.item.since) >= 2);

  // Taste matters most, then variety (not eaten recently), then what's already at home.
  let score = 0.45 * ((dish.rating ?? 6) / 10)
    + 0.3 * (days === Infinity ? 0.7 : Math.min(days, 21) / 21)
    + 0.25 * av.ratio;
  if (days <= 1) score -= 0.5;
  else if (days <= 3) score -= 0.2;
  if (dish.favorite) score += 0.08;
  if (fresh.length) score += 0.1;

  const reasons = [];
  if (days === Infinity) reasons.push({ text: 'not logged yet', tone: '' });
  else reasons.push({ text: days === 0 ? 'had today' : `last had ${ago(stat.last)}`, tone: days >= 14 ? 'good' : days <= 3 ? 'warn' : '' });
  if (av.rows.length) {
    if (av.out.length) reasons.push({ text: `need ${nameList(av.out)}`, tone: 'bad' });
    else if (av.unknown.length) reasons.push({ text: `check ${nameList(av.unknown)}`, tone: 'warn' });
    else reasons.push({ text: 'everything at home', tone: 'good' });
  }
  if (fresh.length) reasons.push({ text: `uses up the ${fresh[0].item.name.toLowerCase()}`, tone: 'good' });
  return { dish, score, days, av, reasons };
}

// ---------- shopping ----------

export function shoppingList() {
  const today = todayISO();
  const need = new Map();
  for (const p of state.plan.filter((x) => x.date >= today)) {
    const d = byId(state.dishes, p.dishId);
    if (!d) continue;
    for (const r of availability(d).rows) {
      if (r.avail === 'have') continue;
      const key = r.item ? `p:${r.item.id}` : `k:${ingKey(r.name)}`;
      const e = need.get(key) || { key, name: r.item?.name || r.name, itemId: r.item?.id || '', avail: r.avail, qtys: [], dishes: [] };
      if (!e.dishes.includes(d.name)) e.dishes.push(d.name);
      if (r.qty) e.qtys.push(r.qty);
      need.set(key, e);
    }
  }
  const planned = [...need.values()];
  const covered = new Set(planned.map((e) => e.itemId));
  const restock = state.pantry
    .filter((p) => (p.status === 'out' || p.status === 'low') && !covered.has(p.id))
    .sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'out' ? -1 : 1));
  const extras = state.shopExtra;
  return { planned, restock, extras, count: planned.length + restock.length + extras.length };
}

export function shoppingText(list) {
  const lines = ['🛒 Shopping list', ''];
  for (const e of list.planned) lines.push(`• ${e.name}${e.qtys.length ? ` (${e.qtys.join(' + ')})` : ''}`);
  for (const p of list.restock) lines.push(`• ${p.name}${p.status === 'low' ? ' (running low)' : ''}`);
  for (const x of list.extras) lines.push(`• ${x.name}`);
  return lines.join('\n');
}

// ---------- WhatsApp ----------

export function whatsappUrl(text, phone = '') {
  return `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function cookMessage(dish, when, slot) {
  const { cookName, lang } = state.settings;
  const name = (cookName || '').trim();
  const ings = (dish.ingredients || []).map((i) => `• ${i.name}${i.qty ? ` – ${i.qty}` : ''}`).join('\n');
  const link = (dish.links || [])[0];
  const isVideo = !!youtubeId(link);
  const lines = [];
  if (lang === 'hinglish') {
    const day = when === 'tomorrow' ? 'kal' : 'aaj';
    const meal = { breakfast: 'nashte', lunch: 'lunch', dinner: 'dinner' }[slot];
    lines.push(`${name ? `${name}, ` : ''}${day} ${meal} mein *${dish.name}* bana dijiye 🙏`);
    if (ings) lines.push('', '*Saamaan:*', ings);
    if (dish.instructions) lines.push('', dish.instructions);
    if (link) lines.push('', `${isVideo ? 'Video' : 'Recipe'}: ${link}`);
  } else {
    lines.push(`Hi${name ? ` ${name}` : ''}, please make *${dish.name}* for ${slot} ${when}.`);
    if (ings) lines.push('', '*Ingredients:*', ings);
    if (dish.instructions) lines.push('', dish.instructions);
    if (link) lines.push('', `${isVideo ? 'Recipe video' : 'Recipe'}: ${link}`);
  }
  return lines.join('\n');
}

// ---------- search ("what was that pizza I loved?") ----------

const STOP = new Set(`a an the i me my we our you your it its is are am was were be been being do did does done have has had
that this these those what whats which where when who whom how why of to at in on around near for from with and or but
should could would can will shall may might again order ordered reorder loved love liked like enjoyed best top favourite
favorite place places restaurant restaurants dish dishes food saved save try tried want wanted there here some any thing
things really very good great ever eat ate eaten`.split(/\s+/));

const words = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);

export function search(query) {
  const all = words(query);
  const terms = all.filter((w) => !STOP.has(w));
  if (!terms.length) return null;
  // "restaurants I saved", "where…", "places…" → the answer is a list of places.
  const wantsPlaces = all.some((w) => ['restaurant', 'restaurants', 'place', 'places', 'where', 'saved'].includes(w));
  const wantsUntried = all.some((w) => ['saved', 'want', 'try', 'haven', 'havent', 'not'].includes(w));
  // A term matches the start of a word, so "gk" finds "GK 1" but not "Bangkok".
  const hits = (...fields) => {
    const ws = fields.flat().flatMap(words);
    return terms.filter((t) => ws.some((w) => w.startsWith(t))).length;
  };
  const dishes = state.dishes.map((d) => ({
    d, n: hits(d.name, d.cuisine, d.notes, STATUS[d.status], d.tags, (d.ingredients || []).map((i) => i.name)),
  }));
  const rdishes = state.restaurants.flatMap((r) => r.dishes.map((d) => ({ r, d, n: hits(d.name, d.notes, r.name, r.area, r.cuisine) })));
  const places = state.restaurants.map((r) => ({
    r, n: hits(r.name, r.area, r.cuisine, r.recommendedBy, r.notes, r.dishes.map((d) => d.name)),
  }));
  // Keep only the best matches (most query words matched), best-rated first.
  const best = Math.max(0, ...[...dishes, ...rdishes, ...places].map((x) => x.n));
  const top = (list) => (best ? list.filter((x) => x.n === best) : []);
  const rated = (get) => (a, b) => (get(b) ?? -1) - (get(a) ?? -1);
  const verdictRank = { reorder: 0, '': 1, skip: 2 };
  const untriedFirst = (a, b) => (wantsUntried ? (a.r.status === 'want' ? 0 : 1) - (b.r.status === 'want' ? 0 : 1) : 0);
  return {
    terms,
    placesFirst: wantsPlaces,
    dishes: top(dishes).sort(rated((x) => x.d.rating)),
    rdishes: top(rdishes).sort((a, b) => (verdictRank[a.d.verdict || ''] - verdictRank[b.d.verdict || '']) || rated((x) => x.d.rating)(a, b)),
    places: top(places).sort((a, b) => untriedFirst(a, b) || a.r.name.localeCompare(b.r.name)),
  };
}

// ---------- insights ----------

export function insights() {
  const stats = mealStats();
  const year = String(new Date().getFullYear());

  const active = state.dishes.filter((d) => !d.archived);
  const topHome = active.filter((d) => d.rating != null).sort((a, b) => b.rating - a.rating).slice(0, 5);
  const topOut = state.restaurants
    .flatMap((r) => r.dishes.filter((d) => d.tried && d.rating != null).map((d) => ({ r, d })))
    .sort((a, b) => b.d.rating - a.d.rating)
    .slice(0, 5);
  const longTime = active
    .filter((d) => d.status === 'can_make' && stats.dish.has(d.id))
    .map((d) => ({ d, last: stats.dish.get(d.id).last }))
    .filter((x) => daysSince(x.last) >= 10)
    .sort((a, b) => a.last.localeCompare(b.last))
    .slice(0, 5);

  const since30 = todayISO(-30);
  const split = { home: 0, out: 0, order: 0 };
  for (const m of state.meals) if (m.date >= since30 && m.kind in split) split[m.kind]++;

  const since90 = todayISO(-90);
  const cuisines = new Map();
  for (const m of state.meals) {
    if (m.date < since90) continue;
    const c = m.dishId ? byId(state.dishes, m.dishId)?.cuisine : byId(state.restaurants, m.restaurantId)?.cuisine;
    if (c) cuisines.set(c, (cuisines.get(c) || 0) + 1);
  }

  const regulars = state.restaurants
    .filter((r) => stats.rest.has(r.id))
    .map((r) => ({ r, ...stats.rest.get(r.id) }))
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, 4);

  return {
    topHome,
    topOut,
    longTime,
    split,
    cuisines: [...cuisines].sort((a, b) => b[1] - a[1]).slice(0, 5),
    regulars,
    toTry: {
      dishes: active.filter((d) => d.status === 'want_to_try').length,
      learning: active.filter((d) => d.status === 'learning').length,
      places: state.restaurants.filter((r) => r.status === 'want').length,
      rdishes: state.restaurants.flatMap((r) => r.dishes.filter((d) => !d.tried)).length,
    },
    year,
    newPlaces: state.restaurants.filter((r) => stats.rest.get(r.id)?.first?.startsWith(year)).length,
    newDishes: state.restaurants.flatMap((r) => r.dishes).filter((d) => d.tried && d.addedOn?.startsWith(year)).length
      + state.dishes.filter((d) => d.addedOn?.startsWith(year)).length,
  };
}
