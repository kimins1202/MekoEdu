import { StyleSheet, Text, View } from "react-native";
import COLORS from "../../constants/colors";

interface ExamTimerProps {
  seconds: number | null;
  compact?: boolean;
}

export default function ExamTimer({ seconds, compact = false }: ExamTimerProps) {
  const hours = Math.floor((seconds ?? 0) / 3600);
  const minutes = Math.floor(((seconds ?? 0) % 3600) / 60);
  const remainingSeconds = (seconds ?? 0) % 60;

  const formattedTime =
    seconds === null
      ? "∞"
      : `${hours > 0 ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

  const isWarning = seconds !== null && seconds <= 300;
  const isDanger = seconds !== null && seconds <= 60;

  const timeColor = isDanger
    ? COLORS.error
    : isWarning
      ? COLORS.warning
      : COLORS.primary;

  if (compact) {
    return (
      <Text
        style={[
          styles.compactTime,
          isWarning && styles.warningText,
          isDanger && styles.dangerText,
        ]}
      >
        {formattedTime}
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isWarning && styles.warningContainer,
        isDanger && styles.dangerContainer,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.label}>Thời gian còn lại</Text>

        <Text
          style={[
            styles.time,
            { color: timeColor },
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

  compactTime: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
});
