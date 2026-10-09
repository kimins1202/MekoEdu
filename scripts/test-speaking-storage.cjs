const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup() {
  const disk = new Map();
  const files = new Map([['file://ok.m4a', 42], ['file://empty.m4a', 0]]);
  const storage = { getItem: async k => disk.get(k) ?? null, setItem: async (k,v) => disk.set(k,v), getAllKeys: async () => [...disk.keys()], multiGet: async keys => keys.map(k => [k,disk.get(k)]) };
  let calls = 0;
  const api = { getAttemptData: async () => { calls++; return { questions: [{ slot: 1, html: 'q55:1_recording', responsefileareas: [{ area: 'recording', files: [{ filename: 'one.m4a', fileurl: 'https://example.test/one.m4a' }] }] }, { slot: 2, html: 'q55:2_recording' }] }; } };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/services/speakingStorageService.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, Date, Map, require: name => ({ '@react-native-async-storage/async-storage': storage, 'expo-file-system': { File: class { constructor(uri) { this.exists = files.has(uri); this.size = files.get(uri); } } }, '../api/quizApi': api, '../parsers/questionParser': { parseQuestion: html => ({ fieldName: html }) } })[name] });
  return { service: exports, disk, calls: () => calls };
}
test('recordings are isolated by user, attempt and answer field across reload', async () => {
  const { service: s } = setup();
  await s.writeSpeaking(1, { attemptId: 3, fieldName: 'q55:1_recording', audioUri: 'file://ok.m4a', uploaded: false, updatedAt: 1 });
  assert.equal((await s.readSpeaking(1,3,'q55:1_recording')).audioUri, 'file://ok.m4a');
  assert.equal(await s.readSpeaking(2,3,'q55:1_recording'), null);
  assert.equal(await s.readSpeaking(1,4,'q55:1_recording'), null);
  assert.equal(await s.readSpeaking(1,3,'q55:2_recording'), null);
});
test('missing, empty and remote URIs cannot be restored as local recordings', () => {
  const { service: s } = setup();
  assert.equal(s.validLocalRecording('file://ok.m4a'), 'file://ok.m4a');
  for (const uri of ['file://missing.m4a','file://empty.m4a','https://example.test/one.m4a',null]) assert.equal(s.validLocalRecording(uri), null);
});
test('response extraction accepts supported recordings and rejects prompt areas and invalid URLs', () => {
  const { service: s } = setup();
  for (const ext of ['m4a','mp3','ogg']) assert.equal(s.responseRecordingUrl({ responsefileareas: [{ area: 'recording', files: [{ filename: 'one.'+ext, fileurl: 'https://example.test/one.'+ext+'?x=1' }] }] }), 'https://example.test/one.'+ext+'?x=1');
  assert.equal(s.responseRecordingUrl({ responsefileareas: [{ area: 'question', files: [{ filename: 'prompt.m4a', fileurl: 'https://example.test/prompt.m4a' }] }] }), null);
  assert.equal(s.responseRecordingUrl({ responsefileareas: [{ area: 'recording', files: [{ filename: 'one.m4a', fileurl: 'javascript:bad' }] }] }), null);
});
test('fresh reads select exact slot and field and coalesce simultaneous page requests', async () => {
  const { service: s, calls } = setup();
  const [one,two] = await Promise.all([s.fetchSpeakingQuestion(3,0,'q55:1_recording'),s.fetchSpeakingQuestion(3,0,'q55:2_recording')]);
  assert.equal(one.slot,1); assert.equal(two.slot,2); assert.equal(calls(),1);
  await assert.rejects(s.fetchSpeakingQuestion(3,0,'q66:1_recording'));
});
test('pending recordings block submission only for their own account and attempt', async () => {
  const { service: s } = setup();
  await s.writeSpeaking(1,{ attemptId: 3, fieldName: 'q55:1_recording', audioUri: null, uploaded: false, updatedAt: 1 });
  await assert.rejects(s.assertSpeakingReady(1,3));
  await s.assertSpeakingReady(2,3); await s.assertSpeakingReady(1,4);
  await s.writeSpeaking(1,{ attemptId: 3, fieldName: 'q55:1_recording', audioUri: null, uploaded: true, updatedAt: 2 });
  await s.assertSpeakingReady(1,3);
});
