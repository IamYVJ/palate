// Installing Palate as a home-screen app: service worker, install prompt, and the "add to home screen" tip.

import { refresh } from './store.js';
import { html, openModal, closeModal, toast } from './ui.js';

const TIP_KEY = 'palate.installTipDismissed';
let deferredPrompt = null; // Chrome/Android's install prompt, saved until the user asks for it

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isTouch = () => matchMedia('(pointer: coarse)').matches;

/** 'installed' | 'prompt' (we can show the browser's install dialog) | 'ios' (manual steps) | 'manual' */
export function installMode() {
  if (isStandalone()) return 'installed';
  if (deferredPrompt) return 'prompt';
  if (isIOS()) return 'ios';
  return 'manual';
}

/** Show the home-screen tip on Today? Only on phones, only when we can actually help, until dismissed. */
export function showInstallTip() {
  if (!isTouch() || !['prompt', 'ios'].includes(installMode())) return false;
  try {
    return !localStorage.getItem(TIP_KEY);
  } catch {
    return true;
  }
}

export function initPwa() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Palate: offline support unavailable', e));
    });
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    refresh();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    refresh();
    toast('Palate is on your home screen');
  });
}

function iosSteps() {
  openModal(html`<div class="modal-body">
    <header class="modal-head"><h2>Add to Home Screen</h2>
      <button type="button" class="icon-btn" data-action="closeModal" aria-label="Close">✕</button></header>
    <ol class="steps">
      <li>Tap the <strong>Share</strong> button <span class="share-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 15V3M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg></span> in Safari’s toolbar.</li>
      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
      <li>Tap <strong>Add</strong>. Palate now opens full screen, like an app, and works offline.</li>
    </ol>
    <p class="notice">On iPhone, the home-screen app keeps its own copy of your data, separate from Safari. If you’ve already added things here, use <strong>Settings → Export backup</strong> first, then <strong>Import backup</strong> inside the app.</p>
    <div class="modal-actions"><span class="spacer"></span><button type="button" class="btn primary" data-action="closeModal">Got it</button></div>
  </div>`);
}

export const actions = {
  install: async () => {
    if (installMode() === 'ios') return iosSteps();
    if (!deferredPrompt) return toast('Use your browser menu → “Install app” or “Add to Home screen”');
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    refresh();
  },
  dismissInstallTip: () => {
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch { /* private mode: it just comes back next time */ }
    closeModal();
    refresh();
  },
};
