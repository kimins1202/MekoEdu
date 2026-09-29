import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
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
import AppHeader from "../../components/common/AppHeader";
import Loading from "../../components/common/Loading";
import COLORS from "../../constants/colors";

type Course = {
  id: number;
  fullname: string;
  shortname?: string;
};

type Quiz = {
  id: number;
  course?: number;
  name?: string;
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
};

type SortType = "newest" | "oldest";

const PAGE_SIZE = 5;

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [sortType, setSortType] = useState<SortType>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const storedUserId = await AsyncStorage.getItem("userid");

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
        setHistory([]);
        setCurrentPage(1);
        return;
      }

      const courseIds = courseData
        .map((course) => Number(course.id))
        .filter((courseId) => Number.isFinite(courseId) && courseId > 0);

      if (courseIds.length === 0) {
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
          try {
            const quizId = Number(quiz.id);
            const courseId = Number(quiz.course);

            const response = await getUserAttempts(quizId, userId, "all");

            if (response?.exception || !Array.isArray(response?.attempts)) {
              return [];
            }

            const course = courseMap.get(courseId);

            return response.attempts.map((attempt: Attempt) => ({
              ...attempt,
              quiz: quizId,
              quizName: quiz.name || "Bài kiểm tra",
              courseId,
              courseName: course?.fullname || course?.shortname || "Khóa học",
            }));
          } catch {
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
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleCourseChange = (courseId: number | null) => {
    setSelectedCourseId(courseId);
    setCurrentPage(1);
  };

  const handleSortChange = (type: SortType) => {
    setSortType(type);
    setCurrentPage(1);
  };

  const filteredHistory = useMemo(() => {
    const filtered =
      selectedCourseId === null
        ? [...history]
        : history.filter((item) => item.courseId === selectedCourseId);

    return filtered.sort((a, b) => {
      const timeA = Number(a.timemodified || a.timefinish || a.timestart || 0);

      const timeB = Number(b.timemodified || b.timefinish || b.timestart || 0);

      return sortType === "newest" ? timeB - timeA : timeA - timeB;
    });
  }, [history, selectedCourseId, sortType]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startResult =
    filteredHistory.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endResult = Math.min(currentPage * PAGE_SIZE, filteredHistory.length);

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
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="cloud-offline-outline"
                size={34}
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
            <Text style={styles.filterTitle}>Lọc theo khóa học</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.courseFilters}
            >
              <TouchableOpacity
                style={[
                  styles.courseChip,
                  selectedCourseId === null && styles.courseChipActive,
                ]}
                onPress={() => handleCourseChange(null)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="apps-outline"
                  size={15}
                  color={
                    selectedCourseId === null
                      ? COLORS.white
                      : COLORS.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.courseChipText,
                    selectedCourseId === null && styles.courseChipTextActive,
                  ]}
                >
                  Tất cả
                </Text>
              </TouchableOpacity>

              {courses.map((course) => {
                const active = selectedCourseId === Number(course.id);

                return (
                  <TouchableOpacity
                    key={course.id}
                    style={[
                      styles.courseChip,
                      active && styles.courseChipActive,
                    ]}
                    onPress={() => handleCourseChange(Number(course.id))}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="book-outline"
                      size={15}
                      color={active ? COLORS.white : COLORS.textSecondary}
                    />

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.courseChipText,
                        active && styles.courseChipTextActive,
                      ]}
                    >
                      {course.shortname || course.fullname}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.historyHeader}>
              <View>
                <Text style={styles.sectionTitle}>Bài đã làm</Text>

                <Text style={styles.resultCount}>
                  {filteredHistory.length === 0
                    ? "Không có kết quả"
                    : `Hiển thị ${startResult}-${endResult} / ${filteredHistory.length}`}
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
                    size={14}
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
                    size={14}
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

            {paginatedHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
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

                  return (
                    <View
                      key={`${item.id}-${item.attempt}`}
                      style={styles.resultCard}
                    >
                      <View style={styles.resultIcon}>
                        <Ionicons
                          name="document-text-outline"
                          size={21}
                          color={COLORS.primaryDark}
                        />
                      </View>

                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle} numberOfLines={2}>
                          {item.quizName}
                        </Text>

                        <View style={styles.courseRow}>
                          <Ionicons
                            name="book-outline"
                            size={13}
                            color={COLORS.primary}
                          />

                          <Text style={styles.courseName} numberOfLines={1}>
                            {item.courseName}
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="repeat-outline"
                              size={12}
                              color={COLORS.textLight}
                            />

                            <Text style={styles.metaText}>
                              Lần {item.attempt}
                            </Text>
                          </View>

                          <View style={styles.metaItem}>
                            <Ionicons
                              name="calendar-outline"
                              size={12}
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
                            {
                              backgroundColor: status.background,
                            },
                          ]}
                        >
                          <Ionicons
                            name={status.icon}
                            size={12}
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
                            {status.text}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.scoreContainer}>
                        <Text style={styles.score}>
                          {item.sumgrades !== null &&
                          item.sumgrades !== undefined
                            ? Number(item.sumgrades).toFixed(1)
                            : "—"}
                        </Text>

                        <Text style={styles.scoreLabel}>điểm</Text>
                      </View>
                    </View>
                  );
                })}

                {totalPages > 1 && (
                  <View style={styles.paginationCard}>
                    <TouchableOpacity
                      style={[
                        styles.pageArrow,
                        currentPage === 1 && styles.pageArrowDisabled,
                      ]}
                      onPress={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
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
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
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

  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E5EEE9",
  },

  overviewIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#EAF6EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  overviewInfo: {
    flex: 1,
  },

  overviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  overviewText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  overviewRight: {
    alignItems: "flex-end",
    paddingLeft: 12,
  },

  overviewNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  overviewLabel: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textLight,
  },

  filterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },

  courseFilters: {
    gap: 8,
    paddingBottom: 20,
  },

  courseChip: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  courseChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  courseChipText: {
    maxWidth: 145,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  courseChipTextActive: {
    color: COLORS.white,
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 13,
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
    borderRadius: 13,
    backgroundColor: "#E7EFEA",
    gap: 2,
  },

  sortOption: {
    height: 31,
    paddingHorizontal: 9,
    borderRadius: 10,
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

  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E7EEE9",
  },

  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
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
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 5,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 1,
  },

  metaText: {
    fontSize: 9,
    color: COLORS.textLight,
  },

  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "700",
  },

  scoreContainer: {
    minWidth: 43,
    alignItems: "center",
    marginLeft: 8,
  },

  score: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.primaryDark,
  },

  scoreLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 1,
  },

  paginationCard: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E7EEE9",
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

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E7EEE9",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 13,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 11,
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
