import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";

export default function ExamLoading({ quizName }: { quizName?: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card} accessibilityLiveRegion="polite" accessibilityState={{ busy: true }}>
          <View style={styles.iconRing}>
            <View style={styles.icon}>
              <Ionicons name="document-text-outline" size={36} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.title}>Đang tải bài thi</Text>
          {!!quizName && <Text style={styles.quizName} numberOfLines={3}>{quizName}</Text>}
          <Text style={styles.description}>
            Vui lòng chờ trong giây lát để chuẩn bị câu hỏi.
          </Text>
          <View style={styles.status}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>Đang chuẩn bị bài thi...</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  iconRing: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft, marginBottom: 24,
  },
  icon: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 22, lineHeight: 30, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  quizName: { fontSize: 15, lineHeight: 22, fontWeight: "600", color: COLORS.primary, textAlign: "center", marginTop: 8 },
  description: { fontSize: 14, lineHeight: 22, color: COLORS.textSecondary, textAlign: "center", marginTop: 12 },
  status: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap",
    gap: 10, alignSelf: "stretch", backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14, padding: 14, marginTop: 24,
  },
  statusText: { fontSize: 13, lineHeight: 20, color: COLORS.primaryDark, fontWeight: "500", textAlign: "center" },
});
