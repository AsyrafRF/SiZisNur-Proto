const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const revisionJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'revision-v5.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');

const helperMatch = appJs.match(/function paginateRows\(rows, page = 1, pageSize = TABLE_PAGE_SIZE\) \{[\s\S]*?\n\}/);
const rendererMatch = appJs.match(/function renderTableBlock\(id\) \{[\s\S]*?\n\}/);
assert.ok(helperMatch, 'shared paginateRows helper must exist');
assert.ok(rendererMatch, 'shared table renderer must exist');
const paginateRows = vm.runInNewContext(`(${helperMatch[0]})`, { TABLE_PAGE_SIZE: 10 });
const tableRegistry = new Map();
const tablePageState = new Map();
const renderTableBlock = vm.runInNewContext(`(${rendererMatch[0]})`, { TABLE_PAGE_SIZE: 10, tableRegistry, tablePageState, paginateRows });

const rows = Array.from({ length: 23 }, (_, index) => ({ id: index + 1 }));
const first = paginateRows(rows, 1);
assert.equal(first.page, 1);
assert.equal(first.totalPages, 3);
assert.equal(first.startIndex, 0);
assert.equal(first.endIndex, 10);
assert.deepEqual(Array.from(first.rows, (row) => row.id), Array.from({ length: 10 }, (_, i) => i + 1));

const second = paginateRows(rows, 2);
assert.equal(second.startIndex, 10);
assert.equal(second.endIndex, 20);
assert.deepEqual(Array.from(second.rows, (row) => row.id), Array.from({ length: 10 }, (_, i) => i + 11));

const third = paginateRows(rows, 3);
assert.equal(third.rows.length, 3);
assert.deepEqual(Array.from(third.rows, (row) => row.id), [21, 22, 23]);

const clamped = paginateRows(rows, 99);
assert.equal(clamped.page, 3, 'page indexes beyond the end must be clamped');
assert.equal(paginateRows(rows.slice(0, 10), 1).totalPages, 1, '10 rows do not need pagination');
assert.equal(paginateRows(rows.slice(0, 9), 1).rows.length, 9, 'short tables show every row');
assert.equal(paginateRows([], 1).totalPages, 1, 'empty tables remain valid');

// Exercise the shared HTML renderer, not just the page-slicing helper.
tableRegistry.set('test-table', {
  headers: ['Nomor', 'Nama'],
  rows: rows.map((row) => [String(row.id), `Data ${row.id}`]),
  empty: 'Belum ada data'
});
const firstHtml = renderTableBlock('test-table');
const firstBody = firstHtml.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] || '';
assert.equal((firstBody.match(/<tr>/g) || []).length, 10, 'first rendered page must contain 10 body rows');
assert.match(firstHtml, /Menampilkan <b>1–10<\/b> dari <b>23<\/b> data/);
assert.match(firstHtml, /data-table-page="2"/, 'page 2 control must be rendered');
tablePageState.set('test-table', 2);
const secondHtml = renderTableBlock('test-table');
const secondBody = secondHtml.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] || '';
assert.equal((secondBody.match(/<tr>/g) || []).length, 10, 'second rendered page must contain 10 body rows');
assert.match(secondBody, />11<\/td>/, 'second page must begin at record 11');
tableRegistry.set('short-table', { headers: ['Nama'], rows: [['A'], ['B']], empty: 'Kosong' });
assert.doesNotMatch(renderTableBlock('short-table'), /table-pagination/, 'short tables must not render pagination controls');
tableRegistry.set('empty-table', { headers: ['Nama'], rows: [], empty: 'Kosong' });
assert.match(renderTableBlock('empty-table'), /Kosong/, 'empty tables must retain their empty state');

assert.match(appJs, /const TABLE_PAGE_SIZE = 10;/, 'default page size must be ten');
assert.match(appJs, /data-table-component=/, 'table renderer must mark paginated table containers');
assert.match(appJs, /data-table-page=/, 'pagination controls must expose delegated page actions');
assert.match(appJs, /component\.outerHTML = renderTableBlock\(tableId\)/, 'page controls must update only the selected table');
assert.match(css, /\.table-pagination\s*\{/, 'pagination controls must have shared styling');
assert.match(css, /@media\(max-width:700px\)/, 'pagination controls must be responsive');
assert.match(css, /body\.dark[\s\S]*?--ui-tag-info-ink/, 'dark theme tokens must remain present');
assert.match(revisionJs, /records\.map\(\(x\) => \[esc\(new Date\(x\.at\)/, 'audit history must not be truncated before pagination');
assert.doesNotMatch(revisionJs, /records\.slice\(0,\s*150\)/, 'audit page must expose all records to pagination');
assert.doesNotMatch(appJs, /scoped\('audit'\)\.slice\(0,\s*100\)/, 'legacy audit page must not truncate records either');
assert.match(revisionJs, /A\.table\(\['Lembaga', 'Daerah \/ RT', 'Status', 'Aksi'\]/, 'Muzakki Lembaga membership list must use shared pagination');
assert.doesNotMatch(revisionJs, /<div class="table-wrap">\$\{A\.table/, 'table pagination must not be nested inside an extra horizontal wrapper');
assert.match(revisionJs, /const rows = reportRows\(\)[\s\S]*?export-report-pdf/, 'PDF report path must use the full filtered report data');

console.log('PASS — renderer 10 data per halaman, navigasi dan batas halaman, daftar pendek/kosong, Lembaga Muzakki, audit penuh, dan PDF laporan lengkap');
