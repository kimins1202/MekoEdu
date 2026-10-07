const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(path) {
  const exported = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports: exported, require: name => name === './questionParser' ? load('src/parsers/questionParser.ts') : require(name), console });
  return exported;
}
const { parseReviewHtml, getReviewGrade } = load('src/parsers/reviewParser.ts');
const wrap = (type, content, feedback = '') => `<div class="que ${type} incorrect"><div class="info">Question 1 Not answered</div><div class="formulation">${content}</div><div class="outcome">${feedback}</div><script>// unwanted</script></div>`;

test('all correct checkbox answers turn green including an unselected correct answer', () => {
  const html = wrap('multichoice', '<div class="qtext">Multiple answers</div><div class="answer">' +
    ['2', '3', '1', '12'].map((text, index) => `<div class="r${index % 2}"><input type="checkbox" name="q8:1_choice${index}" id="choice${index}" value="1" ${index < 2 ? 'checked' : ''}><label for="choice${index}">${text}</label></div>`).join('') + '</div>',
    '<div class="rightanswer">The correct answers are: 1, 2</div>');
  const choices = parseReviewHtml(html).answerGroups[0].choices;
  assert.equal(choices[0].state, 'correct');
  assert.equal(choices[1].state, 'incorrect');
  assert.equal(choices[2].state, 'correct');
  assert.equal(choices[2].selected, false);
  assert.equal(choices[3].state, 'neutral');
});

test('all radio options are shown with selected wrong red and exact correct green', () => {
  const result = parseReviewHtml(wrap('multichoice', '<div class="qtext">Choose</div><div class="answer"><div class="r0 incorrect"><input type="radio" name="q8:1_answer" id="one" value="0" checked><label for="one">a. 1</label></div><div class="r1"><input type="radio" name="q8:1_answer" id="two" value="1"><label for="two">b. 3</label></div><div class="r0"><input type="radio" name="q8:1_answer" id="three" value="2"><label for="three">c. 30</label></div></div>', '<div class="rightanswer">The correct answer is: 3</div>'));
  const choices = result.answerGroups[0].choices;
  assert.equal(choices.length, 3);
  assert.equal(choices[0].selected, true);
  assert.equal(choices[0].state, 'incorrect');
  assert.equal(choices[1].state, 'correct');
  assert.equal(choices[2].state, 'neutral');
});

test('gapselect exposes all options and marks the expected word green', () => {
  const result = parseReviewHtml(wrap('gapselect', '<div class="qtext">HTML <select name="q8:1_p1"><option value="0">Choose</option><option value="1" selected>wrong</option><option value="2">markup</option></select></div>', '<div class="rightanswer">The correct answer is: HTML [markup]</div>'));
  const choices = result.answerGroups[0].choices;
  assert.equal(choices.length, 2);
  assert.equal(choices[0].state, 'incorrect');
  assert.equal(choices[0].selected, true);
  assert.equal(choices[1].state, 'correct');
});

test('gap select review shows only the selected answer and preserves the whole nested question', () => {
  const result = parseReviewHtml(wrap('gapselect', '<div class="qtext"><p>HTML là <span class="accesshide">Blank 1 Question 1</span><select name="q1:1_p1"><option value="0">Choose</option><option value="1" selected>đánh dấu</option><option value="2">aaa</option></select>.</p><p>Second paragraph</p></div>', '<div class="specificfeedback">Incorrect</div><div class="rightanswer"><p>The correct answer is: <b>đánh dấu</b></p></div>'));
  assert.match(result.contentHtml, /đánh dấu/);
  assert.match(result.contentHtml, /Second paragraph/);
  assert.doesNotMatch(result.contentHtml, /aaa|Blank 1|Question 1|script|select/);
  assert.match(result.correctAnswerHtml, /The correct answer/);
  assert.doesNotMatch(result.feedbackHtml, /The correct answer/);
  assert.match(result.selectedAnswerHtml, /đánh dấu/);
  assert.doesNotMatch(result.questionHtml, /đánh dấu|aaa/);
  assert.equal(result.state, 'gradedwrong');
});

test('response outside formulation is displayed separately from question and correct answer', () => {
  const result = parseReviewHtml('<div class="que shortanswer correct"><div class="formulation"><div class="qtext">moshi moshi?</div></div><div class="answer"><input name="q55:2_answer" value="yes" readonly></div><div class="rightanswer">The correct answer is: yes</div></div>');
  assert.match(result.questionHtml, /moshi moshi/);
  assert.match(result.selectedAnswerHtml, /yes/);
  assert.match(result.correctAnswerHtml, /yes/);
  assert.doesNotMatch(result.questionHtml, /The correct answer/);
});

