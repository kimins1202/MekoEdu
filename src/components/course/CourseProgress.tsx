import { StyleSheet, Text, View } from "react-native";
import COLORS from "../../constants/colors";

interface CourseProgressProps {
  progress: number;
}

export default function CourseProgress({ progress }: CourseProgressProps) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Tiến độ học tập</Text>

        <Text style={styles.value}>{safeProgress}%</Text>
      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progress,
            {
              width: `${safeProgress}%` as `${number}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  value: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  progressBackground: {
    height: 7,
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.border,
  },

  progress: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
});
