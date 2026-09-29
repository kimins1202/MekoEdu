import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef } from "react";
import {
  Animated,
  DeviceEventEmitter,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import COLORS from "../../constants/colors";
import { AppStackParamList } from "../../types/navigation";

type QuestionStatus = "answered" | "unanswered";

type SaveStatus = "saved" | "saving" | "not_saved";

type QuestionSummary = {
  id: number;
  number: number;
  status: QuestionStatus;
  flagged?: boolean;
  saveStatus?: SaveStatus;
};

type RouteProp = {
  key: string;
  name: "ConfirmSubmit";
  params: {
    quizid: number;
    quizName: string;
    attemptid: number;
    questions: QuestionSummary[];
  };
};

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function ConfirmSubmitScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();

  const { quizid, quizName, attemptid, questions = [] } = route.params;

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const answeredCount = questions.filter(
    (question) => question.status === "answered",
  ).length;

  const unansweredCount = questions.length - answeredCount;

  const flaggedCount = questions.filter((question) => question.flagged).length;

  const savedCount = questions.filter(
    (question) => question.saveStatus === "saved",
  ).length;

  const savingCount = questions.filter(
    (question) => question.saveStatus === "saving",
  ).length;

  const notSavedCount = questions.filter(
    (question) => question.saveStatus === "not_saved",
  ).length;

  const progressPercent =
    questions.length > 0 ? answeredCount / questions.length : 0;

  const allSaved = savingCount === 0 && notSavedCount === 0;
  const canSubmit = allSaved;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 900,
      delay: 250,
      useNativeDriver: false,
    }).start();
  }, []);

  const handleBackToExam = () => {
    navigation.goBack();
  };

  const handleConfirmSubmit = () => {
    DeviceEventEmitter.emit("submitExamConfirmed", attemptid);
    navigation.goBack();
  };

  const getSaveStatusColor = (status?: SaveStatus) => {
    switch (status) {
      case "saved":
        return COLORS.success;
      case "saving":
        return COLORS.warning;
      default:
        return COLORS.error;
    }
  };

  const getSaveStatusBadge = () => {
    if (notSavedCount > 0)
      return { label: "Chưa lưu", color: COLORS.error, bg: "#FCEDED" };
    if (savingCount > 0)
      return { label: "Đang lưu", color: COLORS.warning, bg: "#FFF6E4" };
    return { label: "Đã lưu", color: COLORS.success, bg: "#EAF6EF" };
  };

  const statusBadge = getSaveStatusBadge();

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={["#006E27", "#005220", "#003d18"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.safeHeader}>
          {/* Top row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackToExam}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>Xác nhận nộp bài</Text>
              <Text style={styles.headerQuizName} numberOfLines={1}>
                {quizName}
              </Text>
            </View>

            {/* Save status pill */}
            <View
              style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusBadge.color },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: statusBadge.color },
                ]}
              >
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                    backgroundColor:
                      progressPercent === 1 ? "#7DBA18" : "#FFD740",
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {answeredCount}/{questions.length} câu đã trả lời
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* ── Stat Cards ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#EAF6EF" }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={COLORS.success}
                />
              </View>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      answeredCount > 0
                        ? COLORS.success
                        : COLORS.textSecondary,
                  },
                ]}
              >
                {answeredCount}
              </Text>
              <Text style={styles.statLabel}>Đã làm</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#FCEDED" }]}>
                <Ionicons
                  name="help-circle"
                  size={22}
                  color={COLORS.error}
                />
              </View>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      unansweredCount > 0
                        ? COLORS.error
                        : COLORS.textSecondary,
                  },
                ]}
              >
                {unansweredCount}
              </Text>
              <Text style={styles.statLabel}>Chưa làm</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#FFF6E4" }]}>
                <Ionicons name="flag" size={22} color={COLORS.warning} />
              </View>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      flaggedCount > 0
                        ? COLORS.warning
                        : COLORS.textSecondary,
                  },
                ]}
              >
                {flaggedCount}
              </Text>
              <Text style={styles.statLabel}>Đánh dấu</Text>
            </View>
          </View>

          {/* ── Save Status Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="cloud-done-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.cardTitle}>Trạng thái lưu bài</Text>
              </View>

              <View
                style={[
                  styles.syncBadge,
                  {
                    backgroundColor: allSaved ? "#EAF6EF" : "#FCEDED",
                  },
                ]}
              >
                <Ionicons
                  name={allSaved ? "checkmark" : "alert"}
                  size={11}
                  color={allSaved ? COLORS.success : COLORS.error}
                />
                <Text
                  style={[
                    styles.syncBadgeText,
                    {
                      color: allSaved ? COLORS.success : COLORS.error,
                    },
                  ]}
                >
                  {allSaved ? "Đồng bộ xong" : "Chưa đồng bộ"}
                </Text>
              </View>
            </View>

            <View style={styles.saveStatsRow}>
              <View style={styles.saveStat}>
                <Ionicons
                  name="cloud-done-outline"
                  size={18}
                  color={COLORS.success}
                />
                <Text
                  style={[styles.saveStatValue, { color: COLORS.success }]}
                >
                  {savedCount}
                </Text>
                <Text style={styles.saveStatLabel}>Đã lưu</Text>
              </View>

              <View style={styles.saveStatDivider} />

              <View style={styles.saveStat}>
                <Ionicons
                  name="sync-outline"
                  size={18}
                  color={COLORS.warning}
                />
                <Text
                  style={[styles.saveStatValue, { color: COLORS.warning }]}
                >
                  {savingCount}
                </Text>
                <Text style={styles.saveStatLabel}>Đang lưu</Text>
              </View>

              <View style={styles.saveStatDivider} />

              <View style={styles.saveStat}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={COLORS.error}
                />
                <Text
                  style={[styles.saveStatValue, { color: COLORS.error }]}
                >
                  {notSavedCount}
                </Text>
                <Text style={styles.saveStatLabel}>Chưa lưu</Text>
              </View>
            </View>
          </View>

          {/* ── Warning / Success Banner ── */}
          {unansweredCount > 0 || !allSaved ? (
            <View style={styles.warningBanner}>
              <View style={styles.warningIconWrap}>
                <Ionicons
                  name="warning"
                  size={18}
                  color={COLORS.warning}
                />
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Lưu ý trước khi nộp</Text>
                {unansweredCount > 0 && (
                  <Text style={styles.warningLine}>
                    • Còn {unansweredCount} câu chưa được trả lời
                  </Text>
                )}
                {notSavedCount > 0 && (
                  <Text style={[styles.warningLine, { color: COLORS.error }]}>
                    • {notSavedCount} câu chưa được lưu lên máy chủ
                  </Text>
                )}
                {savingCount > 0 && (
                  <Text
                    style={[styles.warningLine, { color: COLORS.warning }]}
                  >
                    • {savingCount} câu đang trong quá trình lưu
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.successBanner}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={COLORS.success}
              />
              <Text style={styles.successText}>
                Tất cả câu hỏi đã trả lời và lưu thành công!
              </Text>
            </View>
          )}

          {/* ── Question Grid ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.cardTitle}>Danh sách câu hỏi</Text>
              </View>
            </View>

            <View style={styles.questionGrid}>
              {questions.map((question) => {
                const answered = question.status === "answered";
                const flagged = question.flagged;

                return (
                  <View key={question.id} style={styles.questionItem}>
                    <View
                      style={[
                        styles.questionBubble,
                        answered && !flagged && styles.bubbleAnswered,
                        flagged && styles.bubbleFlagged,
                        !answered && !flagged && styles.bubbleUnanswered,
                      ]}
                    >
                      <Text
                        style={[
                          styles.bubbleText,
                          (answered && !flagged) && styles.bubbleTextLight,
                        ]}
                      >
                        {question.number}
                      </Text>
                    </View>

                    {/* Save status indicator dot */}
                    <View
                      style={[
                        styles.saveDot,
                        {
                          backgroundColor: getSaveStatusColor(
                            question.saveStatus,
                          ),
                        },
                      ]}
                    />
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                <Text style={styles.legendText}>Đã làm</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: COLORS.backgroundSoft,
                      borderWidth: 1.5,
                      borderColor: COLORS.border,
                    },
                  ]}
                />
                <Text style={styles.legendText}>Chưa làm</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: "#FFE9A0", borderWidth: 1.5, borderColor: COLORS.warning },
                  ]}
                />
                <Text style={styles.legendText}>Đánh dấu</Text>
              </View>
            </View>
          </View>

          {/* ── Bottom Actions ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToExam}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back-outline"
                size={18}
                color={COLORS.primaryDark}
              />
              <Text style={styles.backButtonText}>Làm tiếp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
              ]}
              onPress={handleConfirmSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={
                  canSubmit
                    ? ["#006E27", "#00561f"]
                    : ["#9E9E9E", "#757575"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {canSubmit ? "Xác nhận nộp bài" : "Đang lưu bài..."}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>
            Sau khi nộp bài, bạn sẽ không thể chỉnh sửa câu trả lời.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────── Styles ──────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  // Header
  headerGradient: {
    paddingBottom: 18,
  },

  safeHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
  },

  headerLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  headerQuizName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Progress
  progressSection: {
    gap: 7,
  },

  progressTrack: {
    height: 5,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  progressLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "600",
  },

  // Content
  content: {
    padding: 16,
    paddingBottom: 32,
  },

  // Stat cards
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  syncBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Save stats
  saveStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  saveStat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },

  saveStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  saveStatLabel: {
    fontSize: 10,
    color: COLORS.textLight,
  },

  saveStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // Warning banner
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FFF9EC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFECC8",
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },

  warningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFF0CC",
    justifyContent: "center",
    alignItems: "center",
  },

  warningContent: {
    flex: 1,
    gap: 4,
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },

  warningLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EAF6EF",
    borderWidth: 1,
    borderColor: "#C3E6CC",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },

  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.success,
    lineHeight: 18,
  },

  // Question grid
  questionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  questionItem: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  questionBubble: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  bubbleAnswered: {
    backgroundColor: COLORS.primary,
  },

  bubbleFlagged: {
    backgroundColor: "#FFE9A0",
    borderWidth: 1.5,
    borderColor: COLORS.warning,
  },

  bubbleUnanswered: {
    backgroundColor: COLORS.backgroundSoft,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  bubbleText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  bubbleTextLight: {
    color: COLORS.white,
  },

  saveDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },

  legendRow: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexWrap: "wrap",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },

  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  backButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  submitButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  submitGradient: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },

  submitButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 17,
    paddingHorizontal: 20,
  },
});
