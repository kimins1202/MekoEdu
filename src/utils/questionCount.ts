import { parse } from "node-html-parser";

export type CountableQuestion = {
  type?: string;
  html?: string;
};

export function isDescriptionQuestion(question: CountableQuestion): boolean {
  if (question.type === "description") return true;
  const classes = parse(question.html ?? "").querySelector(".que")?.getAttribute("class") ?? "";
  return classes.split(/\s+/).includes("description");
}

export function countQuestions(questions: readonly CountableQuestion[]): number {
  return questions.filter(question => !isDescriptionQuestion(question)).length;
}
