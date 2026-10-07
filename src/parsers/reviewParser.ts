import { parse } from "node-html-parser";
import { parseQuestion } from "./questionParser";

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Preserve Moodle's review content without rendering interactive form controls.
export function parseReviewHtml(html: string) {
  const root = parse(html);
  const stateClasses = (root.querySelector(".que")?.getAttribute("class") ?? "").split(/\s+/);
  const state = stateClasses.includes("partiallycorrect") ? "gradedpartial"
    : stateClasses.includes("incorrect") ? "gradedwrong"
    : stateClasses.includes("correct") ? "gradedright" : undefined;
  const parsed = parseQuestion(html);
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
    const value = input?.getAttribute("value") ?? "";
    const item = parsed.dragItems?.find(item => String(item.choice) === value);
    let response = item?.text || (value && value !== "0" ? value : "Chưa trả lời");
    if (parsed.type === "ddmarker" && value) {
      response = value === "0" ? "Chưa trả lời" : `Tọa độ: ${value}`;
    }
    return `<p><strong>Vị trí ${field.place}:</strong> ${escape(response)}</p>`;
  }).join("");

  const feedback = [".specificfeedback", ".generalfeedback", ".rightanswer", ".manualcomment"]
    .map(selector => root.querySelector(selector)?.innerHTML ?? "").filter(Boolean).join("<br>");
  const cleanFeedback = parse(feedback);
  cleanFeedback.querySelectorAll("script, style, .accesshide, .sr-only, .visually-hidden").forEach(node => node.remove());
  return { contentHtml: content.innerHTML + dragResponses, feedbackHtml: cleanFeedback.innerHTML, state };
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
