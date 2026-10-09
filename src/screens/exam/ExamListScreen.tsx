import { Ionicons } from "@expo/vector-icons";

import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/common/AppHeader";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";
import { getCourseContents } from "@/api/courseApi";
import type { CourseSection } from "@/types/course";

import { getQuizQuestionCount, getQuizzesByCourses } from "../../api/quizApi";

import type { AppStackParamList } from "../../types/navigation";

// =========================
// TYPES
// =========================

type ExamListRouteProp = RouteProp<AppStackParamList, "ExamList">;

type NavigationProp = NativeStackNavigationProp<AppStackParamList, "ExamList">;

type Exam = {
  id: number;
  name: string;
  questioncount?: number | null;
  timelimit?: number;
  section?: number;
  coursemodule?: number;
};

// =========================
// SCREEN
// =========================

export default function ExamListScreen() {
  const route = useRoute<ExamListRouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const { courseid } = route.params;

  const [exams, setExams] = useState<Exam[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const sections = useMemo(() => {
    const remaining = new Map(exams.map((exam) => [Number(exam.id), exam]));
    const groups: { key: string; title: string; data: Exam[]; count: number }[] = [];

    for (const section of courseSections) {
      const data: Exam[] = [];
      for (const module of section.modules ?? []) {
        if (module.modname !== "quiz") continue;
        const exam = remaining.get(Number(module.instance));
        if (exam) {
          data.push(exam);
          remaining.delete(Number(exam.id));
        }
      }
      // Quiz metadata can still identify the section when modules are omitted.
      for (const exam of remaining.values()) {
        if (exam.section != null && Number(exam.section) === Number(section.section)) {
          data.push(exam);
          remaining.delete(Number(exam.id));
        }
      }
      if (data.length) {
        groups.push({
          key: `section-${section.id}`,
          title: section.name?.trim() || (section.section === 0 ? "Phần chung" : `Phần ${section.section}`),
          data,
          count: data.length,
        });
      }
    }

    for (const exam of remaining.values()) {
      const key = exam.section == null ? "other" : `fallback-${exam.section}`;
      let group = groups.find((item) => item.key === key);
      if (!group) {
        group = {
          key,
          title: exam.section == null ? "Bài thi khác" : Number(exam.section) === 0 ? "Phần chung" : `Phần ${exam.section}`,
          data: [],
          count: 0,
        };
        groups.push(group);
      }
      group.data.push(exam);
      group.count++;
    }

    return groups.map((group) => ({
      ...group,
      data: collapsedSections.has(group.key) ? [] : group.data,
    }));
  }, [exams, courseSections, collapsedSections]);

  // LOAD EXAMS FROM API

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);

      // Lấy danh sách quiz của course
      const [quizData, contents] = await Promise.all([
        getQuizzesByCourses([courseid]),
        getCourseContents(courseid).catch((error) => {
          console.error("Lỗi lấy section khóa học:", error);
          return [] as CourseSection[];
        }),
      ]);

      const quizzes = quizData?.quizzes ?? [];

      // Lấy số câu hỏi của từng quiz
      const quizzesWithQuestionCount = await Promise.all(
        quizzes.map(async (quiz: Exam) => {
          try {
            const questioncount = await getQuizQuestionCount(Number(quiz.id));

            return {
              ...quiz,
              questioncount,
            };
          } catch (error) {
            console.error(`Lỗi lấy số câu quiz ${quiz.id}:`, error);

            return {
              ...quiz,
              questioncount: null,
            };
          }
        }),
      );

      setExams(quizzesWithQuestionCount);
      setCourseSections(contents);
      setCollapsedSections(new Set());
    } catch (error: any) {
      console.error("Lỗi load exams:", error?.response?.data || error?.message);

      setExams([]);
      setCourseSections([]);
    } finally {
      setLoading(false);
    }
  }, [courseid]);

  // LOAD KHI MỞ SCREEN

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadExams();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadExams]);

  // INITIAL LOADING

  if (loading && exams.length === 0) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.container}>
        <AppHeader title="Danh sách bài thi" showBack />

        <Loading message="Đang tải danh sách bài thi..." />
      </SafeAreaView>
    );
  }

  // UI

  return (
    <SafeAreaView edges={["bottom"]} style={styles.container}>
      {/* HEADER */}

      <AppHeader
        title="Danh sách bài thi"
        subtitle={`${exams.length} bài kiểm tra`}
        showBack
      />

      {/* DANH SÁCH BÀI THI */}

      {exams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="document-text-outline"
              size={38}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>Chưa có bài thi</Text>

          <Text style={styles.emptyText}>
            Hiện tại khóa học này chưa có bài kiểm tra nào.
          </Text>

          <TouchableOpacity
            style={styles.emptyRetryButton}
            onPress={loadExams}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={17} color={COLORS.white} />

            <Text style={styles.emptyRetryText}>Tải lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              style={styles.sectionHeader}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={section.title}
              accessibilityState={{ expanded: !collapsedSections.has(section.key) }}
              onPress={() => setCollapsedSections((current) => {
                const next = new Set(current);
                if (next.has(section.key)) next.delete(section.key);
                else next.add(section.key);
                return next;
              })}
            >
              <Ionicons
                name={collapsedSections.has(section.key) ? "chevron-forward" : "chevron-down"}
                size={20}
                color={COLORS.primary}
              />
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionCount}>{section.count} bài kiểm tra</Text>
              </View>
            </TouchableOpacity>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.examCard}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate("ExamDetail", {
                  courseid: Number(courseid),
                  quizid: Number(item.id),
                  quizName: item.name,
                  questionCount:
                    typeof item.questioncount === "number"
                      ? item.questioncount
                      : undefined,
                  timelimit: item.timelimit,
                })
              }
            >
              {/* ICON */}

              <View style={styles.examIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={25}
                  color={COLORS.primary}
                />
              </View>

              {/* CONTENT */}

              <View style={styles.examContent}>
                <Text style={styles.examName} numberOfLines={2}>
                  {item.name}
                </Text>

                {/* QUESTION COUNT */}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="help-circle-outline"
                    size={15}
                    color={COLORS.textLight}
                  />

                  <Text style={styles.examInfo}>
                    {typeof item.questioncount === "number"
                      ? `${item.questioncount} câu hỏi`
                      : "Chưa xác định số câu"}
                  </Text>
                </View>

                {/* TIME */}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={COLORS.textLight}
                  />

                  <Text style={styles.examInfo}>
                    {item.timelimit
                      ? `${Math.floor(item.timelimit / 60)} phút`
                      : "Không giới hạn thời gian"}
                  </Text>
                </View>
              </View>

              {/* ARROW */}

              <View style={styles.arrowContainer}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={COLORS.textLight}
                />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  // LIST

  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },

  examCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,

    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    marginBottom: 4,
  },

  sectionContent: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 24,
  },

  sectionCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  // ICON

  examIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  // CONTENT

  examContent: {
    flex: 1,
  },

  examName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  examInfo: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // ARROW

  arrowContainer: {
    marginLeft: 8,
  },

  // EMPTY

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 7,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },

  emptyRetryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 7,
  },

  emptyRetryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
