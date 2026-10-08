import type { ParsedQuestion } from "@/types/question";

export function isAnswerableQuestion(question: Pick<ParsedQuestion, "type">): boolean {
  return question.type !== "description";
}

export function getQuestionAnswerNames(question: ParsedQuestion): string[] {
  if (!isAnswerableQuestion(question)) return [];
  const names = [
    question.fieldName,
    question.orderingFieldName,
    ...(question.choices ?? []).map((choice) => choice.fieldName),
    ...(question.selectFields ?? []).map((field) => field.fieldName),
    ...(question.clozeParts ?? []).map((part) => part.fieldName),
    ...(question.dropFields ?? []).map((field) => field.fieldName),
  ];
  return [...new Set(names.filter((name): name is string => !!name))];
}

export function isQuestionAnswered(
  answerNames: string[],
  answers: Record<string, string>,
): boolean {
  return answerNames.some((name) => {
    const value = answers[name];
    if (/_choice\d+$/.test(name)) return value === "1";
    return value != null && value.trim() !== "";
  });
}
