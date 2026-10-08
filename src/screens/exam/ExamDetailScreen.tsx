import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppButton from "@/components/common/AppButton";
import AppCard from "@/components/common/AppCard";
import AppHeader from "@/components/common/AppHeader";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";

import { getQuizAccessInformation, getUserAttempts } from "../../api/quizApi";

import { AppStackParamList } from "../../types/navigation";

// TYPES

type RouteParams = {
  courseid: number;
  quizid: number;
  quizName: string;
  questionCount?: number;
  timelimit?: number;
};

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type Attempt = {
  id: number;
  quiz?: number;
  userid?: number;
  attempt?: number;
  state?: string;
  timestart?: number;
  timefinish?: number;
  timemodified?: number;
  sumgrades?: number;
};

// SCREEN

export default function ExamDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();

  const { courseid, quizid, quizName, questionCount, timelimit } =
    route.params as RouteParams;

  const [loading, setLoading] = useState(true);

  // API 6
  const [canAttempt, setCanAttempt] = useState(false);
  const [preventAccessReasons, setPreventAccessReasons] = useState<string[]>(
    [],
  );

  // API 7
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // LOAD DATA

  const loadQuizData = useCallback(async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      // API 6
      // KIỂM TRA QUYỀN TRUY CẬP

      const accessResponse = await getQuizAccessInformation(Number(quizid));

      setCanAttempt(accessResponse?.canattempt ?? false);

      setPreventAccessReasons(accessResponse?.preventaccessreasons ?? []);

      // API 7
      // LẤY LỊCH SỬ LÀM BÀI

      const attemptsResponse = await getUserAttempts(
        Number(quizid),
        Number(userId),
        "all",
      );

      if (attemptsResponse?.exception) {
        throw new Error(
          attemptsResponse.message || "Không thể lấy lịch sử làm bài.",
        );
      }

      const loadedAttempts = Array.isArray(attemptsResponse?.attempts)
        ? attemptsResponse.attempts
        : [];

      setAttempts(loadedAttempts);
    } catch (error: any) {
      console.error("EXAM DETAIL ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể tải thông tin bài thi.");
    } finally {
      setLoading(false);
    }
  }, [quizid]);

  useFocusEffect(
    useCallback(() => {
      const timeoutId = setTimeout(() => {
        void loadQuizData();
      }, 0);

      return () => clearTimeout(timeoutId);
    }, [loadQuizData]),
  );

  // 3 LẦN GẦN NHẤT

  const recentAttempts = useMemo(() => {
    return [...attempts]
      .sort((a, b) => {
        const timeA = a.timemodified || a.timefinish || a.timestart || 0;

        const timeB = b.timemodified || b.timefinish || b.timestart || 0;

        return timeB - timeA;
      })
      .slice(0, 3);
  }, [attempts]);

  const inProgressAttempt = useMemo(
    () =>
      attempts
        .filter(
          (attempt) =>
            String(attempt.state).toLowerCase() === "inprogress" &&
            Number.isInteger(Number(attempt.id)) &&
            Number(attempt.id) > 0,
        )
        .sort(
          (a, b) =>
            (b.timemodified || b.timestart || 0) -
            (a.timemodified || a.timestart || 0),
        )[0],
    [attempts],
  );

  // FORMAT TIME

  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return "Chưa xác định";
    }

    return new Date(timestamp * 1000).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) {
      return "";
    }

    return new Date(timestamp * 1000).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ATTEMPT STATUS

  const getAttemptStatus = (state?: string) => {
    switch (state) {
      case "finished":
        return {
          label: "Đã hoàn thành",
          color: COLORS.success,
          background: "#EEF8F2",
          icon: "checkmark-circle-outline" as const,
        };

      case "inprogress":
        return {
          label: "Đang làm",
          color: COLORS.warning,
          background: "#FFF8E8",
          icon: "time-outline" as const,
        };

      case "overdue":
        return {
          label: "Quá hạn",
          color: COLORS.error,
          background: "#FFF1F1",
          icon: "alert-circle-outline" as const,
        };

      case "abandoned":
        return {
          label: "Đã bỏ",
          color: COLORS.textSecondary,
          background: COLORS.backgroundSoft,
          icon: "close-circle-outline" as const,
        };

      default:
        return {
          label: "Không xác định",
          color: COLORS.textSecondary,
          background: COLORS.backgroundSoft,
          icon: "information-circle-outline" as const,
        };
    }
  };

  // FORMAT TIMELIMIT

  const formattedTimeLimit = useMemo(() => {
    if (!timelimit || timelimit <= 0) {
      return "Không giới hạn";
    }

    const minutes = Math.floor(timelimit / 60);

    if (minutes < 60) {
      return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} giờ`;
    }

    return `${hours} giờ ${remainingMinutes} phút`;
  }, [timelimit]);

  // START QUIZ

  const handleStartQuiz = () => {
    if (!canAttempt && !inProgressAttempt) {
      Alert.alert(
        "Không thể làm bài",
        preventAccessReasons.length > 0
          ? preventAccessReasons.join("\n")
          : "Bạn không được phép làm bài thi này.",
      );

      return;
    }

    navigation.navigate("Exam", {
      courseid: Number(courseid),
      quizid: Number(quizid),
      quizName,
      questionCount,
      ...(inProgressAttempt ? { attemptid: Number(inProgressAttempt.id) } : {}),
    });
  };

  // LOADING

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Chi tiết bài thi" showBack />

        <Loading message="Đang tải thông tin bài thi..." />
      </View>
    );
  }

  // UI

  return (
    <View style={styles.container}>
      <AppHeader title="Chi tiết bài thi" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* SUMMARY CARD */}

        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="document-text-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {quizName}
            </Text>

            <View style={styles.summaryMeta}>
              <View style={styles.summaryMetaItem}>
                <Ionicons
                  name="help-circle-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />

                <Text style={styles.summaryMetaText}>
                  {questionCount != null
                    ? `${questionCount} câu hỏi`
                    : "Chưa xác định số câu"}
                </Text>
              </View>

              <View style={styles.summaryMetaItem}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />

                <Text style={styles.summaryMetaText}>{formattedTimeLimit}</Text>
              </View>
            </View>
          </View>
        </AppCard>

        {/* THÔNG TIN BÀI THI */}

        <View style={styles.infoHeader}>
          <Text style={styles.sectionTitle}>Thông tin bài thi</Text>
        </View>

        <AppCard style={styles.infoCard}>
          <InfoRow
            icon="document-text-outline"
            label="Số câu hỏi"
            value={
              questionCount != null ? `${questionCount} câu` : "Chưa xác định"
            }
          />

          <InfoRow
            icon="time-outline"
            label="Thời gian làm bài"
            value={formattedTimeLimit}
          />

          <InfoRow
            icon="repeat-outline"
            label="Số lần đã làm"
            value={attempts.length > 0 ? `${attempts.length} lần` : "Chưa làm"}
          />

          <InfoRow
            icon="shield-checkmark-outline"
            label="Quyền truy cập"
            value={canAttempt ? "Được phép làm bài" : "Không được phép"}
            valueColor={canAttempt ? COLORS.success : COLORS.error}
            last
          />
        </AppCard>

        {/* ACCESS WARNING */}

        {!canAttempt && preventAccessReasons.length > 0 && (
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color={COLORS.error}
              />
            </View>

            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Không thể bắt đầu bài thi</Text>

              {preventAccessReasons.map((reason, index) => (
                <Text key={`${reason}-${index}`} style={styles.warningText}>
                  • {reason}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* LỊCH SỬ LÀM BÀI */}

        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>Lịch sử làm bài</Text>

            <Text style={styles.sectionSubtitle}>3 lần làm bài gần nhất</Text>
          </View>
        </View>

        {recentAttempts.length === 0 ? (
          <AppCard style={styles.emptyHistory}>
            <View style={styles.emptyHistoryIcon}>
              <Ionicons
                name="time-outline"
                size={26}
                color={COLORS.textLight}
              />
            </View>

            <View style={styles.emptyHistoryContent}>
              <Text style={styles.emptyHistoryTitle}>
                Chưa có lịch sử làm bài
              </Text>

              <Text style={styles.emptyHistoryText}>
                Bạn chưa thực hiện bài thi này.
              </Text>
            </View>
          </AppCard>
        ) : (
          <AppCard style={styles.historyCard}>
            {recentAttempts.map((attempt, index) => {
              const status = getAttemptStatus(attempt.state);
              const isFinished = attempt.state === "finished";

              const timestamp =
                attempt.timemodified || attempt.timefinish || attempt.timestart;

              return (
                <TouchableOpacity
                  key={`${attempt.id}-${index}`}
                  style={[
                    styles.historyItem,
                    index === recentAttempts.length - 1 &&
                      styles.historyItemLast,
                  ]}
                  activeOpacity={isFinished ? 0.7 : 1}
                  disabled={!isFinished}
                  onPress={() => {
                    if (!isFinished || !attempt.id) return;
                    navigation.navigate("Result", {
                      courseid: Number(courseid),
                      quizid: Number(quizid),
                      quizName,
                      attemptid: attempt.id,
                    });
                  }}
                >
                  {/* ICON */}

                  <View style={styles.historyIcon}>
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>

                  {/* CONTENT */}

                  <View style={styles.historyContent}>
                    <Text style={styles.attemptTitle}>
                      Lần {attempt.attempt ?? index + 1}
                    </Text>

                    <View style={styles.historyMeta}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color={COLORS.textLight}
                      />

                      <Text style={styles.historyMetaText}>
                        {formatDate(timestamp)}
                      </Text>

                      {timestamp && (
                        <>
                          <View style={styles.historyDot} />

                          <Ionicons
                            name="time-outline"
                            size={12}
                            color={COLORS.textLight}
                          />

                          <Text style={styles.historyMetaText}>
                            {formatTime(timestamp)}
                          </Text>
                        </>
                      )}
                    </View>

                    {attempt.sumgrades !== undefined &&
                      attempt.sumgrades !== null && (
                        <Text style={styles.scoreText}>
                          Điểm: {Number(attempt.sumgrades).toFixed(1)}
                        </Text>
                      )}
                  </View>

                  {/* STATUS + CHEVRON */}

                  <View style={styles.historyRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: status.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={status.icon}
                        size={13}
                        color={status.color}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: status.color,
                          },
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>

                    {isFinished && (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.textLight}
                        style={styles.chevron}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </AppCard>
        )}
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.startFooter}>
        <AppButton
          title={inProgressAttempt ? "Tiếp tục bài thi" : "Bắt đầu làm bài"}
          onPress={handleStartQuiz}
          disabled={!canAttempt && !inProgressAttempt}
          style={styles.startButton}
        />
      </SafeAreaView>
    </View>
  );
}

// INFO ROW

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
  last = false,
}: InfoRowProps) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>

      <Text style={styles.infoLabel}>{label}</Text>

      <Text
        style={[styles.infoValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  content: {
    padding: 20,
    paddingBottom: 24,
  },

  // SUMMARY

  summaryCard: {
    borderRadius: 20,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 9,
  },

  summaryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  summaryMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryMetaText: {
    marginLeft: 5,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // SECTION

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  infoHeader: {
    marginTop: 23,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // INFO CARD

  infoCard: {
    marginTop: 11,
    padding: 0,
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  infoRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
  },

  // WARNING

  warningCard: {
    marginTop: 12,
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 13,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#F5D6D6",
  },

  warningIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FFEAEA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  warningContent: {
    flex: 1,
  },

  warningTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.error,
    marginBottom: 5,
  },

  warningText: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  // HISTORY

  historyHeader: {
    marginTop: 23,
    marginBottom: 11,
  },

  historyCard: {
    padding: 0,
    overflow: "hidden",
  },

  historyItem: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  historyItemLast: {
    borderBottomWidth: 0,
  },

  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  historyContent: {
    flex: 1,
    minWidth: 0,
  },

  attemptTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  historyMetaText: {
    fontSize: 10,
    color: COLORS.textLight,
    marginLeft: 4,
  },

  historyDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textLight,
    marginHorizontal: 6,
  },

  scoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primaryDark,
    marginTop: 5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 8,
    marginLeft: 6,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "700",
  },

  historyRight: {
    alignItems: "flex-end",
    gap: 6,
    marginLeft: 6,
  },

  chevron: {
    marginTop: 2,
  },

  // EMPTY HISTORY

  emptyHistory: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  emptyHistoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  emptyHistoryContent: {
    flex: 1,
  },

  emptyHistoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  emptyHistoryText: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  // START

  startButton: {
    marginTop: 0,
  },

  startFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
