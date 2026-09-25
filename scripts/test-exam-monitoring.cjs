const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name], Date });
  return exports;
}
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('concurrent events persist in order, isolate attempts, and recover after storage failure', async () => {
  const data = new Map();
  let fail = false;
  const service = load('src/services/monitoringService.ts', {
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => data.get(key),
      setItem: async (key, value) => { if (fail) throw Error('disk'); data.set(key, value); },
    },
  });
  const context = { userid: 1, quizid: 2, attemptid: 3 };
  await Promise.all(['EXAM_OPEN', 'APP_BACKGROUND', 'APP_FOREGROUND'].map((event) => service.recordMonitoringEvent(context, event)));
  const events = await service.readMonitoringEvents(context);
  assert.equal(events.length, 3);
  assert.equal(events[1].event, 'APP_BACKGROUND');
  assert.equal((await service.readMonitoringEvents({ ...context, attemptid: 4 })).length, 0);
  fail = true;
  await assert.rejects(service.recordMonitoringEvent(context, 'APP_BACKGROUND'));
  fail = false;
  await service.recordMonitoringEvent(context, 'EXAM_SUBMIT');
  assert.equal((await service.readMonitoringEvents(context)).length, 4);
});

test('background transitions count once, alerts do not count, and cleanup releases protection', async () => {
  let listener, cleanup;
  const events = [], nativeCalls = [], alerts = [];
  const hook = load('src/hooks/useExamMonitoring.ts', {
    react: {
      useState: (value) => [value, () => {}],
      useRef: (value) => ({ current: value }),
      useEffect: (effect) => { cleanup = effect(); },
    },
    'react-native': {
      Platform: { OS: 'ios' }, Alert: { alert: (...args) => alerts.push(args) },
      AppState: { currentState: 'active', addEventListener: (_, callback) => {
        listener = callback; return { remove: () => nativeCalls.push('remove') };
      } },
    },
    'expo-screen-capture': {
      isAvailableAsync: async () => true,
      preventScreenCaptureAsync: async () => nativeCalls.push('block'),
      allowScreenCaptureAsync: async () => nativeCalls.push('allow'),
      enableAppSwitcherProtectionAsync: async () => nativeCalls.push('blur'),
      disableAppSwitcherProtectionAsync: async () => nativeCalls.push('unblur'),
    },
    '@/services/monitoringService': {
      readMonitoringEvents: async () => [],
      recordMonitoringEvent: async (_, event) => { events.push(event); return []; },
    },
  }).default;
  const monitoring = hook({ userid: 1, quizid: 2, attemptid: 3 }, true);
  await tick();
  listener('inactive'); listener('active');
  assert.equal(alerts.length, 0);
  listener('inactive'); listener('background'); listener('background'); listener('active');
  assert.equal(events.filter((event) => event === 'APP_BACKGROUND').length, 1);
  assert.equal(alerts.length, 1);
  monitoring.complete();
  listener('background');
  assert.equal(events.filter((event) => event === 'APP_BACKGROUND').length, 1);
  cleanup(); await tick();
  assert.deepEqual(nativeCalls, ['block', 'blur', 'remove', 'allow', 'unblur']);
  assert.equal(events.at(-1), 'EXAM_SUBMIT');
});
