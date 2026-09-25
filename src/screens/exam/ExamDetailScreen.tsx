// src/screens/ExamDetailScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/common/AppHeader";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";
import { listOfflineExams } from "@/services/examStorageService";
import { isOfflineError } from "@/services/syncService";

import { getQuizAccessInformation, getUserAttempts } from "../../api/quizApi";

export default function ExamDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // =========================================
  // THÔNG TIN BÀI THI
  // =========================================

  const { quizid, quizName, questionCount, timelimit } = route.params;

  // =========================================
  // STATE
  // =========================================

  const [loading, setLoading] = useState(true);
  const [offlineResume, setOfflineResume] = useState(false);

  // API 6
  const [canAttempt, setCanAttempt] = useState(false);
  const [preventAccessReasons, setPreventAccessReasons] = useState<string[]>(
    [],
  );

  // API 7
  const [attempts, setAttempts] = useState<any[]>([]);

  // =========================================
  // LOAD DATA
  // =========================================

  useEffect(() => {
    loadExamData();
  }, []);

  const loadExamData = async () => {
    try {
      setLoading(true);

      // =====================================
      // LẤY USER ID
      // =====================================

      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy User ID. Vui lòng đăng nhập lại.");
        return;
      }

      // =====================================
      // API 6
      // mod_quiz_get_quiz_access_information
      // =====================================

      const accessResponse = await getQuizAccessInformation(quizid);

      setCanAttempt(accessResponse?.canattempt ?? false);

      setPreventAccessReasons(accessResponse?.preventaccessreasons ?? []);

      // =====================================
      // API 7
      // mod_quiz_get_user_attempts
      // =====================================

      const attemptsResponse = await getUserAttempts(
        quizid,
        Number(userId),
        "all",
      );

      setAttempts(attemptsResponse?.attempts ?? []);
    } catch (error) {
      if (isOfflineError(error)) {
        try {
          const userid = Number(await AsyncStorage.getItem("userid"));
          const cached = (await listOfflineExams(userid)).some((exam) =>
            exam.quizid === Number(quizid) && !exam.submitted && Object.keys(exam.pages).length > 0,
          );
          if (cached) {
            setOfflineResume(true);
            setCanAttempt(true);
            return;
          }
        } catch { /* Fall through to the visible load error. */ }
      }
      console.error("EXAM DETAIL ERROR:", error);

      Alert.alert("Lỗi", "Không thể tải thông tin bài thi.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ATTEMPT STATUS
  // =========================================

  const getAttemptStatus = (state: string) => {
    switch (state) {
      case "finished":
        return "Đã hoàn thành";

      case "inprogress":
        return "Đang làm";

      case "overdue":
        return "Quá hạn";

      case "abandoned":
        return "Đã bỏ";

      default:
        return state || "Không xác định";
    }
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) {
      return "Chưa xác định";
    }

    return new Date(timestamp * 1000).toLocaleString("vi-VN");
  };

  // =========================================
  // FORMAT TIME LIMIT
  // =========================================

  const formatTimeLimit = (seconds: number) => {
    if (!seconds || seconds <= 0) {
      return "Không giới hạn";
    }

    const hours = Math.floor(seconds / 3600);

    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours} giờ ${minutes} phút`;
    }

    if (hours > 0) {
      return `${hours} giờ`;
    }

    return `${minutes} phút`;
  };

  // =========================================
  // BẮT ĐẦU LÀM BÀI
  // GIỮ NGUYÊN LUỒNG CŨ
  // =========================================

  const handleStartQuiz = () => {
    if (!canAttempt) {
      Alert.alert(
        "Không thể làm bài",
        preventAccessReasons.length > 0
          ? preventAccessReasons.join("\n")
          : "Bạn không được phép làm bài thi này.",
      );

      return;
    }

    Alert.alert(
      "Giám sát màn hình khi thi",
      "Ứng dụng ghi nhận số lần rời màn hình và lưu nhật ký trên thiết bị. Chụp/quay màn hình sẽ bị chặn trên điện thoại được hỗ trợ. Bạn cần nộp bài trước khi quay lại màn hình khác.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Bắt đầu", onPress: () => navigation.navigate("Exam", { quizid, quizName }) },
      ],
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading message="Đang tải thông tin bài thi..." />
      </View>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <View style={styles.container}>
      <AppHeader
        title="Chi tiết bài thi"
        subtitle="Thông tin và lịch sử làm bài"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =====================================
            QUIZ HEADER CARD
        ===================================== */}

        <View style={styles.quizCard}>
          <View style={styles.quizIcon}>
            <Ionicons
              name="document-text-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.quizInfo}>
            <Text style={styles.quizName} numberOfLines={3}>
              {quizName}
            </Text>

            <View style={styles.quizIdRow}>
              <Ionicons
                name="pricetag-outline"
                size={13}
                color={COLORS.textLight}
              />

              <Text style={styles.quizId}>Quiz ID: {quizid}</Text>
            </View>
          </View>
        </View>

        {/* =====================================
            THÔNG TIN BÀI THI
        ===================================== */}

        <Text style={styles.sectionTitle}>Thông tin bài thi</Text>

        <View style={styles.infoCard}>
          {/* Thời gian */}

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={21} color={COLORS.primary} />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Thời gian làm bài</Text>

              <Text style={styles.infoValue}>{formatTimeLimit(timelimit)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Số câu */}

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="help-circle-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số câu hỏi</Text>

              <Text style={styles.infoValue}>
                {questionCount !== undefined
                  ? `${questionCount} câu`
                  : "Chưa xác định"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Số lần làm */}

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="repeat-outline"
                size={21}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số lần đã làm</Text>

              <Text style={styles.infoValue}>
                {attempts.length > 0 ? `${attempts.length} lần` : "Chưa làm"}
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================
            QUYỀN TRUY CẬP
        ===================================== */}

        <Text style={styles.sectionTitle}>Quyền truy cập</Text>

        <View
          style={[
            styles.accessCard,
            canAttempt ? styles.accessCardSuccess : styles.accessCardError,
          ]}
        >
          <View
            style={[
              styles.accessIcon,
              canAttempt ? styles.accessIconSuccess : styles.accessIconError,
            ]}
          >
            <Ionicons
              name={canAttempt ? "checkmark-circle" : "close-circle"}
              size={27}
              color={canAttempt ? COLORS.primary : COLORS.error}
            />
          </View>

          <View style={styles.accessContent}>
            <Text
              style={[
                styles.accessTitle,
                {
                  color: canAttempt ? COLORS.primary : COLORS.error,
                },
              ]}
            >
              {canAttempt ? "Có thể làm bài" : "Không thể làm bài"}
            </Text>

            <Text style={styles.accessText}>
              {canAttempt
                ? "Bạn được phép truy cập bài thi này."
                : "Bạn hiện không được phép truy cập bài thi."}
            </Text>
          </View>
        </View>

        {/* =====================================
            LÝ DO KHÔNG ĐƯỢC TRUY CẬP
        ===================================== */}

        {!canAttempt && preventAccessReasons.length > 0 && (
          <View style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={COLORS.error}
              />

              <Text style={styles.warningTitle}>Lý do không thể truy cập</Text>
            </View>

            {preventAccessReasons.map((reason, index) => (
              <View key={index} style={styles.reasonRow}>
                <View style={styles.reasonDot} />

                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        )}

        {/* =====================================
            LỊCH SỬ LÀM BÀI
        ===================================== */}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Lịch sử làm bài</Text>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{attempts.length}</Text>
          </View>
        </View>

        <View style={styles.historyCard}>
          {attempts.length === 0 ? (
            <View style={styles.emptyHistory}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="document-outline"
                  size={30}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>Chưa có lịch sử làm bài</Text>

              <Text style={styles.emptyText}>
                Bạn chưa thực hiện bài thi này.
              </Text>
            </View>
          ) : (
            attempts.map((attempt, index) => (
              <View
                key={attempt.id ?? index}
                style={[
                  styles.attemptItem,
                  index === attempts.length - 1 && styles.lastAttempt,
                ]}
              >
                {/* Icon */}

                <View
                  style={[
                    styles.attemptIcon,
                    attempt.state === "finished"
                      ? styles.attemptIconSuccess
                      : attempt.state === "inprogress"
                        ? styles.attemptIconProgress
                        : styles.attemptIconDefault,
                  ]}
                >
                  <Ionicons
                    name={
                      attempt.state === "finished"
                        ? "checkmark-outline"
                        : attempt.state === "inprogress"
                          ? "time-outline"
                          : "document-outline"
                    }
                    size={20}
                    color={
                      attempt.state === "finished"
                        ? COLORS.primary
                        : attempt.state === "inprogress"
                          ? COLORS.warning
                          : COLORS.textSecondary
                    }
                  />
                </View>

                {/* Content */}

                <View style={styles.attemptContent}>
                  <Text style={styles.attemptTitle}>
                    Lần {attempt.attempt ?? index + 1}
                  </Text>

                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Trạng thái:</Text>

                    <Text style={styles.statusValue}>
                      {getAttemptStatus(attempt.state)}
                    </Text>
                  </View>

                  {attempt.sumgrades !== undefined &&
                    attempt.sumgrades !== null && (
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="star-outline"
                          size={14}
                          color={COLORS.textLight}
                        />

                        <Text style={styles.detailText}>
                          Điểm: {attempt.sumgrades}
                        </Text>
                      </View>
                    )}

                  {attempt.timestart ? (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="play-outline"
                        size={14}
                        color={COLORS.textLight}
                      />

                      <Text style={styles.detailText}>
                        Bắt đầu: {formatDate(attempt.timestart)}
                      </Text>
                    </View>
                  ) : null}

                  {attempt.timefinish && attempt.timefinish !== 0 ? (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="checkmark-outline"
                        size={14}
                        color={COLORS.textLight}
                      />

                      <Text style={styles.detailText}>
                        Kết thúc: {formatDate(attempt.timefinish)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* =====================================
            START BUTTON
            KHÔNG DISABLED
            GIỮ NGUYÊN BUSINESS FLOW
        ===================================== */}

        <TouchableOpacity
          style={[
            styles.startButton,
            !canAttempt && styles.startButtonDisabled,
          ]}
          onPress={handleStartQuiz}
          activeOpacity={0.85}
        >
          <View style={styles.startButtonContent}>
            <Ionicons
              name="play-circle-outline"
              size={23}
              color={COLORS.white}
            />

            <Text style={styles.startButtonText}>{offlineResume ? "Tiếp tục bài đã lưu offline" : "Bắt đầu làm bài"}</Text>

            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        {!canAttempt && (
          <Text style={styles.disabledHint}>
            Nhấn nút để xem lý do bạn chưa thể làm bài.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // =======================================
  // QUIZ CARD
  // =======================================

  quizCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 7,
    elevation: 2,
  },

  quizIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    backgroundColor: "#EAF6EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  quizInfo: {
    flex: 1,
  },

  quizName: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "700",
    color: COLORS.text,
  },

  quizIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  quizId: {
    marginLeft: 5,
    fontSize: 12,
    color: COLORS.textLight,
  },

  // =======================================
  // SECTION
  // =======================================

  sectionTitle: {
    marginTop: 25,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },

  // =======================================
  // INFO CARD
  // =======================================

  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  // =======================================
  // ACCESS
  // =======================================

  accessCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 17,
    borderWidth: 1,
  },

  accessCardSuccess: {
    backgroundColor: "#F0F9F3",
    borderColor: "#CBE8D4",
  },

  accessCardError: {
    backgroundColor: "#FFF5F5",
    borderColor: "#F3D1D1",
  },

  accessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  accessIconSuccess: {
    backgroundColor: "#DDF2E4",
  },

  accessIconError: {
    backgroundColor: "#FFE2E2",
  },

  accessContent: {
    flex: 1,
  },

  accessTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },

  accessText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  // =======================================
  // WARNING
  // =======================================

  warningCard: {
    marginTop: 10,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#F3D1D1",
  },

  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  warningTitle: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.error,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 7,
  },

  reasonDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.error,
    marginTop: 7,
    marginRight: 9,
  },

  reasonText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  // =======================================
  // HISTORY
  // =======================================

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  countBadge: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    marginLeft: 8,
  },

  countText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "700",
  },

  historyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  attemptItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  lastAttempt: {
    borderBottomWidth: 0,
  },

  attemptIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  attemptIconSuccess: {
    backgroundColor: "#EAF6EE",
  },

  attemptIconProgress: {
    backgroundColor: "#FFF7E8",
  },

  attemptIconDefault: {
    backgroundColor: COLORS.backgroundSoft,
  },

  attemptContent: {
    flex: 1,
  },

  attemptTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  statusLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginRight: 4,
  },

  statusValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  detailText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },

  // =======================================
  // EMPTY
  // =======================================

  emptyHistory: {
    alignItems: "center",
    paddingVertical: 35,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 5,
  },

  emptyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // =======================================
  // START BUTTON
  // =======================================

  startButton: {
    height: 56,
    marginTop: 28,
    borderRadius: 17,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },

  startButtonDisabled: {
    backgroundColor: "#AEB9B3",
    shadowOpacity: 0,
    elevation: 0,
  },

  startButtonContent: {
    width: "100%",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  startButtonText: {
    marginHorizontal: 10,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },

  disabledHint: {
    marginTop: 9,
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
  },

  // =======================================
  // LOADING
  // =======================================

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
});
