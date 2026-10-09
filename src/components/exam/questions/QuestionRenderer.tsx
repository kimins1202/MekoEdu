import { StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
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
import RecordRTCQuestion from "./RecordRTCQuestion";

import { getMoodleFileUrl } from "../../../utils/moodleFile";

import COLORS from "../../../constants/colors";

interface Props {
  question: ParsedQuestion;
  answers: Record<string, string>;
  setAnswer: (field: string, value: string) => void;
  token?: string;
  attemptId: number;
  userId?: number;
  page?: number;
  disabled?: boolean;
  focused?: boolean;
}

export default function QuestionRenderer({
  question,
  answers,
  setAnswer,
  token,
  attemptId,
  userId = 0, page = 0, disabled = false, focused = true,
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

    case "recordrtc": {
      const fieldName = question.fieldName;

      const sequencecheck = question.sequencecheck;

      if (
        !fieldName ||
        !/^q\d+:\d+_recording$/.test(fieldName) ||
        !Number.isInteger(sequencecheck) ||
        sequencecheck === undefined
      ) {
        return (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>
              Không thể tải thông tin câu Speaking
            </Text>
            <Text style={styles.fallbackText}>
              Thiếu fieldName hoặc sequencecheck từ Moodle.
            </Text>
          </View>
        );
      }

      return (
        <RecordRTCQuestion
          key={`${userId}:${attemptId}:${fieldName}`}
          userId={userId}
          page={page}
          disabled={disabled}
          focused={focused}
          token={token}
          question={question}
          attemptId={attemptId}
          fieldName={fieldName}
          sequencecheck={sequencecheck}
          setAnswer={setAnswer}
        />
      );
    }

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
