import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import RenderHTML from "react-native-render-html";

import COLORS from "../../constants/colors";
import AnswerOption from "./AnswerOption";

import type {
  ParsedAnswer,
  QuestionType,
} from "../../utils/moodleQuestionParser";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions?: number;

  questionHtml: string;
  answers: ParsedAnswer[];

  type: QuestionType;

  selectedAnswers: string[];

  onAnswerPress: (value: string) => void;

  onFlagPress?: () => void;
  isFlagged?: boolean;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  questionHtml,
  answers,
  type,
  selectedAnswers,
  onAnswerPress,
  onFlagPress,
  isFlagged = false,
}: QuestionCardProps) {
  const { width } = useWindowDimensions();

  const isMultiple = type === "multiple";

  return (
    <View style={styles.container}>
      {/* Question header */}
      <View style={styles.header}>
        <View style={styles.questionNumberWrapper}>
          <Text style={styles.questionNumber}>
            Câu {questionNumber}
            {totalQuestions ? ` / ${totalQuestions}` : ""}
          </Text>

          <View style={[styles.typeBadge, isMultiple && styles.multipleBadge]}>
            <Text
              style={[styles.typeText, isMultiple && styles.multipleTypeText]}
            >
              {isMultiple ? "Nhiều đáp án" : "Một đáp án"}
            </Text>
          </View>
        </View>

        {/* Flag */}
        {onFlagPress && (
          <TouchableOpacity
            style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
            onPress={onFlagPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.flagText, isFlagged && styles.flagTextActive]}>
              ⚑
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <RenderHTML
          contentWidth={width - 64}
          source={{
            html: questionHtml,
          }}
          tagsStyles={htmlStyles}
        />
      </View>

      {/* Hint */}
      <Text style={styles.answerHint}>
        {isMultiple ? "Chọn tất cả đáp án đúng" : "Chọn một đáp án"}
      </Text>

      {/* Answers */}
      <View style={styles.answersContainer}>
        {answers.map((answer) => {
          const selected = selectedAnswers.includes(answer.value);

          return (
            <AnswerOption
              key={answer.id}
              label={answer.label}
              text={answer.text}
              selected={selected}
              multiple={isMultiple}
              onPress={() => onAnswerPress(answer.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  questionNumberWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  questionNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },

  typeBadge: {
    marginLeft: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSoft,
  },

  multipleBadge: {
    backgroundColor: "#FFF8E8",
  },

  typeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
  },

  multipleTypeText: {
    color: COLORS.warning,
  },

  flagButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  flagButtonActive: {
    backgroundColor: "#FFF8E8",
    borderColor: COLORS.warning,
  },

  flagText: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },

  flagTextActive: {
    color: COLORS.warning,
  },

  questionContainer: {
    paddingHorizontal: 2,
    marginBottom: 12,
  },

  answerHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },

  answersContainer: {
    marginTop: 2,
  },
});

const htmlStyles = {
  p: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },

  div: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },

  strong: {
    fontWeight: "700" as const,
  },

  em: {
    fontStyle: "italic" as const,
  },

  img: {
    maxWidth: "100%",
  },
};
