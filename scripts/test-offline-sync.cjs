const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => dependencies[name], Date, Set, Map });
  return exports;
}
const context = { userid: 1, quizid: 2, attemptid: 3 };
const offlineError = () => Object.assign(new Error('offline'), { isAxiosError: true });
function setup(data = new Map([['userid', '1'], ['wstoken', 'test']])) {
  let diskError = false;
  const storage = {
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => { if (diskError) throw Error('disk full'); data.set(key, value); },
    getAllKeys: async () => [...data.keys()],
    multiGet: async (keys) => keys.map((key) => [key, data.get(key) ?? null]),
  };
  const api = {
    saveQuizAttempt: async () => ({ status: true }),
    getUserAttempts: async () => ({ attempts: [{ id: 3, state: 'inprogress' }] }),
    processQuizAttempt: async () => ({ state: 'finished' }),
  };
  const store = load('src/services/examStorageService.ts', { '@react-native-async-storage/async-storage': storage });
  const sync = load('src/services/syncService.ts', {
    '@react-native-async-storage/async-storage': storage, '@/api/quizApi': api, './examStorageService': store,
  });
  return { data, api, store, sync, failDisk: () => { diskError = true; } };
}

test('offline answers persist Pending across restart then become Synced after acknowledgement', async () => {
  const first = setup();
  first.api.saveQuizAttempt = async () => { throw offlineError(); };
  await first.store.queueExamAnswers(context, { q1: 'A' });
  await first.sync.syncExam(context);
  assert.equal((await first.store.readOfflineExam(context)).status, 'Pending');
  const reopened = setup(first.data);
  let sent;
  reopened.api.saveQuizAttempt = async (_, data) => { sent = data; return { status: true }; };
  await reopened.sync.syncPendingExams();
  assert.equal(sent[0].value, 'A');
  assert.equal((await reopened.store.readOfflineExam(context)).status, 'Synced');
});

test('old in-flight acknowledgement cannot mark newer edits Synced; latest answers are sent next', async () => {
  const h = setup();
  let release, started;
  const ready = new Promise((resolve) => { started = resolve; });
  const calls = [];
  h.api.saveQuizAttempt = async (_, data) => {
    calls.push(data[0].value);
    if (calls.length === 1) { started(); await new Promise((resolve) => { release = resolve; }); }
    return { status: true };
  };
  await h.store.queueExamAnswers(context, { q1: 'A' });
  const pending = h.sync.syncExam(context);
  await ready;
  await h.store.queueExamAnswers(context, { q1: 'B' });
  assert.equal(h.sync.syncExam(context), pending);
  release(); await pending;
  assert.deepEqual(calls, ['A', 'B']);
  assert.equal((await h.store.readOfflineExam(context)).status, 'Synced');
});

test('server errors retain answers as Failed until explicit retry', async () => {
  const h = setup();
  let calls = 0;
  h.api.saveQuizAttempt = async () => { calls++; throw Error('rejected'); };
  await h.store.queueExamAnswers(context, { q1: 'C' });
  await h.sync.syncExam(context);
  const failed = await h.store.readOfflineExam(context);
  assert.equal(failed.status, 'Failed');
  assert.equal(failed.answers.q1, 'C');
  await h.sync.syncPendingExams();
  assert.equal(calls, 1);
  h.api.saveQuizAttempt = async () => ({ status: true });
  await h.sync.syncExam(context, true);
  assert.equal((await h.store.readOfflineExam(context)).status, 'Synced');
});

test('lost submit response is reconciled after restart without submitting twice', async () => {
  const h = setup();
  let submissions = 0;
  h.api.processQuizAttempt = async () => { submissions++; throw offlineError(); };
  await h.store.queueExamAnswers(context, { q1: 'A' }, true);
  await h.sync.syncExam(context);
  assert.equal((await h.store.readOfflineExam(context)).submitted, false);
  const reopened = setup(h.data);
  reopened.api.getUserAttempts = async () => ({ attempts: [{ id: 3, state: 'finished' }] });
  reopened.api.processQuizAttempt = async () => { submissions++; };
  await reopened.sync.syncPendingExams();
  assert.equal(submissions, 1);
  assert.equal((await reopened.store.readOfflineExam(context)).submitted, true);
});

test('does not sync another account and does not overwrite frozen submitted answers', async () => {
  const h = setup();
  await h.store.queueExamAnswers(context, { q1: 'A' }, true);
  await h.store.queueExamAnswers(context, { q1: 'B' });
  assert.equal((await h.store.readOfflineExam(context)).answers.q1, 'A');
  await h.store.queueExamAnswers(context, { q1: 'C' }, true);
  assert.equal((await h.store.readOfflineExam(context)).answers.q1, 'A');
  h.data.set('userid', '2');
  h.api.processQuizAttempt = async () => { assert.fail('wrong account'); };
  await h.sync.syncExam(context);
  assert.equal((await h.store.readOfflineExam(context)).status, 'Pending');
  assert.equal((await h.store.listOfflineExams(2)).length, 0);
});

test('storage failure is surfaced and never sends unpersisted answers', async () => {
  const h = setup();
  h.failDisk();
  await assert.rejects(h.store.queueExamAnswers(context, { q1: 'A' }));
  h.api.saveQuizAttempt = async () => { assert.fail('not durable'); };
  await h.sync.syncExam(context);
});

test('page caching and rapid edits preserve both metadata and the latest answer after restart', async () => {
  const h = setup();
  await Promise.all([
    h.store.queueExamAnswers(context, { q1: 'A' }),
    h.store.updateOfflineExam(context, (exam) => ({ ...exam, deadline: 123456, pages: { 0: { questions: [{ slot: 1 }], nextpage: 1 } } })),
    h.store.queueExamAnswers(context, { q1: 'B', q2: 'C' }),
  ]);
  const reopened = setup(h.data);
  const exam = await reopened.store.readOfflineExam(context);
  assert.equal(exam.answers.q1, 'B');
  assert.equal(exam.answers.q2, 'C');
  assert.equal(exam.deadline, 123456);
  assert.equal(exam.pages[0].questions[0].slot, 1);
  assert.equal(exam.status, 'Pending');
});
