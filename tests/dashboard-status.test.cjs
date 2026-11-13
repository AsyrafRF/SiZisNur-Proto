const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const appPath = path.join(__dirname, '..', 'js', 'app.js');
const revisionPath = path.join(__dirname, '..', 'js', 'revision-v5.js');
let source = fs.readFileSync(appPath, 'utf8');
source = source.replace(
  'render();\n})();',
  'window.__SiZisNurTest={navigateRef:navigate,loginRef:login,html:()=>elements.app.innerHTML};\nrender();\n})();'
);
source += '\n' + fs.readFileSync(revisionPath, 'utf8');

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) || null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
const localStorage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
const elements = { app: { innerHTML: '' }, 'modal-root': { innerHTML: '' } };
const document = {
  body: { classList: { toggle() {} } },
  getElementById(id) { return elements[id] || (elements[id] = { innerHTML: '', textContent: '', dataset: {} }); },
  addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return { style: {}, click() {}, remove() {} }; },
};
const listeners = {};
const window = {
  localStorage, sessionStorage,
  crypto: crypto.webcrypto,
  addEventListener(name, callback) { listeners[name] = callback; },
  scrollTo() {}, open() { return null; },
};
const navigator = { onLine: true, userAgent: 'prototype-test' };
const context = {
  window, document, elements, localStorage, sessionStorage, navigator,
  console, Date, Math, JSON, Map, Set,
  Blob: function Blob() {}, URL: {}, FormData: function FormData() {},
  setInterval() {}, clearInterval() {}, Intl, Number, String, Object, Array,
  RegExp, Error, Promise, setTimeout() { return 0; }, clearTimeout() {},
};
vm.createContext(context);
vm.runInContext(source, context, { timeout: 5000 });

const app = window.__SiZisNurTest;
const bridge = window.__SiZisNurBridge;
app.loginRef('US-PTG');
app.navigateRef('dashboard');
const dashboard = app.html();

assert.ok(dashboard.includes('class="hero-aside"'), 'dashboard should group status details in a dedicated aside');
assert.ok(dashboard.includes('ROLE AKTIF'), 'active role should have a clear label');
assert.ok(dashboard.includes('id="hero-connection-state"'), 'connection status should have a dedicated visual state');
assert.ok(dashboard.includes('id="offline-state" role="status" aria-live="polite"'), 'connection status should be announced accessibly');
assert.ok(dashboard.includes('id="sync-mode-state"'), 'local/server mode should be separate from online/offline');
assert.ok(dashboard.includes('id="local-queue-count"'), 'local queue count should be separately displayed');
assert.ok(!dashboard.includes('Antrean lokal: '), 'old compressed inline queue label should be removed');
assert.ok(!dashboard.includes('Online · lokal saja'), 'old combined connection label should be removed');

// Simulate the rendered status elements and verify live updates without a browser DOM.
elements['offline-state'] = { textContent: 'Online' };
elements['hero-connection-state'] = { dataset: { connectionState: 'online' } };
elements['sync-mode-state'] = { textContent: 'Mode lokal · tanpa server' };
elements['local-queue-count'] = { textContent: '0' };
bridge.db.syncQueue.push({ id: 'SQ-UI-ANNUR', tenantId: 'TN-ANNUR' });
bridge.db.syncQueue.push({ id: 'SQ-UI-OTHER', tenantId: 'TN-ALHIKMAH' });
navigator.onLine = false;
listeners.offline();
assert.equal(elements['offline-state'].textContent, 'Offline');
assert.equal(elements['hero-connection-state'].dataset.connectionState, 'offline');
assert.equal(elements['sync-mode-state'].textContent, 'Tersimpan di perangkat ini');
assert.equal(elements['local-queue-count'].textContent, '1', 'queue should count only the active lembaga');

navigator.onLine = true;
listeners.online();
assert.equal(elements['offline-state'].textContent, 'Online');
assert.equal(elements['hero-connection-state'].dataset.connectionState, 'online');
assert.equal(elements['sync-mode-state'].textContent, 'Mode lokal · tanpa server');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
for (const rule of [
  '.hero-aside{', '.hero-connection{', '.hero-queue{',
  '@media(max-width:800px)', '@media(max-width:520px)',
]) assert.ok(css.includes(rule), `responsive dashboard status styling should include ${rule}`);

console.log('PASS — dashboard role, koneksi, dan antrean tersusun rapi; status online/offline dan jumlah antrean lembaga aktif diperbarui secara dinamis');
