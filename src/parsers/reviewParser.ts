import { HTMLElement, parse } from "node-html-parser";

export type ReviewAnswerState = "correct" | "incorrect" | "neutral";

export interface ReviewAnswer {
  text: string;
  state: ReviewAnswerState;
  selected: boolean;
  value?: string;
}

export interface ParsedReviewQuestion {
  questionText: string;
  status: string;
  state?: string;
  mark?: string;
  maxMark?: number;
  correctAnswer?: string;
  answers: ReviewAnswer[];
}

function cleanText(value?: string | null): string {
  if (!value) return "";

  return value
    .replace(/&nbsp;/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value?: string | null): string {
  return cleanText(value)
    .replace(/^[a-zA-Z][.)]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .toLowerCase()
    .trim();
}

function getQuestionText(root: HTMLElement): string {
  const qtext = root.querySelector(".qtext");

  if (!qtext) return "";

  return cleanText(qtext.text);
}

function getCorrectAnswer(root: HTMLElement): string {
  const rightAnswer = root.querySelector(".rightanswer");

  if (!rightAnswer) return "";

  let text = cleanText(rightAnswer.text);

  text = text.replace(/^The correct answer is:\s*/i, "");

  text = text.replace(/^Đáp án đúng là:\s*/i, "");

  return cleanText(text);
}

function getAnswerText(row: HTMLElement, input: HTMLElement): string {
  const inputId = input.getAttribute("id") ?? "";

  if (inputId) {
    const label = row.querySelector(`label[for="${inputId}"]`);

    if (label) {
      return cleanText(label.text);
    }
  }

  const answerNumber = row.querySelector(".answernumber");

  const clone = parse(row.innerHTML);

  clone.querySelectorAll("input").forEach((element) => element.remove());

  clone
    .querySelectorAll(".answernumber")
    .forEach((element) => element.remove());

  clone
    .querySelectorAll('[title="Incorrect"]')
    .forEach((element) => element.remove());

  let text = cleanText(clone.text);

  if (answerNumber) {
    const prefix = cleanText(answerNumber.text);

    if (prefix && text.startsWith(prefix)) {
      text = text.slice(prefix.length).trim();
    }
  }

  return cleanText(text);
}

function parseAnswerRows(
  root: HTMLElement,
  correctAnswer: string,
): ReviewAnswer[] {
  const rows = root.querySelectorAll(".answer > .r0, .answer > .r1");

  const normalizedCorrect = normalizeText(correctAnswer);

  return rows
    .map((row): ReviewAnswer | null => {
      const input = row.querySelector(
        'input[type="radio"], input[type="checkbox"]',
      );

      if (!input) {
        return null;
      }

      const selected = input.hasAttribute("checked");

      const value = input.getAttribute("value") ?? undefined;

      const text = getAnswerText(row, input);

      const normalizedText = normalizeText(text);

      const isCorrect =
        normalizedCorrect !== "" && normalizedText === normalizedCorrect;

      let state: ReviewAnswerState = "neutral";

      if (isCorrect) {
        state = "correct";
      } else if (selected) {
        state = "incorrect";
      }

      return {
        text,
        state,
        selected,
        value,
      };
    })
    .filter(
      (answer): answer is ReviewAnswer =>
        answer !== null && Boolean(answer.text),
    );
}

export function parseReviewQuestion(html: string): ParsedReviewQuestion {
  const root = parse(html);

  const questionText = getQuestionText(root);

  const correctAnswer = getCorrectAnswer(root);

  const stateElement = root.querySelector(".state");

  const status = cleanText(stateElement?.text) || "";

  const gradeElement = root.querySelector(".grade");

  const gradeText = cleanText(gradeElement?.text);

  let mark: string | undefined;
  let maxMark: number | undefined;

  const gradeMatch = gradeText.match(
    /Mark\s+([-\d.,]+)\s+out\s+of\s+([-\d.,]+)/i,
  );

  if (gradeMatch) {
    mark = gradeMatch[1].replace(",", ".");

    maxMark = Number(gradeMatch[2].replace(",", "."));
  }

  const questionElement = root.querySelector(".que");

  const state = questionElement?.classNames
    ?.split(/\s+/)
    .find((className) => className.startsWith("graded"));

  const answers = parseAnswerRows(root, correctAnswer);

  return {
    questionText,

    status,

    state,

    mark,

    maxMark,

    correctAnswer: correctAnswer || undefined,

    answers,
  };
}
