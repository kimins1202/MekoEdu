import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { getUserCourses } from "../../api/courseApi";
import AppHeader from "../../components/common/AppHeader";
import EmptyState from "../../components/common/EmptyState";
import Loading from "../../components/common/Loading";
import SearchBar from "../../components/common/SearchBar";
import CourseCard from "../../components/course/CourseCard";
import CourseFilter, {
  CourseFilterType,
} from "../../components/course/CourseFilter";
import COLORS from "../../constants/colors";
import { getCourseExamProgress } from "../../services/courseProgressService";
import type { AppStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type Course = {
  id: number;
  fullname: string;
  shortname: string;

  progress: number;

  completed: boolean;

  totalExams: number;

  completedExams: number;
};

export default function CourseListScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<CourseFilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const useridString = await AsyncStorage.getItem("userid");

      if (!useridString) {
        throw new Error("Không tìm thấy userid");
      }

      const userid = Number(useridString);

      if (!Number.isFinite(userid)) {
        throw new Error("Userid không hợp lệ");
      }

      const courseData = await getUserCourses(userid);

      if (!Array.isArray(courseData)) {
        setCourses([]);
        return;
      }

      const coursesWithProgress = await Promise.all(
        courseData.map(async (course: any) => {
          const progressData = await getCourseExamProgress(
            Number(course.id),
            userid,
          );

          return {
            id: Number(course.id),

            fullname: course.fullname || "Khóa học",

            shortname: course.shortname || "",

            progress: progressData.progress,

            completed: progressData.completed,

            totalExams: progressData.totalExams,

            completedExams: progressData.completedExams,
          };
        }),
      );

      setCourses(coursesWithProgress);
    } catch (error: any) {
      setError(error?.message || "Không thể lấy danh sách khóa học");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timeoutId = setTimeout(() => {
        void loadCourses();
      }, 0);

      return () => clearTimeout(timeoutId);
    }, [loadCourses]),
  );

  const filteredCourses = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !keyword ||
        course.fullname.toLowerCase().includes(keyword) ||
        course.shortname.toLowerCase().includes(keyword);

      if (!matchesSearch) {
        return false;
      }

      if (activeFilter === "completed") {
        return course.completed;
      }

      if (activeFilter === "learning") {
        return !course.completed;
      }

      return true;
    });
  }, [courses, searchText, activeFilter]);

  const totalCount = courses.length;

  const completedCount = courses.filter((course) => course.completed).length;

  const learningCount = totalCount - completedCount;

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Khóa học" />
        <Loading message="Đang tải khóa học..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Khóa học" />

        <EmptyState
          icon="cloud-offline-outline"
          title="Không thể tải khóa học"
          message={error}
          buttonText="Thử lại"
          onPress={loadCourses}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Khóa học" />

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <SearchBar
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm kiếm khóa học..."
            />

            <View style={styles.filterWrapper}>
              <CourseFilter
                activeFilter={activeFilter}
                totalCount={totalCount}
                learningCount={learningCount}
                completedCount={completedCount}
                onChange={setActiveFilter}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh sách khóa học</Text>

              <Text style={styles.sectionSubtitle}>
                {filteredCourses.length} khóa học
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CourseCard
            courseName={item.fullname}
            shortname={item.shortname}
            progress={item.progress}
            completed={item.completed}
            completedExams={item.completedExams}
            totalExams={item.totalExams}
            onPress={() =>
              navigation.navigate("ExamList", {
                courseid: item.id,
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={searchText ? "Không tìm thấy khóa học" : "Chưa có khóa học"}
            message={
              searchText
                ? "Không có khóa học nào phù hợp với từ khóa tìm kiếm."
                : "Hiện tại bạn chưa có khóa học nào."
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  listContent: {
    padding: 20,
    paddingBottom: 30,
  },

  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.white,
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  introSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  filterWrapper: {
    marginTop: 8,
  },

  sectionHeader: {
    marginTop: 18,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
