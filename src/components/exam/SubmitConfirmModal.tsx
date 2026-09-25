import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLORS from "../../constants/colors";

interface SubmitConfirmModalProps {
  visible: boolean;
  answeredCount: number;
  totalQuestions: number;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function SubmitConfirmModal({
  visible,
  answeredCount,
  totalQuestions,
  onCancel,
  onConfirm,
  loading = false,
}: SubmitConfirmModalProps) {
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="paper-plane-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.title}>Nộp bài thi?</Text>

          <Text style={styles.message}>
            Bạn có chắc chắn muốn nộp bài không? Sau khi nộp, bạn sẽ không thể
            thay đổi câu trả lời.
          </Text>

          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Đã trả lời</Text>

              <Text style={styles.summaryValue}>
                {answeredCount}/{totalQuestions}
              </Text>
            </View>

            {unansweredCount > 0 && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Chưa trả lời</Text>

                <Text style={[styles.summaryValue, styles.warningText]}>
                  {unansweredCount}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Tiếp tục làm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <Text style={styles.confirmText}>Đang nộp...</Text>
              ) : (
                <>
                  <Text style={styles.confirmText}>Nộp bài</Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={COLORS.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modal: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 24,
  },

  iconWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  message: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  summary: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
  },

  summaryItem: {
    alignItems: "center",
  },

  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
  },

  warningText: {
    color: COLORS.warning,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
