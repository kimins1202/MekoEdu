import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getQuizzesByCourses,
  getUserAttempts,
  getUserCourses,
} from "../../api/quizApi";
import AppFilter from "../../components/common/AppFilter";
import AppHeader from "../../components/common/AppHeader";
import Loading from "../../components/common/Loading";
import COLORS from "../../constants/colors";
import { AppStackParamList } from "../../types/navigation";

type Course = {
  id: number;
  fullname: string;
  shortname?: string;
};

type Quiz = {
  id: number;
  course?: number;
  name?: string;
  grade?: number | string;
  sumgrades?: number | string;
};

type Attempt = {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  state: string;
  timestart: number;
  timefinish?: number;
  timemodified?: number;
  sumgrades?: number | null;
};

type HistoryItem = Attempt & {
  quizName: string;
  courseId: number;
  courseName: string;
  quizGradeMax: number;
  quizSumGrades: number;
};

type SortType = "newest" | "oldest";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const PAGE_SIZE = 5;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [sortType, setSortType] = useState<SortType>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userid");

      setLoading(true);
      setError("");

      if (!storedUserId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      const userId = Number(storedUserId);

      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error("User ID không hợp lệ.");
      }

      const coursesResponse = await getUserCourses(userId);

      if (coursesResponse?.exception) {
        throw new Error(
          coursesResponse.message || "Không thể lấy danh sách khóa học.",
        );
      }

      const courseData: Course[] = Array.isArray(coursesResponse)
        ? coursesResponse
        : [];

      setCourses(courseData);

      if (courseData.length === 0) {
        setQuizzes([]);
        setHistory([]);
        setCurrentPage(1);
        return;
      }

      const courseIds = courseData
        .map((course) => Number(course.id))
        .filter((courseId) => Number.isFinite(courseId) && courseId > 0);

      if (courseIds.length === 0) {
        setQuizzes([]);
        setHistory([]);
        setCurrentPage(1);
        return;
      }

      const quizzesResponse = await getQuizzesByCourses(courseIds);

      if (quizzesResponse?.exception) {
        throw new Error(
          quizzesResponse.message || "Không thể lấy danh sách bài thi.",
        );
      }

      const quizzes: Quiz[] = Array.isArray(quizzesResponse?.quizzes)
        ? quizzesResponse.quizzes
        : [];

      setQuizzes(quizzes);

      if (quizzes.length === 0) {
        setHistory([]);
        setCurrentPage(1);
        return;
      }

      const courseMap = new Map<number, Course>();

      courseData.forEach((course) => {
        courseMap.set(Number(course.id), course);
      });

      const attemptResults = await Promise.all(
        quizzes.map(async (quiz) => {
          const quizId = Number(quiz.id);
          const courseId = Number(quiz.course);

          try {
            const response = await getUserAttempts(quizId, userId, "all");

            if (response?.exception) {
              console.error(`Quiz ${quizId} API error:`, response.message);
              return [];
            }

            if (!Array.isArray(response?.attempts)) {
              console.warn(`Quiz ${quizId} không có attempts array`, response);
              return [];
            }

            const course = courseMap.get(courseId);

            return response.attempts.map((attempt: Attempt) => ({
              ...attempt,
              quiz: quizId,
              quizName: quiz.name || "Bài kiểm tra",
              courseId,
              courseName: course?.fullname || course?.shortname || "Khóa học",
              quizGradeMax: Number(quiz.grade) || 0,
              quizSumGrades: Number(quiz.sumgrades) || 0,
            }));
          } catch (error: any) {
            console.error(
              `Không lấy được attempts của quiz ${quizId}:`,
              error?.message || error,
            );

            return [];
          }
        }),
      );

      const allAttempts: HistoryItem[] = attemptResults.flat();

      setHistory(allAttempts);
      setCurrentPage(1);
    } catch (error: any) {
      setError(error?.message || "Không thể tải lịch sử làm bài.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadHistory]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleCourseChange = (courseId: number | null) => {
    setSelectedCourseId(courseId);
    setSelectedQuizId(null);
    setCurrentPage(1);
  };

  const handleQuizChange = (quizId: number | null) => {
    setSelectedQuizId(quizId);
    setCurrentPage(1);
  };

  const handleSortChange = (type: SortType) => {
    setSortType(type);
    setCurrentPage(1);
  };

  const filteredHistory = useMemo(() => {
    const courseFiltered =
      selectedCourseId === null
        ? [...history]
        : history.filter((item) => item.courseId === selectedCourseId);
    const filtered =
      selectedQuizId === null
        ? courseFiltered
        : courseFiltered.filter((item) => item.quiz === selectedQuizId);

    return filtered.sort((a, b) => {
      const timeA = Number(a.timemodified || a.timefinish || a.timestart || 0);

      const timeB = Number(b.timemodified || b.timefinish || b.timestart || 0);

      return sortType === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [history, selectedCourseId, selectedQuizId, sortType]);

  const courseQuizzes = useMemo(
    () =>
      selectedCourseId === null
        ? []
        : quizzes.filter((quiz) => Number(quiz.course) === selectedCourseId),
    [quizzes, selectedCourseId],
  );

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedHistory = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, safeCurrentPage]);

  const startResult =
    filteredHistory.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;

  const endResult = Math.min(
    safeCurrentPage * PAGE_SIZE,
    filteredHistory.length,
  );

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, -1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        -1,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      -1,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      -1,
      totalPages,
    ];
  };

  const finishedAttempts = history.filter((item) => item.state === "finished");

  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return "Chưa xác định";
    }

    return new Date(timestamp * 1000).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (state: string) => {
    switch (String(state).toLowerCase()) {
      case "finished":
        return {
          text: "Đã hoàn thành",
          color: COLORS.success,
          background: "#EAF6EF",
          icon: "checkmark-circle-outline" as const,
        };

      case "inprogress":
        return {
          text: "Đang làm",
          color: COLORS.warning,
          background: "#FFF6E4",
          icon: "time-outline" as const,
        };

      case "overdue":
        return {
          text: "Quá hạn",
          color: COLORS.error,
          background: "#FCEDED",
          icon: "alert-circle-outline" as const,
        };

      case "abandoned":
        return {
          text: "Đã bỏ",
          color: COLORS.textLight,
          background: "#F2F4F5",
          icon: "close-circle-outline" as const,
        };

      default:
        return {
          text: state || "Không xác định",
          color: COLORS.textSecondary,
          background: "#F2F4F5",
          icon: "help-circle-outline" as const,
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Lịch sử làm bài" />
        <Loading message="Đang tải lịch sử..." />
      </View>
    );
  }

  const finishedCount = history.filter((i) => i.state === "finished").length;
  const inProgressCount = history.filter(
    (i) => i.state === "inprogress",
  ).length;

  return (
    <View style={styles.container}>
      <AppHeader title="Lịch sử làm bài" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.content}
      >
        {error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <Ionicons
                name="cloud-offline-outline"
                size={32}
                color={COLORS.error}
              />
            </View>
            <Text style={styles.emptyTitle}>Không thể tải dữ liệu</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadHistory}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.white} />
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* COURSE FILTER CHIPS */}
            <Text style={styles.filterTitle}>Lọc theo khóa học</Text>
            <AppFilter
              filters={[
                { key: "all", label: "Tất cả" },
                ...courses.map((course) => ({
                  key: String(course.id),
                  label: course.shortname || course.fullname,
                })),
              ]}
              activeFilter={
                selectedCourseId === null ? "all" : String(selectedCourseId)
              }
              onChange={(key) =>
                handleCourseChange(key === "all" ? null : Number(key))
              }
              style={styles.courseFilters}
            />

            {selectedCourseId !== null && courseQuizzes.length > 0 && (
              <>
                <Text style={styles.filterTitle}>Lọc theo bài thi</Text>
                <AppFilter
                  filters={[
                    {
                      key: "all",
                      label: "Tất cả bài thi",
                      count: history.filter(
                        (item) => item.courseId === selectedCourseId,
                      ).length,
                    },
                    ...courseQuizzes.map((quiz) => ({
                      key: String(quiz.id),
                      label: quiz.name || "Bài kiểm tra",
                      count: history.filter(
                        (item) =>
                          item.courseId === selectedCourseId &&
                          item.quiz === Number(quiz.id),
                      ).length,
                    })),
                  ]}
                  activeFilter={
                    selectedQuizId === null ? "all" : String(selectedQuizId)
                  }
                  onChange={(key) =>
                    handleQuizChange(key === "all" ? null : Number(key))
                  }
                  style={styles.quizFilters}
                />
              </>
            )}

            {/* HISTORY HEADER */}
            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.sectionTitle}>Bài đã làm</Text>
                <Text style={styles.resultCount}>
                  {filteredHistory.length === 0
                    ? "Không có kết quả"
                    : `${startResult}–${endResult} / ${filteredHistory.length} lượt`}
                </Text>
              </View>

              <View style={styles.sortBox}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortType === "newest" && styles.sortOptionActive,
                  ]}
                  onPress={() => handleSortChange("newest")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-down"
                    size={13}
                    color={
                      sortType === "newest"
                        ? COLORS.white
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortType === "newest" && styles.sortOptionTextActive,
                    ]}
                  >
                    Mới nhất
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    sortType === "oldest" && styles.sortOptionActive,
                  ]}
                  onPress={() => handleSortChange("oldest")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="arrow-up"
                    size={13}
                    color={
                      sortType === "oldest"
                        ? COLORS.white
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortType === "oldest" && styles.sortOptionTextActive,
                    ]}
                  >
                    Cũ nhất
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* EMPTY */}
            {paginatedHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons
                    name="document-text-outline"
                    size={32}
                    color={COLORS.textLight}
                  />
                </View>
                <Text style={styles.emptyTitle}>Chưa có lịch sử</Text>
                <Text style={styles.emptyText}>
                  Không tìm thấy lượt làm bài trong bộ lọc hiện tại.
                </Text>
              </View>
            ) : (
              <>
                {paginatedHistory.map((item) => {
                  const status = getStatus(item.state);
                  const rawScore = Number(item.sumgrades);
                  const computedScore =
                    item.sumgrades !== null && item.sumgrades !== undefined
                      ? item.quizSumGrades > 0 && item.quizGradeMax > 0
                        ? (rawScore / item.quizSumGrades) * item.quizGradeMax
                        : rawScore
                      : null;

                  const scorePercent =
                    computedScore !== null && item.quizGradeMax > 0
                      ? Math.min(100, (computedScore / item.quizGradeMax) * 100)
                      : 0;

                  const isFinished = item.state === "finished";

                  return (
                    <TouchableOpacity
                      key={`${item.id}-${item.attempt}`}
                      style={styles.resultCard}
                      activeOpacity={isFinished ? 0.75 : 1}
                      disabled={!isFinished}
                      onPress={() => {
                        if (!isFinished) return;
                        navigation.navigate("AnswerReview", {
                          attemptid: item.id,
                          quizid: item.quiz,
                          quizName: item.quizName,
                        });
                      }}
                    >
                      {/* LEFT ICON */}
                      <View style={styles.resultIconWrap}>
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>

                      {/* CENTER INFO */}
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle} numberOfLines={2}>
                          {item.quizName}
                        </Text>

                        <View style={styles.courseRow}>
                          <Ionicons
                            name="book-outline"
                            size={12}
                            color={COLORS.primary}
                          />
                          <Text style={styles.courseName} numberOfLines={1}>
                            {item.courseName}
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaBadge}>
                            <Ionicons
                              name="repeat-outline"
                              size={11}
                              color={COLORS.textLight}
                            />
                            <Text style={styles.metaText}>
                              Lần {item.attempt}
                            </Text>
                          </View>
                          <View style={styles.metaBadge}>
                            <Ionicons
                              name="calendar-outline"
                              size={11}
                              color={COLORS.textLight}
                            />
                            <Text style={styles.metaText}>
                              {formatDate(
                                item.timemodified ||
                                  item.timefinish ||
                                  item.timestart,
                              )}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: status.background },
                          ]}
                        >
                          <Ionicons
                            name={status.icon}
                            size={11}
                            color={status.color}
                          />
                          <Text
                            style={[styles.statusText, { color: status.color }]}
                          >
                            {status.text}
                          </Text>
                        </View>
                      </View>

                      {/* RIGHT SCORE */}
                      <View style={styles.scoreContainer}>
                        {computedScore !== null ? (
                          <>
                            <View style={styles.scoreCircleWrap}>
                              <Text style={styles.scoreValue}>
                                {computedScore.toFixed(1)}
                              </Text>
                              <Text style={styles.scoreMax}>
                                /
                                {item.quizGradeMax > 0
                                  ? item.quizGradeMax
                                  : "—"}
                              </Text>
                            </View>
                            {item.quizGradeMax > 0 && (
                              <View style={styles.scoreBar}>
                                <View
                                  style={[
                                    styles.scoreBarFill,
                                    {
                                      width: `${scorePercent}%` as any,
                                      backgroundColor:
                                        scorePercent >= 80
                                          ? COLORS.success
                                          : scorePercent >= 50
                                            ? COLORS.warning
                                            : COLORS.error,
                                    },
                                  ]}
                                />
                              </View>
                            )}
                          </>
                        ) : (
                          <Text style={styles.scoreDash}>—</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <View style={styles.paginationCard}>
                    <TouchableOpacity
                      style={[
                        styles.pageArrow,
                        currentPage === 1 && styles.pageArrowDisabled,
                      ]}
                      onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={17}
                        color={
                          currentPage === 1 ? COLORS.textLight : COLORS.primary
                        }
                      />
                    </TouchableOpacity>

                    <View style={styles.pageNumbers}>
                      {getPageNumbers().map((pageNumber, index) => {
                        if (pageNumber === -1) {
                          return (
                            <View
                              key={`ellipsis-${index}`}
                              style={styles.ellipsis}
                            >
                              <Text style={styles.ellipsisText}>•••</Text>
                            </View>
                          );
                        }
                        const active = pageNumber === currentPage;
                        return (
                          <TouchableOpacity
                            key={pageNumber}
                            style={[
                              styles.pageNumber,
                              active && styles.pageNumberActive,
                            ]}
                            onPress={() => setCurrentPage(pageNumber)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.pageNumberText,
                                active && styles.pageNumberTextActive,
                              ]}
                            >
                              {pageNumber}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.pageArrow,
                        currentPage === totalPages && styles.pageArrowDisabled,
                      ]}
                      onPress={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={
                          currentPage === totalPages
                            ? COLORS.textLight
                            : COLORS.primary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {totalPages > 1 && (
                  <Text style={styles.pageInfo}>
                    Trang {currentPage} / {totalPages}
                  </Text>
                )}
              </>
            )}
          </>
        )}
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
    padding: 18,
    paddingBottom: 40,
  },

  // ── SUMMARY CARD ──────────────────────────────
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },

  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },

  summaryNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },

  summaryLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: "600",
  },

  summaryDivider: {
    width: 1,
    height: 52,
    backgroundColor: COLORS.border,
  },

  // ── FILTER ──────────────────────────────────
  filterTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  courseFilters: {
    gap: 8,
    paddingBottom: 20,
  },

  quizFilters: {
    gap: 8,
    paddingBottom: 20,
  },

  // ── HEADER ──────────────────────────────────
  historyHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  resultCount: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.textLight,
  },

  sortBox: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: "#E4EDE8",
    gap: 2,
  },

  sortOption: {
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  sortOptionActive: {
    backgroundColor: COLORS.primary,
  },

  sortOptionText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  sortOptionTextActive: {
    color: COLORS.white,
  },

  // ── RESULT CARD ──────────────────────────────
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  resultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EBF5EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  resultInfo: {
    flex: 1,
    minWidth: 0,
  },

  resultTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
  },

  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  courseName: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 5,
    flexWrap: "wrap",
  },

  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.backgroundSoft,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  metaText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 7,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // ── SCORE ──────────────────────────────────
  scoreContainer: {
    minWidth: 52,
    alignItems: "center",
    marginLeft: 10,
    gap: 6,
  },

  scoreCircleWrap: {
    alignItems: "center",
  },

  scoreValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 24,
  },

  scoreMax: {
    fontSize: 10,
    color: COLORS.textLight,
    fontWeight: "600",
  },

  scoreBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E4EDE8",
    overflow: "hidden",
  },

  scoreBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  scoreDash: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.textLight,
  },

  // ── PAGINATION ──────────────────────────────
  paginationCard: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pageArrow: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#EAF6EF",
    justifyContent: "center",
    alignItems: "center",
  },

  pageArrowDisabled: {
    backgroundColor: "#F1F3F2",
  },

  pageNumbers: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginHorizontal: 6,
  },

  pageNumber: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 5,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  pageNumberActive: {
    backgroundColor: COLORS.primary,
  },

  pageNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },

  pageNumberTextActive: {
    color: COLORS.white,
  },

  ellipsis: {
    width: 24,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  ellipsisText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textLight,
  },

  pageInfo: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 10,
    color: COLORS.textLight,
  },

  // ── EMPTY / ERROR ───────────────────────────
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  errorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5DADA",
  },

  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FDF0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  emptyText: {
    marginTop: 7,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.white,
  },
});
