import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppCard from "../../components/common/AppCard";
import AppProgressBar from "../../components/common/AppProgressBar";
import COLORS from "../../constants/colors";
import {
  OfflineExam,
  readOfflineExam,
  subscribeExamSync,
} from "../../services/examStorageService";
import { syncExam } from "../../services/syncService";
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
    courseid: number;
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

  const {
    courseid,
    quizid,
    quizName,
    attemptid,
    questions = [],
  } = route.params;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------

  const refreshLock = useRef(false);
  const submitLock = useRef(false);
  const mounted = useRef(true);

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(24));

  // ---------------------------------------------------------------------------
  // Sync status
  // ---------------------------------------------------------------------------

  const applySyncStatus = (exam: OfflineExam) => {
    if (!mounted.current) return;

    setSaveStatus(
      exam.status === "Synced"
        ? "saved"
        : exam.status === "Pending"
          ? "saving"
          : "not_saved",
    );
  };

  useEffect(() => {
    mounted.current = true;

    let active = true;
    let unsubscribe = () => {};

    void (async () => {
      try {
        const userid = Number(await AsyncStorage.getItem("userid"));

        if (!active || !userid) return;

        unsubscribe = subscribeExamSync((exam) => {
          if (
            exam.userid === userid &&
            exam.quizid === quizid &&
            exam.attemptid === attemptid
          ) {
            applySyncStatus(exam);
          }
        });

        const exam = await readOfflineExam({
          userid,
          quizid,
          attemptid,
        });

        if (active && exam) {
          applySyncStatus(exam);
        }
      } catch {
        if (active) {
          setSaveStatus("not_saved");
        }
      }
    })();

    return () => {
      active = false;
      mounted.current = false;
      unsubscribe();
    };
  }, [quizid, attemptid]);

  // ---------------------------------------------------------------------------
  // Refresh / retry sync
  // ---------------------------------------------------------------------------

  const handleRefresh = async () => {
    if (refreshLock.current || submitLock.current) {
      return;
    }

    refreshLock.current = true;
    setRefreshing(true);

    try {
      const userid = Number(await AsyncStorage.getItem("userid"));

      if (!userid) {
        throw new Error("Không tìm thấy thông tin người dùng.");
      }

      const context = {
        userid,
        quizid,
        attemptid,
      };

      await syncExam(context, true);

      const exam = await readOfflineExam(context);

      if (!exam) {
        throw new Error("Không tìm thấy dữ liệu bài làm.");
      }

      applySyncStatus(exam);

      if (exam.status !== "Synced") {
        throw new Error(
          exam.error || "Chưa đồng bộ được bài làm. Vui lòng thử lại.",
        );
      }
    } catch (error) {
      if (mounted.current) {
        setSaveStatus("not_saved");

        Alert.alert(
          "Không thể tải lại",
          error instanceof Error ? error.message : "Vui lòng thử lại.",
        );
      }
    } finally {
      refreshLock.current = false;

      if (mounted.current) {
        setRefreshing(false);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Question save status
  // ---------------------------------------------------------------------------

  const questionSaveStatus = (question: QuestionSummary): SaveStatus => {
    if (refreshing) {
      return "saving";
    }

    return saveStatus ?? question.saveStatus ?? "not_saved";
  };

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  const answeredCount = questions.filter(
    (question) => question.status === "answered",
  ).length;

  const unansweredCount = questions.length - answeredCount;

  const flaggedCount = questions.filter((question) => question.flagged).length;

  const savingCount = questions.filter(
    (question) => questionSaveStatus(question) === "saving",
  ).length;

  const notSavedCount = questions.filter(
    (question) => questionSaveStatus(question) === "not_saved",
  ).length;

  const progressPercent =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const allSaved = savingCount === 0 && notSavedCount === 0;

  const canSubmit = questions.length > 0 && allSaved && !refreshing;

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

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
  }, [fadeAnim, slideAnim]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleBackToExam = () => {
    navigation.goBack();
  };

  const handleReviewQuestion = (slot: number) => {
    if (submitLock.current) {
      return;
    }

    navigation.popTo(
      "Exam",
      {
        courseid,
        quizid,
        quizName,
        attemptid,
        targetQuestionSlot: slot,
      },
      {
        merge: true,
      },
    );
  };

  const handleConfirmSubmit = () => {
    if (!canSubmit || submitLock.current) {
      return;
    }

    submitLock.current = true;

    DeviceEventEmitter.emit("submitExamConfirmed", attemptid);

    navigation.goBack();
  };

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

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
    if (notSavedCount > 0) {
      return {
        label: "Chưa lưu",
        color: COLORS.error,
        bg: "#FCEDED",
      };
    }

    if (savingCount > 0) {
      return {
        label: "Đang lưu",
        color: COLORS.warning,
        bg: "#FFF6E4",
      };
    }

    return {
      label: "Đã lưu",
      color: COLORS.success,
      bg: "#EAF6EF",
    };
  };

  const statusBadge = getSaveStatusBadge();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* ================================================================
          HEADER
      ================================================================= */}

      <LinearGradient
        colors={[COLORS.primary, "#005220", "#003D18"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.safeHeader}>
          <View style={styles.headerRow}>
            {/* Back */}

            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBackToExam}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>

            {/* Title */}

            <View style={styles.headerCenter}>
              <Text style={styles.headerLabel}>XÁC NHẬN NỘP BÀI</Text>

              <Text style={styles.headerQuizName} numberOfLines={1}>
                {quizName}
              </Text>
            </View>

            {/* Sync status */}

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusBadge.bg,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: statusBadge.color,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: statusBadge.color,
                  },
                ]}
              >
                {statusBadge.label}
              </Text>
            </View>
          </View>

          {/* Progress */}

          <View style={styles.progressSection}>
            <AppProgressBar
              progress={progressPercent}
              height={5}
              color={progressPercent === 100 ? "#7DBA18" : "#FFD740"}
              trackColor="rgba(255,255,255,0.22)"
              showPercent={false}
            />

            <Text style={styles.progressLabel}>
              {answeredCount}/{questions.length} câu đã trả lời
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ================================================================
          CONTENT
      ================================================================= */}

      <ScrollView
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          }}
        >
          {/* ============================================================
              STATISTICS
          ============================================================= */}

          <View style={styles.statsRow}>
            {/* Đã làm */}

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: "#EAF6EF",
                  },
                ]}
              >
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
                      answeredCount > 0 ? COLORS.success : COLORS.textSecondary,
                  },
                ]}
              >
                {answeredCount}
              </Text>

              <Text style={styles.statLabel}>Đã làm</Text>
            </View>

            {/* Chưa làm */}

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: "#FCEDED",
                  },
                ]}
              >
                <Ionicons name="help-circle" size={22} color={COLORS.error} />
              </View>

              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      unansweredCount > 0 ? COLORS.error : COLORS.textSecondary,
                  },
                ]}
              >
                {unansweredCount}
              </Text>

              <Text style={styles.statLabel}>Chưa làm</Text>
            </View>

            {/* Đánh dấu */}

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {
                    backgroundColor: "#FFF6E4",
                  },
                ]}
              >
                <Ionicons name="flag" size={22} color={COLORS.warning} />
              </View>

              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      flaggedCount > 0 ? COLORS.warning : COLORS.textSecondary,
                  },
                ]}
              >
                {flaggedCount}
              </Text>

              <Text style={styles.statLabel}>Đánh dấu</Text>
            </View>
          </View>

          {/* ============================================================
              WARNING / SUCCESS
          ============================================================= */}

          {unansweredCount > 0 || !allSaved ? (
            <View style={styles.warningBanner}>
              <View style={styles.warningIconWrap}>
                <Ionicons name="warning" size={18} color={COLORS.warning} />
              </View>

              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Lưu ý trước khi nộp</Text>

                {unansweredCount > 0 && (
                  <Text style={styles.warningLine}>
                    • Còn {unansweredCount} câu chưa được trả lời
                  </Text>
                )}

                {notSavedCount > 0 && (
                  <Text
                    style={[
                      styles.warningLine,
                      {
                        color: COLORS.error,
                      },
                    ]}
                  >
                    • {notSavedCount} câu chưa được lưu lên máy chủ
                  </Text>
                )}

                {savingCount > 0 && (
                  <Text
                    style={[
                      styles.warningLine,
                      {
                        color: COLORS.warning,
                      },
                    ]}
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

          {/* ============================================================
              QUESTION LIST
          ============================================================= */}

          <AppCard style={styles.card}>
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

                const flagged = Boolean(question.flagged);

                return (
                  <TouchableOpacity
                    key={question.id}
                    style={styles.questionItem}
                    onPress={() => handleReviewQuestion(question.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Quay lại câu ${question.number}`}
                  >
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

                          answered && !flagged && styles.bubbleTextLight,
                        ]}
                      >
                        {question.number}
                      </Text>
                    </View>

                    {/* Save status */}

                    <View
                      style={[
                        styles.saveDot,
                        {
                          backgroundColor: getSaveStatusColor(
                            questionSaveStatus(question),
                          ),
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: COLORS.primary,
                    },
                  ]}
                />

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
                    {
                      backgroundColor: "#FFE9A0",
                      borderWidth: 1.5,
                      borderColor: COLORS.warning,
                    },
                  ]}
                />

                <Text style={styles.legendText}>Đánh dấu</Text>
              </View>
            </View>
          </AppCard>

          {/* ============================================================
              ACTIONS
          ============================================================= */}

          <View style={styles.actionsRow}>
            {/* Làm tiếp */}

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

            {/* Submit */}

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
                    ? [COLORS.primary, "#00561F"]
                    : ["#9E9E9E", "#757575"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.white}
                />

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

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  // --------------------------------------------------------------------------
  // Header
  // --------------------------------------------------------------------------

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
    color: COLORS.white,
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

  // --------------------------------------------------------------------------
  // Progress
  // --------------------------------------------------------------------------

  progressSection: {
    gap: 7,
  },

  progressLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "600",
  },

  // --------------------------------------------------------------------------
  // Content
  // --------------------------------------------------------------------------

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  // --------------------------------------------------------------------------
  // Card
  // --------------------------------------------------------------------------

  card: {
    borderWidth: 0,
    borderRadius: 20,
    marginBottom: 14,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  // --------------------------------------------------------------------------
  // Sync status
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Success
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Question grid
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    color: COLORS.white,
  },

  disclaimer: {
    textAlign: "center",
    fontSize: 11,
    color: COLORS.textLight,
    lineHeight: 17,
    paddingHorizontal: 20,
  },
});
