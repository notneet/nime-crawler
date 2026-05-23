import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serializeStages, cleanStage, cleanAction, cleanPattern } from '../src/public/js/adapter-serialize.mjs';

test('browser action: prunes empties, coerces number, preserves unsurfaced fields', () => {
  const a = {
    __k: 1, __open: true,
    id: '  ', action: 'extract', condition: { exists: '#x' },
    target: { type: 'css', value: '  .sel  ', shadowHost: '#host' },
    value: '42', onError: '',
    options: { as: '', attribute: ' href ', multiple: true, timeout: '500', delay: '', extra: 'keep' },
  };
  assert.deepEqual(cleanAction(a), {
    action: 'extract',
    condition: { exists: '#x' },
    target: { type: 'css', value: '.sel', shadowHost: '#host' },
    value: 42,
    options: { attribute: 'href', multiple: true, timeout: 500, extra: 'keep' },
  });
});

test('browser action: shadowHost-only target keeps host, drops value', () => {
  const a = { action: 'click', target: { type: 'xpath', shadowHost: '#h' }, value: '' };
  assert.deepEqual(cleanAction(a), { action: 'click', target: { type: 'xpath', shadowHost: '#h' } });
});

test('xpath pattern: rebuilds key/patternType/returnType, prunes empty meta/pipes', () => {
  const p = {
    __k: 2, key: 'title', returnType: 'text',
    patterns: ['//h1', ''],
    meta: { multiple: false, isContainer: true, alterPattern: ['//h2', ''] },
    pipes: {
      trim: true, decode: false, merge: 'true',
      replace: [{ from: 'a', to: 'b' }, { from: '', to: '' }],
      custom: [{ type: 'regex', rules: [{ pattern: '\\d+', replacement: '#', flags: 'g' }, { pattern: '', replacement: 'x' }] }],
    },
  };
  assert.deepEqual(cleanPattern(p), {
    key: 'title', patternType: 'xpath', returnType: 'text',
    patterns: ['//h1'],
    meta: { isContainer: true, alterPattern: ['//h2'] },
    pipes: { trim: true, merge: true, replace: [{ from: 'a', to: 'b' }], custom: [{ type: 'regex', rules: [{ pattern: '\\d+', replacement: '#', flags: 'g' }] }] },
  });
});

test('serializeStages: browser + xpath + discover, version/interceptResource', () => {
  const stages = {
    index: {
      engine: 'xpath',
      discover: [{ stage: 'detail', fromKey: 'links' }, { stage: 'detail', fromKey: '' }],
      collect: '  list  ',
      patterns: [{ key: 'links', returnType: 'text', patterns: ['//a/@href'], meta: {}, pipes: {} }],
    },
    detail: {
      engine: 'browser',
      workflow: { version: ' 1.2 ', cloak: true, interceptResource: false, actions: [{ action: 'navigate', value: '' }] },
    },
  };
  assert.deepEqual(serializeStages(stages, ['index', 'detail']), {
    index: {
      engine: 'xpath',
      discover: [{ stage: 'detail', fromKey: 'links' }],
      collect: 'list',
      patterns: [{ key: 'links', patternType: 'xpath', returnType: 'text', patterns: ['//a/@href'] }],
    },
    detail: {
      engine: 'browser',
      workflow: { version: '1.2', cloak: true, actions: [{ action: 'navigate' }] },
    },
  });
});

test('unknown custom pipe type: parses raw json from __cjson', () => {
  const p = { key: 'k', returnType: 'text', patterns: ['//a'], meta: {}, pipes: { custom: [{ type: 'mystery', __cjson: '{"type":"mystery","weight":3}' }] } };
  assert.deepEqual(cleanPattern(p).pipes.custom, [{ type: 'mystery', weight: 3 }]);
});
