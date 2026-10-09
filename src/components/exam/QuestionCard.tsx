import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "../../constants/colors";
import type { ParsedQuestion } from "../../types/question";
import AppCard from "../common/AppCard";
import QuestionRenderer from "./questions/QuestionRenderer";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions?: number;

  question: ParsedQuestion;

  attemptId: number;

  selectedAnswers: Record<string, string>;

  onAnswerChange: (answers: Record<string, string>) => void;

  onFlagPress?: () => void;
  isFlagged?: boolean;

  token?: string;
}

export default function QuestionCard({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswers,
  onAnswerChange,
  onFlagPress,
  isFlagged = false,
  token,
  attemptId,
}: QuestionCardProps) {
  const handleAnswerChange = (field: string, value: string) => {
    onAnswerChange({
      ...selectedAnswers,
      [field]: value,
    });
  };

  const getTypeLabel = () => {
    switch (question.type) {
      case "multichoice-multiple":
      case "multianswer":
        return "Nhiều đáp án";

      case "description":
        return "Thông tin";

      case "truefalse":
      case "multichoice-single":
      case "calculatedmulti":
        return "Một đáp án";

      case "shortanswer":
        return "Trả lời ngắn";

      case "numerical":
      case "calculated":
      case "calculatedsimple":
        return "Nhập số";

      case "essay":
        return "Tự luận";

      case "match":
      case "randomsamatch":
        return "Ghép đôi";

      case "gapselect":
        return "Chọn từ";

      case "ordering":
        return "Sắp xếp";

      case "ddwtos":
      case "ddimageortext":
      case "ddmarker":
        return "Kéo thả";

      default:
        return "Câu hỏi";
    }
  };

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.questionInfo}>
          <Text style={styles.questionNumber}>
            Câu {questionNumber}
            {totalQuestions ? ` / ${totalQuestions}` : ""}
          </Text>

          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{getTypeLabel()}</Text>
          </View>
        </View>

        {onFlagPress && (
          <TouchableOpacity
            style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
            onPress={onFlagPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFlagged ? "flag" : "flag-outline"}
              size={19}
              color={isFlagged ? COLORS.warning : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Question + Answer */}
      <QuestionRenderer
        question={question}
        answers={selectedAnswers}
        setAnswer={handleAnswerChange}
        token={token}
        attemptId={attemptId}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  questionInfo: {
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

  typeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
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
});
