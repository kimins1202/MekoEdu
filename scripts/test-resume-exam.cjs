const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/resumeExam.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exported });
const { findResumeTarget, selectRequestedAttempt } = exported;
const saved = (overrides = {}) => ({
  userid: 1, quizid: 2, attemptid: 3, pages: { 0: { questions: [], nextpage: -1 } },
  currentPage: 2, submitted: false, submitRequested: false, updatedAt: 100, ...overrides,
});

test('resumes the active server attempt with the locally saved page', () => {
  const target = findResumeTarget(1, 2, [{ id: 3, state: 'inprogress', currentpage: 0 }], [saved()]);
  assert.equal(target.attemptid, 3);
  assert.equal(target.page, 2);
  assert.equal(target.offline, false);
});

test('uses Moodle current page when this device has no saved attempt', () => {
  const target = findResumeTarget(1, 2, [{ id: 4, state: 'inprogress', currentpage: 5 }], []);
  assert.equal(target.page, 5);
  assert.equal(target.attemptid, 4);
});

test('server completion prevents a stale local cache from offering resume', () => {
  assert.equal(findResumeTarget(1, 2, [{ id: 3, state: 'finished' }], [saved()]), null);
  assert.equal(findResumeTarget(1, 2, [{ id: 3, state: 'abandoned' }], [saved()]), null);
  assert.equal(findResumeTarget(1, 2, [], [saved()]), null);
});

test('offline resume is scoped to the account and quiz and requires cached questions', () => {
  const target = findResumeTarget(1, 2, null, [
    saved({ userid: 9, updatedAt: 900 }), saved({ quizid: 9, updatedAt: 900 }),
    saved({ attemptid: 6, pages: {}, updatedAt: 900 }), saved(),
  ]);
  assert.equal(target.attemptid, 3);
  assert.equal(target.offline, true);
  assert.equal(findResumeTarget(1, 2, null, [saved({ submitted: true })]), null);
});

test('queued submissions are labelled separately from editable attempts', () => {
  assert.equal(findResumeTarget(1, 2, null, [saved({ submitRequested: true })]).pendingSubmission, true);
});

test('an explicit resume cannot silently fall back to another attempt or create a new one', () => {
  const attempts = [{ id: 4, state: 'inprogress' }, { id: 3, state: 'finished' }];
  assert.equal(selectRequestedAttempt(attempts, 3).state, 'finished');
  assert.throws(() => selectRequestedAttempt(attempts, 99));
  assert.throws(() => selectRequestedAttempt([{ id: 3, state: 'abandoned' }], 3));
  assert.throws(() => selectRequestedAttempt([{ id: 3, state: 'overdue' }], 3));
});
