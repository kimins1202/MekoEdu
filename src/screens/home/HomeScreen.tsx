import { Ionicons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Trang chủ" subtitle="Chào mừng bạn quay trở lại!" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.hello}>Xin chào 👋</Text>
            <Text style={styles.name}>Nguyễn Kim Yến</Text>
          </View>

          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={25}
              color={COLORS.primaryDark}
            />
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsRow}>
          <StatCard icon="book-outline" value="5" label="Khóa học" />

          <StatCard
            icon="document-text-outline"
            value="12"
            label="Bài kiểm tra"
          />

          <StatCard icon="trending-up-outline" value="78%" label="Tiến độ" />
        </View>

        {/* Recent course */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khóa học gần đây</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.courseCard}>
          <View style={styles.courseIcon}>
            <Ionicons
              name="phone-portrait-outline"
              size={28}
              color={COLORS.primaryDark}
            />
          </View>

          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>Lập trình ứng dụng di động</Text>

            <Text style={styles.courseProgress}>Đã hoàn thành 65%</Text>

            <View style={styles.progressBackground}>
              <View style={styles.progress} />
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </View>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, styles.quickTitle]}>
          Truy cập nhanh
        </Text>

        <View style={styles.quickGrid}>
          <QuickAction icon="book-outline" title="Khóa học" />

          <QuickAction icon="clipboard-outline" title="Bài kiểm tra" />

          <QuickAction icon="stats-chart-outline" title="Kết quả" />

          <QuickAction icon="person-outline" title="Tài khoản" />
        </View>
      </ScrollView>
    </View>
  );
}

/* =========================
   STAT CARD
========================= */

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primaryDark} />
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* =========================
   QUICK ACTION
========================= */

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}

function QuickAction({ icon, title }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.7}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={24} color={COLORS.primaryDark} />
      </View>

      <Text style={styles.quickText}>{title}</Text>
    </TouchableOpacity>
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

  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  hello: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  name: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 25,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },

  statLabel: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },

  seeAll: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  courseCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  courseInfo: {
    flex: 1,
  },

  courseName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  courseProgress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
    marginBottom: 7,
  },

  progressBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },

  progress: {
    width: "65%",
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  quickTitle: {
    marginBottom: 12,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  quickCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  quickText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
});
