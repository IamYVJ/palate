// Kitchen: the shopping list (derived from the menu + kitchen) and a lightweight pantry.

import { state, ui, update, refresh, uid, byId } from '../store.js';
import { html, todayISO, daysSince, toast, KINDS } from '../ui.js';
import { shoppingList, shoppingText, whatsappUrl, findPantry } from '../logic.js';
import { markHave, addPantryItems } from '../modals.js';

const NEXT = { have: 'low', low: 'out', out: 'have' };

export function render() {
  const shop = shoppingList();
  return html`
  <div class="page-head"><h1>Kitchen</h1></div>
  <div class="seg">
    <button type="button" class="${ui.kitchenTab === 'shop' ? 'on' : ''}" data-action="kitchenTab" data-t="shop">To buy <span class="count">${shop.count}</span></button>
    <button type="button" class="${ui.kitchenTab === 'pantry' ? 'on' : ''}" data-action="kitchenTab" data-t="pantry">At home <span class="count">${state.pantry.filter((p) => p.status !== 'out').length}</span></button>
  </div>
  ${ui.kitchenTab === 'shop' ? shopView(shop) : pantryView()}`;
}

// ---------- shopping ----------

function shopView(shop) {
  return html`
  <form class="inline-add" data-form="shopAdd">
    <input name="name" placeholder="Add something to buy" autocomplete="off" aria-label="Item to buy">
    <button class="btn primary sm" type="submit">Add</button>
  </form>

  ${shop.count ? '' : html`<div class="empty" style="margin-top:12px">Nothing to buy. Put a dish on the menu and anything missing shows up here.</div>`}

  ${shop.planned.length ? html`<h2 class="section-title">For the menu</h2><div class="list">${shop.planned.map((e) => shopRow({
    src: 'planned', name: e.name, item: e.itemId,
    sub: [e.qtys.join(' + '), `for ${e.dishes.join(', ')}`].filter(Boolean).join(' · '),
    unknown: e.avail === 'unknown',
  }))}</div>` : ''}

  ${shop.restock.length ? html`<h2 class="section-title">Running low or out</h2><div class="list">${shop.restock.map((p) => shopRow({
    src: 'restock', name: p.name, item: p.id, sub: p.status === 'low' ? 'running low' : 'out',
  }))}</div>` : ''}

  ${shop.extras.length ? html`<h2 class="section-title">Also</h2><div class="list">${shop.extras.map((x) => shopRow({
    src: 'extra', name: x.name, extra: x.id,
  }))}</div>` : ''}

  ${shop.count ? html`<div class="card-actions">
    <button type="button" class="btn" data-action="shareShop">Send list on WhatsApp</button>
    <button type="button" class="btn ghost" data-action="copyShop">Copy</button>
  </div>
  <p class="hint">Tick things off as you buy them; they’re marked as at home in the kitchen.</p>` : ''}`;
}

function shopRow({ src, name, item = '', extra = '', sub = '', unknown = false }) {
  return html`<div class="row">
    <button type="button" class="check" data-action="gotIt" data-src="${src}" data-name="${name}" data-item="${item}" data-extra="${extra}" aria-label="Bought ${name}" title="Bought it"></button>
    <div class="row-main">
      <div class="row-title">${name}</div>
      ${sub ? html`<div class="row-sub">${sub}${unknown ? ' · not tracked in your kitchen' : ''}</div>` : ''}
    </div>
    ${unknown ? html`<button type="button" class="btn xs" data-action="haveIt" data-name="${name}" data-item="">Have it</button>` : ''}
    ${src === 'extra' ? html`<button type="button" class="btn xs ghost" data-action="removeExtra" data-extra="${extra}" aria-label="Remove">✕</button>` : ''}
  </div>`;
}

// ---------- pantry ----------

