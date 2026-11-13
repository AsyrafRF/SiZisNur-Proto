const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
const rootBlock = css.slice(css.lastIndexOf(':root {'));
const darkBlockStart = css.lastIndexOf('body.dark {');
const darkBlockEnd = css.indexOf('}', darkBlockStart);
assert.ok(darkBlockStart >= 0 && darkBlockEnd > darkBlockStart, 'dark theme alert tokens must exist');
const darkBlock = css.slice(darkBlockStart, darkBlockEnd + 1);

function readTokens(block) {
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]));
}
const light = readTokens(rootBlock.slice(0, rootBlock.indexOf('body.dark {')));
const dark = readTokens(darkBlock);

function luminance(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = rgb.map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const variants = [
  ['default', 'alert-default'],
  ['warn', 'alert-warn'],
  ['danger', 'alert-danger'],
  ['ok', 'alert-ok'],
  ['info', 'alert-info'],
  ['light', 'alert-light']
];
for (const [name, prefix] of variants) {
  for (const [mode, tokens] of [['light', light], ['dark', dark]]) {
    const bg = tokens[`--${prefix}-bg`];
    const fg = tokens[`--${prefix}-text`];
    const border = tokens[`--${prefix}-border`];
    assert.ok(bg && fg && border, `${mode} ${name} alert palette must define background, text, and border`);
    assert.ok(contrast(bg, fg) >= 4.5, `${mode} ${name} alert text contrast must be WCAG AA`);
  }
}

for (const [mode, tokens] of [['light', light], ['dark', dark]]) {
  assert.ok(tokens['--notice-bg'] && tokens['--notice-text'], `${mode} default toast palette must exist`);
  assert.ok(contrast(tokens['--notice-bg'], tokens['--notice-text']) >= 4.5, `${mode} default toast text contrast must be WCAG AA`);
  for (const type of ['success', 'info', 'warning', 'error']) {
    const bg = tokens[`--notice-${type}-bg`];
    const fg = tokens['--notice-text'];
    assert.ok(bg && fg, `${mode} ${type} toast palette must exist`);
    assert.ok(contrast(bg, fg) >= 4.5, `${mode} ${type} toast text contrast must be WCAG AA`);
  }
}

for (const selector of [
  '.alert.warn,', '.alert.danger,', '.alert.ok,', '.alert.info {', '.alert.light,',
  '.notice.success {', '.notice.info {', '.notice.warning,', '.notice.error,'
]) {
  assert.ok(css.includes(selector), `global alert/toast selector is missing: ${selector}`);
}
assert.ok(css.includes('color: var(--alert-default-text);'), 'base alert text must be explicit rather than inherited');
assert.ok(css.includes('color: var(--notice-text);'), 'toast text must use an explicit theme token');

console.log('PASS — seluruh varian alert dan toast memiliki kontras minimal WCAG AA pada light/dark mode');
