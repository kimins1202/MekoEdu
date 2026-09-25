const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  let now = 100000, tick, onState, cleanup, value, cleared = false, removed = false;
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/hooks/useExamCountdown.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(code, {
    exports, Date: { now: () => now },
    setInterval: (callback) => { tick = callback; return 1; },
    clearInterval: () => { cleared = true; },
    require: (name) => name === 'react' ? {
      useState: (initial) => { value = initial(); return [value, (next) => { value = next; }]; },
      useEffect: (effect) => { cleanup = effect(); },
    } : { AppState: { addEventListener: (_, callback) => {
      onState = callback; return { remove: () => { removed = true; } };
    } } },
  });
  return {
    exports, setNow: (next) => { now = next; }, tick: () => tick(),
    resume: () => onState('active'), cleanup: () => cleanup(),
    value: () => value, disposed: () => cleared && removed,
  };
}

test('counts from absolute deadline, rounds up, clamps at zero, and supports unlimited attempts', () => {
  const { remainingExamSeconds } = setup().exports;
  assert.equal(remainingExamSeconds(160000, 100000), 60);
  assert.equal(remainingExamSeconds(160000, 159001), 1);
  assert.equal(remainingExamSeconds(160000, 160000), 0);
  assert.equal(remainingExamSeconds(160000, 200000), 0);
  assert.equal(remainingExamSeconds(null, 200000), null);
});

test('resuming after suspended intervals catches up immediately and releases subscriptions', () => {
  const harness = setup();
  harness.exports.default(160000, true);
  assert.equal(harness.value(), 60);
  harness.setNow(145000); harness.resume();
  assert.equal(harness.value(), 15);
  harness.setNow(170000); harness.tick();
  assert.equal(harness.value(), 0);
  harness.cleanup();
  assert.equal(harness.disposed(), true);
});

test('reopening an attempt uses its original deadline instead of restarting the time limit', () => {
  const harness = setup();
  harness.setNow(155000);
  harness.exports.default(160000, true);
  assert.equal(harness.value(), 5);
  harness.cleanup();
});
