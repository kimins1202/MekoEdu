import { DomUtils, parseDocument } from "htmlparser2";
import { Element } from "domhandler";

/**
 * Loại câu hỏi Moodle
 */
export type QuestionType = "single" | "multiple" | "unknown";

/**
 * Một đáp án sau khi parse từ HTML Moodle
 */
export interface ParsedAnswer {
  id: string;
  name: string;
  value: string;
  label: string;
  text: string;
}

/**
 * Câu hỏi sau khi parse
 */
export interface ParsedQuestion {
  type: QuestionType;
  questionHtml: string;
  answers: ParsedAnswer[];
}

/**
 * Kiểm tra input có phải "Clear my choice" của Moodle hay không.
 *
 * Moodle tạo thêm một radio đặc biệt:
 * value="-1"
 * id="..._answer-1"
 */
function isClearChoice(input: Element): boolean {
  const id = input.attribs?.id ?? "";
  const className = input.attribs?.class ?? "";

  // Ví dụ:
  // q103:1_answer-1
  if (id.endsWith("_answer-1")) {
    return true;
  }

  // Moodle có thể dùng sr-only
  if (className.includes("sr-only")) {
    return true;
  }

  // Kiểm tra parent có phải vùng clear choice không
  let parent = input.parent;

  while (parent) {
    if (
      parent instanceof Element &&
      parent.attribs?.id?.includes("_clearchoice")
    ) {
      return true;
    }

    parent = parent.parent;
  }

  return false;
}

/**
 * Tìm tất cả input answer thực sự của câu hỏi.
 *
 * Chỉ lấy:
 * - input[type="radio"]
 * - input[type="checkbox"]
 *
 * Không lấy hidden input và Clear my choice.
 */
function getAnswerInputs(document: ReturnType<typeof parseDocument>) {
  return DomUtils.findAll(
    (node) =>
      node instanceof Element &&
      node.name === "input" &&
      (node.attribs?.type === "radio" || node.attribs?.type === "checkbox") &&
      !isClearChoice(node),
    document.children,
  );
}

/**
 * Xác định loại câu hỏi.
 *
 * radio     -> single
 * checkbox  -> multiple
 */
export function detectQuestionType(html: string): QuestionType {
  const document = parseDocument(html);

  const inputs = getAnswerInputs(document);

  const hasCheckbox = inputs.some(
    (input) => input.attribs?.type === "checkbox",
  );

  if (hasCheckbox) {
    return "multiple";
  }

  const hasRadio = inputs.some((input) => input.attribs?.type === "radio");

  if (hasRadio) {
    return "single";
  }

  return "unknown";
}

/**
 * Tìm element chứa label của answer.
 *
 * Moodle thường có:
 *
 * aria-labelledby="q103:1_answer0_label"
 *
 * và:
 *
 * id="q103:1_answer0_label"
 */
function getLabelElement(
  input: Element,
  document: ReturnType<typeof parseDocument>,
): Element | null {
  const labelId = input.attribs?.["aria-labelledby"];

  if (!labelId) {
    return null;
  }

  const labelElement = DomUtils.findOne(
    (node) => node instanceof Element && node.attribs?.id === labelId,
    document.children,
  );

  return labelElement instanceof Element ? labelElement : null;
}

/**
 * Lấy ký hiệu A/B/C/D...
 *
 * Moodle:
 *
 * <span class="answernumber">a. </span>
 *
 * sẽ được chuyển thành:
 *
 * A
 */
function getAnswerLabel(
  input: Element,
  document: ReturnType<typeof parseDocument>,
  index: number,
): string {
  const labelElement = getLabelElement(input, document);

  if (labelElement) {
    const answerNumber = DomUtils.findOne(
      (node) =>
        node instanceof Element &&
        node.attribs?.class?.includes("answernumber"),
      [labelElement],
    );

    if (answerNumber) {
      const text = DomUtils.getText(answerNumber).trim();

      const match = text.match(/^([a-z])\./i);

      if (match) {
        return match[1].toUpperCase();
      }
    }
  }

  // Fallback nếu Moodle không trả answernumber
  return String.fromCharCode(65 + index);
}

/**
 * Lấy nội dung text của đáp án.
 *
 * Ví dụ:
 *
 * <span class="answernumber">a. </span>
 * <div>
 *   <p>Java</p>
 * </div>
 *
 * Kết quả:
 * "Java"
 */
function getAnswerText(
  input: Element,
  document: ReturnType<typeof parseDocument>,
): string {
  const labelElement = getLabelElement(input, document);

  if (!labelElement) {
    return "";
  }

  const text = DomUtils.getText(labelElement);

  // Xóa A. / B. / C. / D.
  return text.replace(/^\s*[a-z]\.\s*/i, "").trim();
}

/**
 * Parse danh sách đáp án
 */
export function parseAnswers(html: string): ParsedAnswer[] {
  const document = parseDocument(html);

  const inputs = getAnswerInputs(document);

  return inputs.map((input, index) => {
    const id = input.attribs?.id ?? `choice-${index}`;

    const name = input.attribs?.name ?? "";

    const value = input.attribs?.value ?? "";

    return {
      id,
      name,
      value,
      label: getAnswerLabel(input, document, index),
      text: getAnswerText(input, document),
    };
  });
}

/**
 * Lấy phần nội dung câu hỏi.
 *
 * Moodle:
 *
 * <div class="qtext">
 *   ...
 * </div>
 */
function getQuestionHtml(html: string): string {
  const document = parseDocument(html);

  const qtext = DomUtils.findOne(
    (node) =>
      node instanceof Element &&
      node.name === "div" &&
      node.attribs?.class?.split(/\s+/).includes("qtext"),
    document.children,
  );

  if (!qtext) {
    return "";
  }

  return DomUtils.getInnerHTML(qtext);
}

/**
 * Parse toàn bộ câu hỏi Moodle.
 */
export function parseMoodleQuestion(html: string): ParsedQuestion {
  return {
    type: detectQuestionType(html),

    questionHtml: getQuestionHtml(html),

    answers: parseAnswers(html),
  };
}
