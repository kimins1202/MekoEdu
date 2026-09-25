import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import COLORS from "../../constants/colors";

interface ScoreCardProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}

export default function ScoreCard({
  score,
  correctAnswers,
  totalQuestions,
}: ScoreCardProps) {
  const percentage =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.scoreCircle}>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.scoreLabel}>điểm</Text>
      </View>

      <Text style={styles.title}>Kết quả bài thi</Text>

      <Text style={styles.message}>Bạn đã hoàn thành bài thi</Text>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.statValue}>
            {correctAnswers}/{totalQuestions}
          </Text>

          <Text style={styles.statLabel}>Câu đúng</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="analytics-outline"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.statValue}>{percentage}%</Text>

          <Text style={styles.statLabel}>Tỷ lệ đúng</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 6,
    borderColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  score: {
    fontSize: 30,
    fontWeight: "800",
    color: COLORS.primary,
  },

  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: -2,
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  stats: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 55,
    backgroundColor: COLORS.border,
  },
});
