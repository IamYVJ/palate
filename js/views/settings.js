// Settings: your cook's details, backups, sample data.

import { state, update, replaceAll, looksLikeBackup, isEmpty } from '../store.js';
import { html, todayISO, toast } from '../ui.js';
import { sampleData } from '../sample.js';

export function render() {
  const s = state.settings;
  const base = location.href.split(/[?#]/)[0];
  const bookmarklet = `javascript:location.href=${JSON.stringify(`${base}?url=`)}+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)`;

  return html`
  <div class="page-head"><h1>Settings</h1></div>

  <form class="card" data-form="settings">
    <h2 class="card-title">Your cook</h2>
    <p class="hint">Used in the “Make this” WhatsApp messages.</p>
    <div class="grid2">
      <label class="field"><span>Name</span><input name="cookName" value="${s.cookName}" placeholder="e.g. Sunita" autocomplete="off"></label>
      <label class="field"><span>WhatsApp <em>with country code</em></span><input name="cookPhone" type="tel" inputmode="tel" value="${s.cookPhone}" placeholder="91 98765 43210"></label>
    </div>
    <div class="field"><span>Message language</span><div class="pills">
      <label class="pill"><input type="radio" name="lang" value="en" ${s.lang !== 'hinglish' ? 'checked' : ''}><span>English</span></label>
      <label class="pill"><input type="radio" name="lang" value="hinglish" ${s.lang === 'hinglish' ? 'checked' : ''}><span>Hinglish</span></label>
    </div></div>
    <div class="card-actions"><button type="submit" class="btn primary">Save</button></div>
  </form>

  <section class="card">
    <h2 class="card-title">Your data</h2>
    <p class="hint">Everything lives in this browser on this device; nothing is uploaded anywhere. Export a backup now and then, and use it to move to another phone or computer.</p>
    <p class="muted" style="font-size:14px">${state.dishes.length} dishes · ${state.restaurants.length} places · ${state.pantry.length} kitchen items · ${state.meals.length} meals logged</p>
    <div class="card-actions">
      <button type="button" class="btn" data-action="exportData">Export backup</button>
      <label class="btn">Import backup<input type="file" accept="application/json,.json" data-change="importData" hidden></label>
    </div>
    <div class="card-actions">
      <button type="button" class="btn ghost" data-action="loadSample">Load sample data</button>
      <button type="button" class="btn ghost danger" data-action="eraseAll">Erase everything</button>
    </div>
  </section>

  <section class="card">
    <h2 class="card-title">Save from anywhere</h2>
    <p class="hint">On a computer, drag this to your bookmarks bar. Click it on any recipe, reel or restaurant page to save it to Palate.</p>
    <p><a class="btn sm" href="${bookmarklet}" data-action="bookmarkletHelp">＋ Save to Palate</a></p>
  </section>

  <p class="hint" style="text-align:center;margin-top:24px">Palate · your food memory</p>`;
}

export const forms = {
  settings: (fd) => {
    update((s) => {
      s.settings.cookName = String(fd.get('cookName') || '').trim();
      s.settings.cookPhone = String(fd.get('cookPhone') || '').trim();
      s.settings.lang = String(fd.get('lang') || 'en');
    });
    toast('Saved');
  },
};

export const actions = {
  exportData: () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `palate-backup-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  loadSample: () => {
    if (!isEmpty() && !confirm('Replace everything with sample data? Export a backup first if you want to keep what you have.')) return;
    replaceAll(sampleData());
    location.hash = '#/today';
    toast('Sample data loaded — have a look around');
  },
  eraseAll: () => {
    if (!confirm('Erase all of your Palate data from this browser? This cannot be undone.')) return;
    replaceAll({});
    location.hash = '#/today';
    toast('Everything erased');
  },
  bookmarkletHelp: () => toast('Drag this button to your bookmarks bar'),
};

export const changes = {
  importData: async (el) => {
    const file = el.files?.[0];
    el.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!looksLikeBackup(data)) throw new Error('not a Palate backup');
      if (!confirm(`Replace your current data with “${file.name}”?`)) return;
      replaceAll(data);
      toast('Backup restored');
    } catch (e) {
      alert(`Couldn’t import that file: ${e.message}`);
    }
  },
};
