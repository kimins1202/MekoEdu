import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { getCourseCompletionStatus, getUserCourses } from "../../api/courseApi";
import AppHeader from "../../components/common/AppHeader";
import EmptyState from "../../components/common/EmptyState";
import Loading from "../../components/common/Loading";
import SearchBar from "../../components/common/SearchBar";
import CourseCard from "../../components/course/CourseCard";
import CourseFilter, {
  CourseFilterType,
} from "../../components/course/CourseFilter";
import COLORS from "../../constants/colors";
import type { AppStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type Course = {
  id: number;
  fullname: string;
  shortname: string;
  progress: number;
  completed: boolean;
};

export default function CourseListScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<CourseFilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const calculateProgress = (completion: any) => {
    const criteria =
      completion?.completionstatus?.completions ??
      completion?.completions ??
      [];

    if (!Array.isArray(criteria) || criteria.length === 0) {
      return 0;
    }

    const completedCount = criteria.filter(
      (item: any) =>
        item?.complete === true ||
        item?.complete === 1 ||
        item?.complete === "1",
    ).length;

    return Math.round((completedCount / criteria.length) * 100);
  };

  const loadCourses = async () => {
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
          let progress = 0;

          try {
            const completion = await getCourseCompletionStatus(
              Number(course.id),
              userid,
            );

            progress = calculateProgress(completion);
          } catch {
            progress = 0;
          }

          return {
            id: Number(course.id),
            fullname: course.fullname || "Khóa học",
            shortname: course.shortname || "",
            progress,
            completed: progress >= 100,
          };
        }),
      );

      setCourses(coursesWithProgress);
    } catch (error: any) {
      setError(error?.message || "Không thể lấy danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

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
      <AppHeader title="Khóa học" subtitle={`${totalCount} khóa học`} />

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.introCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>KH</Text>
              </View>

              <View style={styles.introContent}>
                <Text style={styles.introTitle}>Khóa học của bạn</Text>

                <Text style={styles.introSubtitle}>
                  Theo dõi tiến độ học tập của bạn
                </Text>
              </View>
            </View>

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
    backgroundColor: COLORS.white,
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
