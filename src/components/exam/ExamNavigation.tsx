import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../../constants/colors";

interface ExamNavigationProps {
  currentPage: number;
  isLastPage: boolean;
  saving: boolean;
  submitting: boolean;
  examFinished: boolean;
  timeExpired: boolean;
  answersLocked: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function ExamNavigation({
  currentPage,
  isLastPage,
  saving,
  submitting,
  examFinished,
  timeExpired,
  answersLocked,
  onPrevious,
  onNext,
  onSubmit,
}: ExamNavigationProps) {
  return (
    <View style={styles.navigation}>
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.previousButton,
          currentPage === 0 && styles.navButtonDisabled,
        ]}
        disabled={
          currentPage === 0 ||
          saving ||
          submitting ||
          examFinished ||
          timeExpired ||
          answersLocked
        }
        onPress={onPrevious}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
        <Text style={styles.previousButtonText}>Trang trước</Text>
      </TouchableOpacity>

      {!isLastPage ? (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            saving && styles.navButtonDisabled,
          ]}
          disabled={
            saving ||
            submitting ||
            examFinished ||
            timeExpired ||
            answersLocked
          }
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {saving ? "Đang lưu..." : "Trang tiếp"}
          </Text>

          {!saving && (
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.submitButton,
            submitting && styles.navButtonDisabled,
          ]}
          disabled={saving || submitting || examFinished || answersLocked}
          onPress={onSubmit}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={19}
            color={COLORS.white}
          />
          <Text style={styles.submitButtonText}>
            {submitting ? "Đang nộp..." : "Nộp bài"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navigation: {
    flexDirection: "row",
    gap: 10,
  },
  navButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  previousButton: {
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previousButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
});
