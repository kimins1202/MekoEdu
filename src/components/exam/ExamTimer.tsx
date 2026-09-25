import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import COLORS from "../../constants/colors";

interface ExamTimerProps {
  seconds: number | null;
}

export default function ExamTimer({
  seconds,
}: ExamTimerProps) {
  const hours = Math.floor((seconds ?? 0) / 3600);
  const minutes = Math.floor(((seconds ?? 0) % 3600) / 60);
  const remainingSeconds = (seconds ?? 0) % 60;

  const formattedTime = seconds === null ? "Không giới hạn" : `${hours > 0 ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(
    2,
    "0",
  )}:${String(remainingSeconds).padStart(2, "0")}`;

  const isWarning = seconds !== null && seconds <= 60;
  const isDanger = seconds !== null && seconds <= 30;

  return (
    <View
      style={[
        styles.container,
        isWarning && styles.warningContainer,
        isDanger && styles.dangerContainer,
      ]}
    >
      <Ionicons
        name="time-outline"
        size={20}
        color={
          isDanger ? COLORS.error : isWarning ? COLORS.warning : COLORS.primary
        }
      />

      <View style={styles.content}>
        <Text style={styles.label}>Thời gian còn lại</Text>

        <Text
          style={[
            styles.time,
            isWarning && styles.warningText,
            isDanger && styles.dangerText,
          ]}
        >
          {formattedTime}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  warningContainer: {
    backgroundColor: "#FFF8E8",
    borderColor: "#F1D58A",
  },

  dangerContainer: {
    backgroundColor: "#FFF0F0",
    borderColor: "#F0B5B5",
  },

  content: {
    marginLeft: 9,
  },

  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  time: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  warningText: {
    color: COLORS.warning,
  },

  dangerText: {
    color: COLORS.error,
  },
});
