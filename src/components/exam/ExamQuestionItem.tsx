import { Ionicons } from "@expo/vector-icons";
import AutoAudioPlayer from "./questions/AutoAudioPlayer";
import { getMoodleFileUrl } from "../../utils/moodleFile";
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MoodleHtml from "./questions/MoodleHtml";
import COLORS from "../../constants/colors";
import AppCard from "../common/AppCard";
import QuestionRenderer from "./questions/QuestionRenderer";

import type { ParsedQuestion } from "../../types/question";

interface ExamQuestionItemProps {
  questionNumberText: string;
  questionText: string;
  question: ParsedQuestion;
  attemptId: number;
  userId?: number;
  page?: number;
  focused?: boolean;
  isFlagged: boolean;
  selectedAnswers: Record<string, string>;
  disabled: boolean;
  flagDisabled?: boolean;
  answerDisabled?: boolean;

  token?: string;

  playedAudioRef: React.MutableRefObject<Set<string>>;

  onFlagToggle: () => void;
  onAnswerChange: (answer: unknown) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export default function ExamQuestionItem({
  questionNumberText,
  questionText,
  question,
  attemptId,
  userId, page, focused,
  isFlagged,
  selectedAnswers,
  disabled,
  flagDisabled = disabled,
  answerDisabled = disabled,
  token,
  playedAudioRef,
  onFlagToggle,
  onAnswerChange,
  onLayout,
}: ExamQuestionItemProps) {
  const handleAnswerChange = (field: string, value: string) => {
    if (answerDisabled) return;

    onAnswerChange({
      [field]: value,
    });
  };

  return (
    <View style={styles.questionContainer} onLayout={onLayout}>
      <AppCard style={styles.questionBox}>
        <View style={styles.questionHeader}>
          <View style={styles.questionHeaderLeft}>
            <View style={styles.questionNumber}>
              <Text style={styles.questionNumberText}>
                {questionNumberText}
              </Text>
            </View>

            <Text style={styles.questionLabel}>Câu hỏi</Text>
          </View>

          {question.type !== "description" && (
            <TouchableOpacity
              style={[styles.flagButton, isFlagged && styles.flagButtonActive]}
              onPress={onFlagToggle}
              disabled={flagDisabled}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isFlagged ? "flag" : "flag-outline"}
                size={19}
                color={isFlagged ? COLORS.warning : COLORS.textLight}
              />

              <Text
                style={[styles.flagText, isFlagged && styles.flagTextActive]}
              >
                {isFlagged ? "Đã đánh dấu" : "Đánh dấu"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!!questionText && (
          <View style={{ marginTop: 14 }}>
            {question.qtextHtml ? (
              <MoodleHtml html={question.qtextHtml} />
            ) : (
              <Text style={styles.questionText}>{questionText}</Text>
            )}
          </View>
        )}

        {question.type === "description" && question.audioUrl && (
          <AutoAudioPlayer
            uri={getMoodleFileUrl(question.audioUrl, token)}
            audioKey={question.audioUrl}
            playedAudioRef={playedAudioRef}
          />
        )}
      </AppCard>

      {question.type !== "description" && (
        <AppCard style={styles.answerBox}>
          <Text style={styles.answerTitle}>Trả lời</Text>

          <QuestionRenderer
            question={question}
            answers={selectedAnswers}
            setAnswer={handleAnswerChange}
            token={token}
            attemptId={attemptId}
            userId={userId}
            page={page}
            focused={focused}
            disabled={answerDisabled}
          />
        </AppCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  questionContainer: {
    marginBottom: 4,
  },

  questionBox: {
    marginBottom: 8,
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },

  questionHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  questionNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  questionNumberText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  questionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  flagButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  flagButtonActive: {
    backgroundColor: "#FFF4D6",
  },

  flagText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textLight,
  },

  flagTextActive: {
    color: COLORS.warning,
  },

  questionText: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.text,
    marginTop: 14,
  },

  answerBox: {
    marginBottom: 14,
  },

  answerTitle: {
    marginBottom: 14,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  descriptionAudio: {
    marginTop: 16,
  },
});
