import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, isUrl, isDownloadRows, explodeDownloads } from '../src/public/js/test-result-view.mjs';

test('isUrl', () => {
  assert.equal(isUrl('https://x.test/a'), true);
  assert.equal(isUrl('nope'), false);
});

test('single-key array of objects → rows', () => {
  const vm = classify({ items: [{ a: 1, b: 2 }, { a: 3 }] });
  assert.equal(vm.kind, 'rows');
  assert.equal(vm.wrapKey, 'items');
  assert.deepEqual(vm.cols, ['a', 'b']);
  assert.equal(vm.total, 2);
  assert.equal(vm.rows.length, 2);
});

test('download rows detected and exploded', () => {
  const rows = [{ quality: '720p', size: '300MB', links: ['u1', 'u2'], hosts: ['h1', 'h2'] }];
  assert.equal(isDownloadRows(rows), true);
  assert.deepEqual(explodeDownloads(rows), [
    { quality: '720p', host: 'h1', size: '300MB', url: 'u1' },
    { quality: '720p', host: 'h2', size: '300MB', url: 'u2' },
  ]);
  const vm = classify({ downloads: rows });
  assert.equal(vm.kind, 'downloads');
  assert.equal(vm.rows.length, 2);
});

test('single-key array of scalars → links', () => {
  const vm = classify({ links: ['https://a.test', 'https://b.test'] });
  assert.equal(vm.kind, 'links');
  assert.equal(vm.wrapKey, 'links');
  assert.equal(vm.total, 2);
});

test('object of fields → fields', () => {
  const vm = classify({ title: 'X', year: 2020, genres: ['a', 'b'] });
  assert.equal(vm.kind, 'fields');
  assert.equal(vm.fields.length, 3);
});

test('ROW_CAP caps shown rows at 50 but reports total', () => {
  const items = Array.from({ length: 60 }, (_, i) => ({ i }));
  const vm = classify({ items });
  assert.equal(vm.rows.length, 50);
  assert.equal(vm.total, 60);
});
