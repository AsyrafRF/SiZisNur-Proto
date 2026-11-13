const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const marker = '/* Global UI theme contrast pass';
const start = css.indexOf(marker);
assert.ok(start >= 0, 'global UI theme contrast block must exist');
const section = css.slice(start);

function tokensFor(selector) {
  const startAt = section.indexOf(selector);
  assert.ok(startAt >= 0, `missing theme token block: ${selector}`);
  const open = section.indexOf('{', startAt);
  const close = section.indexOf('}', open);
  assert.ok(open >= 0 && close > open, `invalid theme token block: ${selector}`);
  const body = section.slice(open + 1, close);
  return Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]));
}

const light = tokensFor(':root');
const dark = tokensFor('body.dark');

function luminance(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = rgb.map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

for (const [mode, values] of [['light', light], ['dark', dark]]) {
  for (const prefix of ['--ui-tag-neutral', '--ui-tag-ok', '--ui-tag-warn', '--ui-tag-bad', '--ui-tag-info']) {
    const bg = values[`${prefix}-bg`];
    const ink = values[`${prefix}-ink`];
    assert.ok(bg && ink, `${mode} palette must define ${prefix}`);
    assert.ok(contrast(bg, ink) >= 4.5, `${mode} ${prefix} contrast must meet WCAG AA`);
  }
}

for (const [mode, values] of [['light', light], ['dark', dark]]) {
  assert.ok(contrast(values['--ui-success-bg'], values['--ui-success-ink']) >= 4.5, `${mode} manual outcome must meet WCAG AA`);
  assert.ok(contrast(values['--ui-preview-bg'], values['--ui-preview-ink']) >= 4.5, `${mode} guide preview must meet WCAG AA`);
  assert.ok(contrast(values['--ui-preview-bg'], values['--ui-preview-muted']) >= 4.5, `${mode} guide preview secondary text must meet WCAG AA`);
}

assert.ok(contrast('#142d37', dark['--ui-accent-ink']) >= 4.5, 'dark accent text must meet WCAG AA on app panels');
assert.ok(contrast('#142d37', dark['--ui-label-ink']) >= 4.5, 'dark form labels must meet WCAG AA on app panels');
assert.ok(contrast('#142d37', dark['--ui-danger-ink']) >= 4.5, 'dark danger actions must meet WCAG AA on app panels');
assert.ok(contrast(dark['--ui-step-bg'], dark['--ui-step-ink']) >= 4.5, 'dark tutorial step indicators must meet WCAG AA');

const requiredSelectors = [
  'body.dark .field label',
  'body.dark input:not([type="checkbox"]):not([type="radio"])',
  'body.dark .search',
  'body.dark .btn.danger',
  'body.dark .tag.ok',
  'body.dark .tag.warn',
  'body.dark .tag.bad',
  'body.dark .tag.info',
  'body.dark .progress-track',
  'body.dark .scanner-card',
  'body.dark .volunteer-scan',
  'body.dark .manual-preview-content',
  'body.dark .manual-preview-row b',
  '.manual-outcome',
  'body.dark .manual-step-no'
];
for (const selector of requiredSelectors) {
  assert.ok(section.includes(selector), `missing global dark-mode treatment: ${selector}`);
}
assert.ok(section.includes('color-scheme: dark;'), 'native controls must follow dark color scheme');
assert.ok(section.includes('body.dark .landing-page'), 'approved landing page presentation must remain isolated');

console.log('PASS — komponen UI global memiliki palet Light/Dark, kontras semantik, dan perlindungan landing page');
