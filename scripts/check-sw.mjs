// Checks on the service worker. No dependencies:
//
//     node scripts/check-sw.mjs

import { readFileSync } from 'node:fs';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
let failed = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!cond) failed++;
};

// The analytics beacon must never be cached: a beacon answered from cache records nothing.
ok(!/gc\.zgo\.at|goatcounter/.test(sw.replace(/\/\/[^\n]*/g, '')),
  'the analytics beacon is not routed or precached by the worker');

process.exit(failed ? 1 : 0);
