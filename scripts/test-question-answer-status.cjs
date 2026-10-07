const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exported = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/utils/questionAnswerStatus.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: exported });
const { getQuestionAnswerNames, isQuestionAnswered } = exported;

test('select missing words counts the question once even with multiple responses', () => {
  const fields = getQuestionAnswerNames({ selectFields: [{ fieldName: 'q1:1_p1' }, { fieldName: 'q1:1_p2' }] });
  assert.equal(isQuestionAnswered(fields, {}), false);
  assert.equal(isQuestionAnswered(fields, { 'q1:1_p2': '2' }), true);
  assert.equal([fields].filter(names => isQuestionAnswered(names, { 'q1:1_p1': '1', 'q1:1_p2': '2' })).length, 1);
});

test('metadata and answers from another question do not mark a question answered', () => {
  const names = getQuestionAnswerNames({ fieldName: 'q1:1_answer', answerFormatField: 'q1:1_answerformat' });
  assert.equal(isQuestionAnswered(names, { 'q1:1_answerformat': '1', 'q1:2_answer': 'yes', 'q1:1_:sequencecheck': '3' }), false);
  assert.equal(isQuestionAnswered(names, { 'q1:1_answer': '0' }), true);
  assert.equal(isQuestionAnswered(names, { 'q1:1_answer': '  ' }), false);
});

test('deselecting every checkbox restores unanswered status', () => {
  const names = getQuestionAnswerNames({ choices: [{ fieldName: 'q1:1_choice0' }, { fieldName: 'q1:1_choice1' }] });
  assert.equal(isQuestionAnswered(names, { 'q1:1_choice0': '0', 'q1:1_choice1': '0' }), false);
  assert.equal(isQuestionAnswered(names, { 'q1:1_choice1': '1' }), true);
});

test('matching, cloze, ordering and drop fields use their actual response names', () => {
  for (const question of [
    { selectFields: [{ fieldName: 'response' }] },
    { clozeParts: [{ type: 'text' }, { fieldName: 'response' }] },
    { orderingFieldName: 'response' },
    { dropFields: [{ fieldName: 'response' }] },
  ]) {
    assert.equal(isQuestionAnswered(getQuestionAnswerNames(question), { response: '1' }), true);
  }
  assert.equal(isQuestionAnswered(getQuestionAnswerNames({ type: 'description' }), { response: '1' }), false);
});
