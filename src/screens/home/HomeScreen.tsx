import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "../../components/common/AppHeader";
import EmptyState from "../../components/common/EmptyState";
import Loading from "../../components/common/Loading";
import CourseItem from "../../components/course/CourseItem";
import StatisticCard from "../../components/result/StatisticCard";

import COLORS from "../../constants/colors";

import {
  getQuizzesByCourses,
  getSiteInfo,
  getUserAttempts,
  getUserCourses,
} from "../../api/quizApi";

import { AppStackParamList, MainTabParamList } from "../../types/navigation";

interface Course {
  id: number;
  fullname: string;
  shortname?: string;
  progress?: number;
  lastaccess?: number;
}

interface SiteInfo {
  userid?: number;
  firstname?: string;
  lastname?: string;
  fullname?: string;
}

interface Quiz {
  id: number;
  course?: number;
  name?: string;
}

interface QuizAttempt {
  id: number;
  quiz?: number;
  attempt?: number;
  state?: string;
  timestart?: number;
  timefinish?: number;
  timemodified?: number;
  sumgrades?: number;
}

interface RecentAttempt extends QuizAttempt {
  quizName: string;
}

type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Home">,
  NativeStackNavigationProp<AppStackParamList, "MainTabs">
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();

  const [user, setUser] = useState<SiteInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomeData = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("userid");

      if (!storedUserId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      const userId = Number(storedUserId);

      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error("User ID không hợp lệ.");
      }

      const [siteInfoResponse, coursesResponse] = await Promise.all([
        getSiteInfo(),
        getUserCourses(userId),
      ]);

      if (siteInfoResponse?.exception) {
        throw new Error(
          siteInfoResponse.message || "Không thể lấy thông tin người dùng.",
        );
      }

      if (coursesResponse?.exception) {
        throw new Error(
          coursesResponse.message || "Không thể lấy danh sách khóa học.",
        );
      }

      const courseData: Course[] = Array.isArray(coursesResponse)
        ? coursesResponse
        : [];

      setUser(siteInfoResponse);

      const sortedCourses = [...courseData].sort(
        (a, b) => Number(b.lastaccess || 0) - Number(a.lastaccess || 0),
      );

      setCourses(sortedCourses);

      if (courseData.length === 0) {
        setQuizCount(0);
        setRecentAttempts([]);
        return;
      }

      const courseIds = courseData
        .map((course) => Number(course.id))
        .filter((courseId) => Number.isFinite(courseId) && courseId > 0);

      if (courseIds.length === 0) {
        setQuizCount(0);
        setRecentAttempts([]);
        return;
      }

      const quizzesResponse = await getQuizzesByCourses(courseIds);

      if (quizzesResponse?.exception) {
        setQuizCount(0);
        setRecentAttempts([]);
        return;
      }

      const quizzes: Quiz[] = Array.isArray(quizzesResponse?.quizzes)
        ? quizzesResponse.quizzes
        : [];

      setQuizCount(quizzes.length);

      if (quizzes.length === 0) {
        setRecentAttempts([]);
        return;
      }

      const attemptResults = await Promise.all(
        quizzes.map(async (quiz) => {
          try {
            const response = await getUserAttempts(
              Number(quiz.id),
              userId,
              "all",
            );

            if (response?.exception || !Array.isArray(response?.attempts)) {
              return [];
            }

            return response.attempts.map((attempt: QuizAttempt) => ({
              ...attempt,
              quiz: Number(quiz.id),
              quizName: quiz.name || "Bài kiểm tra",
            }));
          } catch {
            return [];
          }
        }),
      );

      const allAttempts: RecentAttempt[] = attemptResults.flat();

      const sortedAttempts = allAttempts.sort((a, b) => {
        const timeA = Number(
          a.timemodified || a.timefinish || a.timestart || 0,
        );

        const timeB = Number(
          b.timemodified || b.timefinish || b.timestart || 0,
        );

        return timeB - timeA;
      });

      setRecentAttempts(sortedAttempts.slice(0, 3));
    } catch (error: any) {
      Alert.alert(
        "Không thể tải dữ liệu",
        error?.message || "Đã xảy ra lỗi khi tải trang chủ.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const getUserName = () => {
    if (!user) {
      return "Bạn";
    }

    if (user.fullname) {
      return user.fullname;
    }

    const fullname = [user.firstname, user.lastname].filter(Boolean).join(" ");

    return fullname || "Bạn";
  };

  const getCourseProgress = (course: Course): number | null => {
    if (
      typeof course.progress === "number" &&
      Number.isFinite(course.progress)
    ) {
      return Math.max(0, Math.min(100, Math.round(course.progress)));
    }

    return null;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) {
      return "--";
    }

    const date = new Date(timestamp * 1000);

    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getAttemptStatus = (state?: string) => {
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
        return "Chưa hoàn thành";
    }
  };

  const goToCourses = () => {
    navigation.navigate("Courses");
  };

  const goToHistory = () => {
    navigation.navigate("History");
  };

  const goToSettings = () => {
    navigation.navigate("Settings");
  };

  const goToExamList = (courseId: number) => {
    navigation.navigate("ExamList", {
      courseid: courseId,
    });
  };

  const goToAttemptQuiz = (attempt: RecentAttempt) => {
    if (!attempt.quiz) {
      return;
    }

    navigation.navigate("Exam", {
      quizid: Number(attempt.quiz),
      quizName: attempt.quizName,
    });
  };

  if (loading) {
    return <Loading message="Đang tải trang chủ..." />;
  }

  const recentCourses = courses.slice(0, 3);

  const firstCourse = recentCourses[0];

  const firstCourseProgress = firstCourse
    ? getCourseProgress(firstCourse)
    : null;

  return (
    <View style={styles.container}>
      <AppHeader title="Trang chủ" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <View style={styles.greetingContent}>
            <Text style={styles.hello}>Xin chào 👋</Text>

            <Text style={styles.name} numberOfLines={1}>
              {getUserName()}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate("Notification")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={COLORS.primaryDark}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatar}
              onPress={goToSettings}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color={COLORS.primaryDark}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsRow}>
          <StatisticCard
            icon="book-outline"
            value={courses.length}
            label="Khóa học"
            onPress={goToCourses}
          />

          <StatisticCard
            icon="document-text-outline"
            value={quizCount}
            label="Bài kiểm tra"
            onPress={() => {
              if (firstCourse) {
                goToExamList(firstCourse.id);
              } else {
                goToCourses();
              }
            }}
          />

          <StatisticCard
            icon="trending-up-outline"
            value={
              firstCourseProgress !== null ? `${firstCourseProgress}%` : "--"
            }
            label="Thống kê"
            onPress={() => navigation.navigate("Statistics")}
          />
        </View>

        {/* Recent Courses */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Khóa học gần đây</Text>

          <TouchableOpacity onPress={goToCourses} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {recentCourses.length > 0 ? (
          <View style={styles.courseList}>
            {recentCourses.map((course) => (
              <View key={course.id} style={styles.courseWrapper}>
                <CourseItem
                  courseName={course.fullname}
                  shortname={course.shortname}
                  onPress={() => goToExamList(course.id)}
                />

                {(() => {
                  const progress = getCourseProgress(course);

                  if (progress === null) {
                    return null;
                  }

                  return (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Tiến độ</Text>

                        <Text style={styles.progressValue}>{progress}%</Text>
                      </View>

                      <View style={styles.progressBackground}>
                        <View
                          style={[
                            styles.progress,
                            {
                              width: `${progress}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })()}
              </View>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="school-outline"
            title="Chưa có khóa học"
            message="Bạn hiện chưa được đăng ký khóa học nào."
            buttonText="Xem khóa học"
            onPress={goToCourses}
          />
        )}

        {/* Recent History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử làm bài</Text>

          <TouchableOpacity onPress={goToHistory} activeOpacity={0.7}>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {recentAttempts.length > 0 ? (
          <View style={styles.historyList}>
            {recentAttempts.map((attempt, index) => (
              <TouchableOpacity
                key={`${attempt.id}-${index}`}
                style={styles.historyItem}
                onPress={() => goToAttemptQuiz(attempt)}
                activeOpacity={0.8}
              >
                <View style={styles.historyIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle} numberOfLines={2}>
                    {attempt.quizName}
                  </Text>

                  <View style={styles.historyMeta}>
                    <Text style={styles.historyDate}>
                      {formatDate(
                        attempt.timemodified ||
                          attempt.timefinish ||
                          attempt.timestart,
                      )}
                    </Text>

                    <View style={styles.historyDot} />

                    <Text style={styles.historyStatus}>
                      {getAttemptStatus(attempt.state)}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="time-outline" size={32} color={COLORS.textLight} />

            <Text style={styles.emptyHistoryText}>Chưa có lịch sử làm bài</Text>
          </View>
        )}

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, styles.quickTitle]}>
          Truy cập nhanh
        </Text>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="book-outline"
            title="Khóa học"
            onPress={goToCourses}
          />

          <QuickAction
            icon="clipboard-outline"
            title="Bài kiểm tra"
            onPress={() => {
              if (firstCourse) {
                goToExamList(firstCourse.id);
              } else {
                goToCourses();
              }
            }}
          />

          <QuickAction
            icon="stats-chart-outline"
            title="Lịch sử"
            onPress={goToHistory}
          />

          <QuickAction
            icon="person-outline"
            title="Cài đặt"
            onPress={goToSettings}
          />
        </View>
      </ScrollView>
    </View>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

function QuickAction({ icon, title, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.75}
    >
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

  greetingContent: {
    flex: 1,
    marginRight: 15,
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

  courseList: {
    marginBottom: 25,
  },

  courseWrapper: {
    marginBottom: 10,
  },

  progressContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    paddingBottom: 15,
    marginTop: -12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  progressValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },

  progressBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },

  progress: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },

  historyList: {
    marginBottom: 25,
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  historyIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  historyContent: {
    flex: 1,
    marginRight: 10,
  },

  historyTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: COLORS.text,
  },

  historyMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  historyDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  historyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textLight,
    marginHorizontal: 7,
  },

  historyStatus: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },

  emptyHistory: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    minHeight: 110,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  emptyHistoryText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
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
