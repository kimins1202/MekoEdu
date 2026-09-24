import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import COLORS from "../../constants/colors";

interface ExamTimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
}

export default function ExamTimer({
  initialSeconds,
  onTimeUp,
}: ExamTimerProps) {
  const [seconds, setSeconds] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    setSeconds(Math.max(0, initialSeconds));
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onTimeUp]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const formattedTime = `${String(minutes).padStart(
    2,
    "0",
  )}:${String(remainingSeconds).padStart(2, "0")}`;

  const isWarning = seconds <= 60;
  const isDanger = seconds <= 30;

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
