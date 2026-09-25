import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";

const results = [
  {
    title: "Kiểm tra chương 1 - Cơ sở dữ liệu",
    score: "8.5",
    date: "22/09/2026",
  },
  {
    title: "Quiz - React Native",
    score: "9.0",
    date: "20/09/2026",
  },
  {
    title: "Kiểm tra giữa kỳ",
    score: "7.5",
    date: "18/09/2026",
  },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Lịch sử làm bài" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="trophy-outline"
              size={28}
              color={COLORS.primaryDark}
            />
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Điểm trung bình</Text>

            <Text style={styles.summaryScore}>8.3</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lịch sử làm bài</Text>

        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <Ionicons
                name="document-text-outline"
                size={23}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{result.title}</Text>

              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={COLORS.textLight}
                />

                <Text style={styles.date}>{result.date}</Text>
              </View>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={styles.score}>{result.score}</Text>

              <Text style={styles.scoreLabel}>điểm</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  summaryScore: {
    marginTop: 3,
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },

  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  resultIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  resultInfo: {
    flex: 1,
  },

  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 20,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },

  date: {
    fontSize: 11,
    color: COLORS.textLight,
  },

  scoreContainer: {
    alignItems: "center",
    marginLeft: 8,
  },

  score: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  scoreLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 1,
  },
});
