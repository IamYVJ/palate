// All of Palate's data lives in one object, persisted to localStorage on every change.

import { guessDiet } from './diet.js';

const KEY = 'palate.v1';
const LISTS = ['dishes', 'restaurants', 'pantry', 'meals', 'plan', 'shopExtra'];

export const blank = () => ({
  version: 1,
  settings: { cookName: '', cookPhone: '', lang: 'en' },
  dishes: [],      // home dishes: { id, name, status, diet, archived, rating, favorite, cuisine, meals[], ingredients[{name, qty}], links[], cookTime, tags[], instructions, notes, from, addedOn }
  restaurants: [], // { id, name, status: 'been'|'want', area, cuisine, mapUrl, recommendedBy, notes, addedOn, dishes[{ id, name, tried, rating, verdict, notes, addedOn }] }
  pantry: [],      // { id, name, kind: 'staple'|'fresh'|'special', status: 'have'|'low'|'out', since }
  meals: [],       // the food log: { id, date, slot, kind: 'home'|'out'|'order', dishId?, restaurantId?, label }
  plan: [],        // what's on the menu: { id, dishId, date, slot, sent }
  shopExtra: [],   // things to buy that aren't tied to a recipe: { id, name }
});

function normalize(data) {
  const b = blank();
  const s = { ...b, ...data, settings: { ...b.settings, ...(data?.settings || {}) } };
  for (const k of LISTS) if (!Array.isArray(s[k])) s[k] = [];
  // Fields added after v0: fill them in for older saved data and backups.
  for (const d of s.dishes) {
    if (!d.diet) d.diet = guessDiet(d);
    if (typeof d.archived !== 'boolean') d.archived = false;
  }
  return s;
}

function load() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return normalize(JSON.parse(saved));
  } catch (e) {
    console.warn('Palate: could not read saved data', e);
  }
  return blank();
}

export let state = load();

/** View-only state (filters, tabs). Not persisted. */
export const ui = {
  slot: 'dinner',
  cookFilter: 'all',
  cookSort: 'rating',
  cookQ: '',
  kitchenTab: 'shop',
  pantryKind: 'staple',
  outFilter: 'been',
  outQ: '',
  outArea: '',
  memoryQ: '',
  ideasRegion: 'indian',
  ideasQ: '',
  ideaPicks: new Set(),
};

const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);
export const refresh = () => listeners.forEach((fn) => fn());

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    alert(`Palate couldn't save your changes: ${e.message}`);
  }
  refresh();
}

/** Mutate state inside `fn`, then save and re-render. */
export function update(fn) {
  fn(state);
  commit();
}

export function replaceAll(data) {
  state = normalize(data);
  commit();
}

export const looksLikeBackup = (d) => !!d && typeof d === 'object' && Array.isArray(d.dishes) && Array.isArray(d.restaurants);
export const isEmpty = () => !state.dishes.length && !state.restaurants.length && !state.pantry.length;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const byId = (list, id) => list.find((x) => x.id === id);

// Ask the browser not to evict our data when storage is tight.
navigator.storage?.persist?.().catch(() => {});
