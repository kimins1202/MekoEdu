import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AppHeader from "@/components/common/AppHeader";
import AppProgressBar from "@/components/common/AppProgressBar";
import ExamTimer from "@/components/exam/ExamTimer";
import COLORS from "@/constants/colors";

interface ExamTopBarProps {
  quizName: string;
  answeredCount: number;
  totalQuestions: number;
  currentPage: number;
  progressPercent: number;
  deadlineLoaded: boolean;
  examFinished: boolean;
  timerIsUrgent: boolean;
  timeExpired: boolean;
  secondsRemaining: number | null;
  onMenuPress: () => void;
}

export default function ExamTopBar({
  quizName,
  answeredCount,
  totalQuestions,
  currentPage,
  progressPercent,
  deadlineLoaded,
  examFinished,
  timerIsUrgent,
  timeExpired,
  secondsRemaining,
  onMenuPress,
}: ExamTopBarProps) {
  const showTimer =
    deadlineLoaded && secondsRemaining !== null && !examFinished;

  const progress = Math.min(Math.max(Number(progressPercent) || 0, 0), 100);

  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <AppHeader
        title={quizName}
        subtitle={`${answeredCount}/${totalQuestions} câu · Trang ${
          currentPage + 1
        }`}
        showBack
      />

      {/* ================= PROGRESS BAR ================= */}
      <View style={styles.progressRow}>
        {/* Danh sách câu hỏi */}
        <TouchableOpacity
          style={styles.questionButton}
          onPress={onMenuPress}
          activeOpacity={0.8}
        >
          <Ionicons name="grid-outline" size={15} color={COLORS.primary} />

          <Text style={styles.questionButtonText}>Câu hỏi</Text>
        </TouchableOpacity>

        {/* Progress */}
        <View style={styles.progressWrapper}>
          <AppProgressBar progress={progress} height={6} />
        </View>

        {/* Percent */}
        <Text style={styles.percentText}>{Math.round(progress)}%</Text>

        {/* Timer */}
        {showTimer && (
          <View
            style={[
              styles.timerWrapper,
              timerIsUrgent && styles.timerUrgent,
              timeExpired && styles.timerExpired,
            ]}
          >
            {timeExpired ? (
              <>
                <Ionicons
                  name="alert-circle-outline"
                  size={15}
                  color={COLORS.error}
                />

                <Text style={styles.expiredText}>Hết giờ</Text>
              </>
            ) : (
              <ExamTimer seconds={secondsRemaining} compact />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
  },

  /*
   * Thanh progress nằm sát ngay dưới AppHeader.
   * Không tạo marginTop để tránh khoảng trắng giữa header
   * và thanh tiến độ.
   */
  progressRow: {
    minHeight: 46,

    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.white,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  questionButton: {
    height: 32,

    paddingHorizontal: 10,

    borderRadius: 9,

    backgroundColor: COLORS.backgroundSoft,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  questionButtonText: {
    marginLeft: 5,

    fontSize: 12,
    fontWeight: "700",

    color: COLORS.primary,
  },

  progressWrapper: {
    flex: 1,

    marginLeft: 12,
  },

  percentText: {
    minWidth: 30,

    marginLeft: 7,

    textAlign: "right",

    fontSize: 12,
    fontWeight: "800",

    color: COLORS.primary,
  },

  timerWrapper: {
    minHeight: 32,

    marginLeft: 8,

    paddingHorizontal: 8,

    borderRadius: 9,

    backgroundColor: COLORS.backgroundSoft,

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  timerUrgent: {
    backgroundColor: "#FFF8E8",
    borderColor: "#F1D58A",
  },

  timerExpired: {
    backgroundColor: "#FFF0F0",
    borderColor: "#F0B5B5",
  },

  expiredText: {
    marginLeft: 4,

    fontSize: 11,
    fontWeight: "800",

    color: COLORS.error,
  },
});
