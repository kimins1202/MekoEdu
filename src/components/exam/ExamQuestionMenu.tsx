import { isQuestionAnswered } from "@/utils/questionAnswerStatus";
import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";

interface QuestionOverviewItem {
  slot: number;
  page: number;
  questionNumber: string;
  answerNames: string[];
  flagged: boolean;
}

interface ExamQuestionMenuProps {
  visible: boolean;
  onClose: () => void;
  answeredCount: number;
  totalQuestions: number;
  questionOverview: QuestionOverviewItem[];
  selectedAnswers: Record<string, string>;
  flaggedQuestions: Record<number, boolean>;
  onGoToQuestion: (item: QuestionOverviewItem) => void;
}

export default function ExamQuestionMenu({
  visible,
  onClose,
  answeredCount,
  totalQuestions,
  questionOverview,
  selectedAnswers,
  flaggedQuestions,
  onGoToQuestion,
}: ExamQuestionMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView
          edges={["top", "right", "bottom", "left"]}
          style={styles.modalOverlay}
        >
          <View style={styles.questionMenuModal}>
            {/* HEADER */}
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuTitle}>Tổng quan câu hỏi</Text>

                <Text style={styles.menuSubtitle}>
                  {answeredCount}/{totalQuestions} câu đã trả lời
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* LEGEND */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendAnswered]} />

                <Text style={styles.legendText}>Đã trả lời</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendUnanswered]} />

                <Text style={styles.legendText}>Chưa trả lời</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendFlagged]} />

                <Text style={styles.legendText}>Đã đánh dấu</Text>
              </View>
            </View>

            {/* QUESTION GRID */}
            <ScrollView
              style={styles.questionGridScroll}
              contentContainerStyle={styles.questionGrid}
              showsVerticalScrollIndicator={false}
            >
              {questionOverview.map((item, index) => {
                const answered =
                  isQuestionAnswered(item.answerNames, selectedAnswers);

                const flagged = Boolean(
                  flaggedQuestions[item.slot] ?? item.flagged,
                );

                return (
                  <TouchableOpacity
                    key={`question-menu-${item.slot}-${item.page}-${index}`}
                    style={[
                      styles.questionGridItem,

                      answered && !flagged && styles.questionGridAnswered,

                      !answered && !flagged && styles.questionGridUnanswered,

                      flagged && styles.questionGridFlagged,
                    ]}
                    onPress={() => onGoToQuestion(item)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.questionGridNumber,

                        answered && !flagged && styles.questionGridNumberAnswered,

                        flagged && styles.questionGridNumberFlagged,
                      ]}
                    >
                      {item.questionNumber || item.slot}
                    </Text>

                    {flagged && (
                      <Ionicons
                        name="flag"
                        size={11}
                        color={COLORS.warning}
                        style={styles.gridFlagIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.menuFooter}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={COLORS.textSecondary}
              />

              <Text style={styles.menuFooterText}>
                Chạm vào số câu để xem nhanh câu hỏi cần kiểm tra.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  questionMenuModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 34,
    maxHeight: "85%",
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },

  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 20,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendAnswered: {
    backgroundColor: COLORS.primary,
  },

  legendUnanswered: {
    backgroundColor: COLORS.border,
  },

  legendFlagged: {
    backgroundColor: COLORS.warning,
  },

  legendText: {
    fontSize: 12,
    color: COLORS.text,
  },

  questionGridScroll: {
    paddingHorizontal: 24,
  },

  questionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 20,
  },

  questionGridItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  questionGridAnswered: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  questionGridUnanswered: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  questionGridFlagged: {
    backgroundColor: "#FFF8E8",
    borderColor: COLORS.warning,
  },

  questionGridNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  questionGridNumberAnswered: {
    color: COLORS.white,
  },

  questionGridNumberFlagged: {
    color: COLORS.warning,
  },

  gridFlagIcon: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    overflow: "hidden",
  },

  menuFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 24,
  },

  menuFooterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