function pantryView() {
  const groups = Object.keys(KINDS).map((k) => [k, state.pantry.filter((p) => p.kind === k)]);
  return html`
  <form class="inline-add" data-form="pantryAdd">
    <input name="names" placeholder="Add items, comma separated" autocomplete="off" aria-label="Items to add">
    <select name="kind" aria-label="Kind" data-change="pantryKind">${Object.entries({ staple: 'Staple', fresh: 'Fresh', special: 'Special' }).map(([k, label]) => html`
      <option value="${k}" ${ui.pantryKind === k ? 'selected' : ''}>${label}</option>`)}</select>
    <button class="btn primary sm" type="submit">Add</button>
  </form>
  <p class="hint">No need to track everything, just what you care about. Tap a status to cycle have → low → out.</p>
  ${state.pantry.length ? '' : html`<div class="empty">Your kitchen is empty. Add staples like rice, atta, onion and oil, and fresh things like paneer or spinach.</div>`}
  ${groups.filter(([, items]) => items.length).map(([k, items]) => html`
    <h2 class="section-title">${KINDS[k]} <span class="muted">${k === 'fresh' ? 'oldest first' : ''}</span></h2>
    <div class="list">${sortItems(k, items).map(pantryRow)}</div>`)}`;
}

function sortItems(kind, items) {
  if (kind === 'fresh') return items.slice().sort((a, b) => (a.status === 'out') - (b.status === 'out') || (a.since || '').localeCompare(b.since || ''));
  return items.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function pantryRow(p) {
  const age = p.kind === 'fresh' && p.status !== 'out' && p.since ? daysSince(p.since) : null;
  return html`<div class="row">
    <div class="row-main">
      <button type="button" class="linkish row-title" data-action="editPantry" data-id="${p.id}">${p.name}</button>
      ${age != null ? html`<div class="row-sub">${age === 0 ? 'bought today' : `${age} day${age === 1 ? '' : 's'} old`}</div>` : ''}
    </div>
    <button type="button" class="st ${p.status}" data-action="cycleStatus" data-id="${p.id}" title="Tap to change">${p.status}</button>
  </div>`;
}

export const actions = {
  kitchenTab: ({ t }) => {
    ui.kitchenTab = t;
    refresh();
  },
  cycleStatus: ({ id }) => update((s) => {
    const p = byId(s.pantry, id);
    p.status = NEXT[p.status] || 'have';
    if (p.status === 'have') p.since = todayISO();
  }),
  gotIt: ({ src, name, item, extra }) => {
    update((s) => {
      if (src === 'extra') s.shopExtra = s.shopExtra.filter((x) => x.id !== extra);
      const p = (item && byId(s.pantry, item)) || (src === 'extra' ? findPantry(name) : null);
      if (p) {
        p.status = 'have';
        p.since = todayISO();
      }
    });
    // Recipe ingredients we weren't tracking yet start being tracked as fresh buys.
    if (src === 'planned' && !item) markHave(name, '', 'fresh');
    toast(`Got ${name}`);
  },
  removeExtra: ({ extra }) => update((s) => { s.shopExtra = s.shopExtra.filter((x) => x.id !== extra); }),
  shareShop: () => window.open(whatsappUrl(shoppingText(shoppingList())), '_blank', 'noopener'),
  copyShop: async () => {
    try {
      await navigator.clipboard.writeText(shoppingText(shoppingList()));
      toast('Copied');
    } catch {
      toast('Could not copy on this browser');
    }
  },
};

export const forms = {
  shopAdd: (fd, form) => {
    const names = String(fd.get('name') || '').split(',').map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    update((s) => { for (const name of names) s.shopExtra.push({ id: uid(), name }); });
    form.reset();
    document.querySelector('[data-form="shopAdd"] input')?.focus();
  },
  pantryAdd: (fd) => {
    const n = addPantryItems(fd.get('names'), String(fd.get('kind')));
    if (n) toast(`Added ${n} item${n === 1 ? '' : 's'}`);
    document.querySelector('[data-form="pantryAdd"] input')?.focus();
  },
};

export const changes = {
  pantryKind: (el) => { ui.pantryKind = el.value; },
};