test('radio, checkbox and truefalse reviews preserve the selected options without guessing correct answers', () => {
  for (const type of ['multichoice', 'truefalse', 'calculatedmulti']) {
    for (const control of ['radio', 'checkbox']) {
      const result = parseReviewHtml(wrap(type, `<div class="qtext">Prompt</div><div class="answer"><input type="${control}" checked name="q1:1_answer" value="0"><label>Option A</label><input type="${control}" name="q1:1_choice1" value="1"><label>Option B</label></div>`));
      assert.match(result.contentHtml, /☑ Đã chọn/);
      assert.match(result.contentHtml, /Option A/);
      assert.match(result.contentHtml, /Option B/);
      assert.doesNotMatch(result.contentHtml, /<input/);
    }
  }
});

test('text, numeric, essay, matching and cloze responses remain visible', () => {
  for (const type of ['shortanswer', 'numerical', 'calculated', 'calculatedsimple', 'multianswer']) {
    const result = parseReviewHtml(wrap(type, '<div class="qtext">Prompt <input type="text" name="q1:1_answer" value="0"></div>'));
    assert.match(result.contentHtml, /\[0\]/);
  }
  assert.match(parseReviewHtml(wrap('essay', '<textarea name="q1:1_answer">First\nSecond</textarea>')).contentHtml, /First<br>Second/);
  for (const type of ['match', 'randomsamatch']) {
    assert.match(parseReviewHtml(wrap(type, '<table><tr><td>Item</td><td><select name="q1:1_sub0"><option value="0">Choose</option><option selected value="1">Match</option></select></td></tr></table>')).contentHtml, /\[Match\]/);
  }
});

test('ordering and description keep their formatted content and scripts are omitted', () => {
  const result = parseReviewHtml(wrap('ordering', '<div class="qtext"><img src="https://example.com/image.png"><p>Prompt</p></div><ol><li>First</li><li>Second</li></ol><script>bad()</script>'));
  assert.match(result.contentHtml, /<ol>/);
  assert.match(result.contentHtml, /<img/);
  assert.doesNotMatch(result.contentHtml, /bad\(\)/);
  assert.match(parseReviewHtml(wrap('description', '<div class="qtext"><p>Instructions</p></div>')).contentHtml, /Instructions/);
});

test('drag text responses stored as hidden fields are labelled', () => {
  const result = parseReviewHtml(wrap('ddwtos', '<div class="qtext">Prompt</div><div class="draghomes"><div class="draghome" data-choice="1">Word</div></div><input type="hidden" name="q1:1_p1" value="1">'));
  assert.match(result.contentHtml, /Vị trí 1/);
  assert.match(result.contentHtml, /Word/);
  assert.doesNotMatch(result.contentHtml, /<input/);
});

test('grade counters use server states, zero marks and pending manual grading consistently', () => {
  assert.equal(getReviewGrade({ html: wrap('gapselect', ''), maxmark: 1 }), 'incorrect');
  assert.equal(getReviewGrade({ html: '', stateclass: 'correct' }), 'correct');
  assert.equal(getReviewGrade({ html: '', mark: 0, maxmark: 1 }), 'incorrect');
  assert.equal(getReviewGrade({ html: '', mark: '0.5', maxmark: 1 }), 'partial');
  assert.equal(getReviewGrade({ html: '', state: 'needsgrading', mark: 0, maxmark: 1 }), 'ungraded');
  assert.equal(getReviewGrade({ html: '', maxmark: 1 }), 'ungraded');
});

test('image drag and marker reviews retain backgrounds and saved positions', () => {
  for (const [type, suffix, value] of [['ddimageortext', 'p', '1'], ['ddmarker', 'c', '120,80;']]) {
    const result = parseReviewHtml(wrap(type, `<div class="qtext">Place items</div><img class="dropbackground" src="https://example.com/background.png"><div class="draghomes"><div class="draghome" data-choice="1">Marker</div></div><input type="hidden" name="q1:1_${suffix}1" value="${value}">`));
    assert.match(result.contentHtml, /background.png/);
    assert.match(result.contentHtml, /Vị trí 1/);
    assert.match(result.contentHtml, type === 'ddmarker' ? /120,80/ : /Marker/);
  }
});
