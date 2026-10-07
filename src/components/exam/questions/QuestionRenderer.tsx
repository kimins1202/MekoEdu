import { StyleSheet, Text, View } from "react-native";

import { ParsedQuestion } from "../../../types/question";

import AudioPlayer from "./AudioPlayer";
import DescriptionQuestion from "./DescriptionQuestion";
import DragDropImageQuestion from "./DragDropImageQuestion";
import DragDropTextQuestion from "./DragDropTextQuestion";
import DragMarkerQuestion from "./DragMarkerQuestion";
import EssayQuestion from "./EssayQuestion";
import MatchingQuestion from "./MatchingQuestion";
import MultiAnswerQuestion from "./MultiAnswerQuestion";
import MultipleChoiceQuestion from "./MultipleChoiceQuestion";
import NumericalQuestion from "./NumericalQuestion";
import OrderingQuestion from "./OrderingQuestion";
import SelectMissingWordsQuestion from "./SelectMissingWordsQuestion";
import ShortAnswerQuestion from "./ShortAnswerQuestion";
import SingleChoiceQuestion from "./SingleChoiceQuestion";

import { getMoodleFileUrl } from "../../../utils/moodleFile";

import COLORS from "../../../constants/colors";

interface Props {
  question: ParsedQuestion;
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
  token?: string;
}

export default function QuestionRenderer({
  question,
  answers,
  setAnswer,
  token,
}: Props) {
  switch (question.type) {
    case "description":
      return <DescriptionQuestion question={question.text} />;

    case "multichoice-single":
    case "truefalse":
    case "calculatedmulti":
      return (
        <View>
          {question.audioUrl && (
            <AudioPlayer uri={getMoodleFileUrl(question.audioUrl, token)} />
          )}

          <SingleChoiceQuestion
            choices={question.choices ?? []}
            value={question.fieldName ? answers[question.fieldName] : undefined}
            onChange={(value) => {
              if (!question.fieldName) return;

              setAnswer(question.fieldName, value);
            }}
          />
        </View>
      );

    case "multichoice-multiple":
      return (
        <MultipleChoiceQuestion
          choices={question.choices ?? []}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    case "shortanswer":
      return (
        <ShortAnswerQuestion
          value={question.fieldName ? (answers[question.fieldName] ?? "") : ""}
          onChange={(value) => {
            if (!question.fieldName) return;

            setAnswer(question.fieldName, value);
          }}
        />
      );

    case "numerical":
    case "calculated":
    case "calculatedsimple":
      return (
        <NumericalQuestion
          value={question.fieldName ? (answers[question.fieldName] ?? "") : ""}
          onChange={(value) => {
            if (!question.fieldName) return;

            setAnswer(question.fieldName, value);
          }}
        />
      );

    case "essay":
      return (
        <EssayQuestion
          value={question.fieldName ? (answers[question.fieldName] ?? "") : ""}
          onChange={(value) => {
            if (!question.fieldName) return;

            setAnswer(question.fieldName, value);
          }}
        />
      );

    case "gapselect":
      return (
        <SelectMissingWordsQuestion
          question={question.text}
          qtextHtml={question.qtextHtml}
          fields={question.selectFields ?? []}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    case "match":
    case "randomsamatch":
      return (
        <MatchingQuestion
          fields={question.selectFields ?? []}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    case "multianswer":
      return (
        <MultiAnswerQuestion
          parts={question.clozeParts ?? []}
          qtextHtml={question.qtextHtml}
          rawHtml={question.html}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    case "ordering":
      return (
        <OrderingQuestion
          items={question.orderingItems ?? []}
          fieldName={question.orderingFieldName ?? ""}
          setAnswer={setAnswer}
        />
      );

    case "ddwtos":
      return (
        <DragDropTextQuestion
          qtextHtml={question.qtextHtml}
          items={question.dragItems ?? []}
          fields={question.dropFields ?? []}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    case "ddimageortext":
      return (
        <DragDropImageQuestion
          image={question.backgroundImage}
          token={token}
          items={question.dragItems ?? []}
          fields={question.dropFields ?? []}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    case "ddmarker":
      return (
        <DragMarkerQuestion
          image={question.backgroundImage}
          rawHtml={question.html}
          token={token}
          items={question.dragItems ?? []}
          fields={question.dropFields ?? []}
          answers={answers}
          setAnswer={setAnswer}
        />
      );

    default:
      return (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>Chưa hỗ trợ loại câu hỏi</Text>

          <Text style={styles.type}>{question.type}</Text>

          {!!question.text && (
            <Text style={styles.fallbackText}>{question.text}</Text>
          )}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  error: {
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },

  type: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontFamily: "monospace",
  },

  fallbackText: {
    lineHeight: 22,
    fontSize: 14,
    color: COLORS.text,
  },
});
