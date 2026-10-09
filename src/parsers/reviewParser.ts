import { parse } from "node-html-parser";
import { parseQuestion } from "./questionParser";
export { isDescriptionQuestion as isReviewDescription } from "../utils/questionCount";

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type ReviewChoice = {
  key: string;
  text: string;
  html?: string;
  selected: boolean;
  state: "correct" | "incorrect" | "neutral";
};

// Preserve Moodle's review content without rendering interactive form controls.
export function parseReviewHtml(html: string, savedAnswers: Record<string, string> = {}) {
  const root = parse(html);
  const stateClasses = (root.querySelector(".que")?.getAttribute("class") ?? "").split(/\s+/);
  const state = stateClasses.includes("partiallycorrect") ? "gradedpartial"
    : stateClasses.includes("incorrect") ? "gradedwrong"
    : stateClasses.includes("correct") ? "gradedright" : undefined;
  const parsed = parseQuestion(html);
  const normalize = (value: string) => value.replace(/^\s*[a-z][.)]\s*/i, "").replace(/\s+/g, " ").trim().toLowerCase();
  const right = root.querySelector(".rightanswer");
  const rightText = right?.text.trim().replace(/^(?:The correct answers? (?:is|are)|Đáp án đúng(?: là)?)\s*:\s*/i, "").trim() ?? "";
  const correctTexts = [rightText, ...(right?.querySelectorAll("li") ?? []).map(node => node.text)].map(normalize);
  if (parsed.type === "multichoice-multiple") {
    const labels = new Set((parsed.choices ?? []).map(choice => normalize(choice.label)));
    // Moodle also returns multiple correct answers as a comma-separated sentence.
    // Only accept whole option labels; substring matches can colour wrong options.
    const answers = rightText.split(/,\s*|;\s*|\n+/).map(normalize).filter(Boolean);
    if (answers.length > 1 && answers.every(answer => labels.has(answer))) {
      correctTexts.push(...answers);
    }
  }
  const answerGroups: { label: string; choices: ReviewChoice[] }[] = [];
  const controls = root.querySelectorAll("input");
  if (parsed.choices?.length) {
    answerGroups.push({ label: "", choices: parsed.choices.map((choice, index) => {
      const control = controls.find(node => node.getAttribute("name") === choice.fieldName
        && (parsed.type === "multichoice-multiple" || node.getAttribute("value") === choice.value));
      const stored = savedAnswers[choice.fieldName ?? parsed.fieldName ?? ""];
      const selected = control?.hasAttribute("checked") || (stored != null && (parsed.type === "multichoice-multiple" ? stored === "1" : stored === choice.value));
      const row = control?.closest(".r0, .r1");
      const classes = (row?.getAttribute("class") ?? "").split(/\s+/);
      const correct = classes.includes("correct") || correctTexts.includes(normalize(choice.label))
        || (selected && state === "gradedright");
      const wrong = selected && (classes.includes("incorrect") || (!correct && !!rightText) || state === "gradedwrong");
      const label = parse(choice.labelHtml ?? escape(choice.label));
      label.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden").forEach(node => node.remove());
      return { key: `${index}`, text: choice.label, html: label.innerHTML, selected: !!selected, state: correct ? "correct" : wrong ? "incorrect" : "neutral" };
    }) });
  }
  for (const [index, field] of (parsed.selectFields ?? []).entries()) {
    const select = root.querySelectorAll("select").find(node => node.getAttribute("name") === field.fieldName);
    const selectedValue = select?.querySelector("option[selected]")?.getAttribute("value") ?? savedAnswers[field.fieldName];
    const bracketAnswers = [...rightText.matchAll(/\[([^\]]+)\]/g)].map(match => normalize(match[1]));
    const expected = bracketAnswers[index] ?? (parsed.selectFields?.length === 1 ? normalize(rightText) : "");
    answerGroups.push({ label: field.label || `Chỗ trống ${index + 1}`, choices: field.choices.filter(choice => choice.value && choice.value !== "0").map((choice, choiceIndex) => {
      const selected = choice.value === selectedValue;
      const correct = !!expected && normalize(choice.label) === expected || selected && state === "gradedright";
      const classes = (select?.getAttribute("class") ?? "").split(/\s+/);
      return { key: `${field.fieldName}-${choiceIndex}`, text: choice.label, selected,
        state: correct ? "correct" : selected && (classes.includes("incorrect") || !!expected || state === "gradedwrong") ? "incorrect" : "neutral" };
    }) });
  }
  const responses: string[] = [];
  for (const control of root.querySelectorAll("input, select, textarea")) {
    const name = control.getAttribute("name") ?? "";
    const type = control.getAttribute("type") ?? "text";
    const tag = control.tagName.toLowerCase();
    if (type === "hidden" || !name) continue;
    const saved = savedAnswers[name];
    if (type === "radio" || type === "checkbox") {
      const selected = saved != null ? (type === "checkbox" ? saved === "1" : saved === control.getAttribute("value")) : control.hasAttribute("checked");
      if (!selected) continue;
      const id = control.getAttribute("id");
      const label = root.querySelectorAll("label, [data-region=answer-label], [id]").find(node =>
        !!id && (node.getAttribute("for") === id || node.getAttribute("id") === `${id}_label`));
      const choice = parsed.choices?.find(choice => choice.fieldName === name && (type === "checkbox" || choice.value === control.getAttribute("value")));
      responses.push(escape(label?.text.trim() || choice?.label || control.getAttribute("value") || ""));
    } else if (tag === "select") {
      const option = saved != null ? control.querySelectorAll("option").find(option => option.getAttribute("value") === saved)
        : control.querySelector("option[selected]");
      if (option && option.getAttribute("value") && option.getAttribute("value") !== "0") responses.push(escape(option.text.trim()));
    } else {
      const value = saved ?? (tag === "textarea" ? control.text : control.getAttribute("value"));
      if (value?.trim()) responses.push(escape(value).replace(/\n/g, "<br>"));
    }
  }
  if (!responses.length) {
    const answer = root.querySelector(".answer, .response");
    if (answer && !answer.querySelector("input, select, textarea")) {
      const clone = parse(answer.innerHTML);
      clone.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden").forEach(node => node.remove());
      if (clone.text.trim()) responses.push(clone.innerHTML);
    }
  }
  const question = parse(root.querySelector(".qtext")?.innerHTML ?? "");
  question.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden").forEach(node => node.remove());
  question.querySelectorAll("input, select, textarea").forEach(node => node.replaceWith(" ___ "));
  const content = parse((root.querySelector(".formulation") ?? root.querySelector(".qtext"))?.innerHTML ?? "");

  content.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden, .questionflag, .im-feedback").forEach(node => node.remove());
  content.querySelectorAll("select").forEach(select => {
    const selected = select.querySelector("option[selected]") ?? select.querySelector("option");
    const value = selected?.getAttribute("value");
    select.replaceWith(`<strong>[${escape(value && value !== "0" ? selected?.text.trim() ?? "" : "Chưa trả lời")}]</strong>`);
  });
  content.querySelectorAll("textarea").forEach(node => {
    node.replaceWith(`<div><strong>Câu trả lời của bạn:</strong><p>${escape(node.text.trim() || "Chưa trả lời").replace(/\n/g, "<br>")}</p></div>`);
  });
  content.querySelectorAll("input").forEach(input => {
    const type = (input.getAttribute("type") ?? "text").toLowerCase();
    if (type === "hidden") { input.remove(); return; }
    if (type === "radio" || type === "checkbox") {
      input.replaceWith(input.hasAttribute("checked") ? "<strong>☑ Đã chọn: </strong>" : "☐ ");
    } else if (["text", "number", "email"].includes(type)) {
      input.replaceWith(`<strong>[${escape(input.getAttribute("value") || "Chưa trả lời")}]</strong>`);
    } else input.remove();
  });
  content.querySelectorAll("button").forEach(node => node.remove());

  // Drag responses are stored in hidden fields and need explicit text labels.
  const dragResponses = (parsed.dropFields ?? []).map(field => {
    const input = root.querySelectorAll("input").find(node => node.getAttribute("name") === field.fieldName);
    const value = savedAnswers[field.fieldName] ?? input?.getAttribute("value") ?? "";
    const item = parsed.dragItems?.find(item => String(item.choice) === value);
    let response = item?.text || (value && value !== "0" ? value : "Chưa trả lời");
    if (parsed.type === "ddmarker" && value) {
      response = value === "0" ? "Chưa trả lời" : `Tọa độ: ${value}`;
    }
    return `<p><strong>Vị trí ${field.place}:</strong> ${escape(response)}</p>`;
  }).join("");

  const feedback = [".specificfeedback", ".generalfeedback", ".manualcomment"]
    .map(selector => root.querySelector(selector)?.innerHTML ?? "").filter(Boolean).join("<br>");
  const cleanFeedback = parse(feedback);
  cleanFeedback.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden").forEach(node => node.remove());
  const correct = parse(root.querySelector(".rightanswer")?.innerHTML ?? "");
  correct.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden").forEach(node => node.remove());
  return {
    isDescription: parsed.type === "description",
    contentHtml: content.innerHTML + dragResponses,
    questionHtml: question.innerHTML || `<p>${escape(parsed.text)}</p>`,
    selectedAnswerHtml: dragResponses || responses.map((response, index) => `<p>${responses.length > 1 ? `${index + 1}. ` : ""}${response}</p>`).join(""),
    correctAnswerHtml: correct.innerHTML,
    feedbackHtml: cleanFeedback.innerHTML,
    state,
    answerGroups,
  };
}

export function getReviewGrade(question: {
  html: string; state?: string; stateclass?: string; mark?: string | number | null; maxmark?: number;
}): "correct" | "partial" | "incorrect" | "ungraded" {
  const state = question.state || question.stateclass || parseReviewHtml(question.html).state;
  if (["needsgrading", "notyetgraded", "gaveup", "todo", "complete", "invalid"].includes(state ?? "")) {
    return state === "gaveup" ? "incorrect" : "ungraded";
  }
  if (["gradedright", "mangrright", "correct"].includes(state ?? "")) return "correct";
  if (["gradedpartial", "mangrpartial", "partiallycorrect"].includes(state ?? "")) return "partial";
  if (["gradedwrong", "mangrwrong", "incorrect", "notanswered"].includes(state ?? "")) return "incorrect";
  const mark = question.mark == null || question.mark === "" ? NaN : Number(question.mark);
  const max = Number(question.maxmark);
  if (Number.isFinite(mark) && max > 0) return mark >= max ? "correct" : mark > 0 ? "partial" : "incorrect";
  return "ungraded";
}
