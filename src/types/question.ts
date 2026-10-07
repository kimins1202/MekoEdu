export type QuestionType =
  | "description"
  | "truefalse"
  | "gapselect"
  | "shortanswer"
  | "essay"
  | "randomsamatch"
  | "match"
  | "ddwtos"
  | "ddimageortext"
  | "ddmarker"
  | "numerical"
  | "calculatedmulti"
  | "calculatedsimple"
  | "calculated"
  | "multianswer"
  | "ordering"
  | "multichoice-single"
  | "multichoice-multiple"
  | "unknown";

export interface Choice {
  label: string;
  value: string;
  fieldName?: string;
}

export interface SelectField {
  fieldName: string;
  label: string;
  choices: Choice[];
}

export interface ClozePart {
  type: "text" | "input";
  text?: string;
  fieldName?: string;
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface DragItem {
  id: string;
  choice: number;
  text: string;
}

export interface DropField {
  place: number;
  fieldName: string;
}

export interface ParsedQuestion {
  type: QuestionType;

  text: string;

  html: string;

  qtextHtml?: string;

  audioUrl?: string;

  fieldName?: string;

  choices?: Choice[];

  selectFields?: SelectField[];

  clozeParts?: ClozePart[];

  orderingItems?: OrderingItem[];

  orderingFieldName?: string;

  dragItems?: DragItem[];

  dropFields?: DropField[];

  backgroundImage?: string;

  answerFormatField?: string;

  answerFormatValue?: string;
}
