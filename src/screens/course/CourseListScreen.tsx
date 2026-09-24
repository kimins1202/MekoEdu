import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/common/AppHeader";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";

import { getUserCourses } from "../../api/courseApi";
import { AppStackParamList } from "../../types/navigation";

type Course = {
  id: number;
  fullname: string;
  shortname: string;
};

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export default function CourseListScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const useridString = await AsyncStorage.getItem("userid");

      if (!useridString) {
        throw new Error("Không tìm thấy userid");
      }

      const userid = Number(useridString);

      const data = await getUserCourses(userid);

      setCourses(data);
    } catch (error: any) {
      setError(error?.message || "Không thể lấy danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Khóa học" />

        <Loading message="Đang tải khóa học..." />
      </View>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error) {
    return (
      <View style={styles.container}>
        <AppHeader title="Khóa học" />

        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="cloud-offline-outline"
              size={34}
              color={COLORS.error}
            />
          </View>

          <Text style={styles.errorTitle}>Không thể tải khóa học</Text>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadCourses}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.white} />

            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================
  // COURSE LIST
  // =========================

  return (
    <View style={styles.container}>
      <AppHeader title="Khóa học" subtitle={`${courses.length} khóa học`} />

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.courseCard}
            activeOpacity={0.75}
            onPress={() => {
              navigation.navigate("ExamList", {
                courseid: item.id,
              });
            }}
          >
            {/* Course Icon */}
            <View style={styles.courseIcon}>
              <Ionicons name="book-outline" size={26} color={COLORS.primary} />
            </View>

            {/* Course Information */}
            <View style={styles.courseInfo}>
              <Text style={styles.courseName} numberOfLines={2}>
                {item.fullname}
              </Text>

              <View style={styles.shortNameRow}>
                <Ionicons
                  name="pricetag-outline"
                  size={13}
                  color={COLORS.textLight}
                />

                <Text style={styles.shortName}>{item.shortname}</Text>
              </View>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textLight}
              />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={38} color={COLORS.primary} />
            </View>

            <Text style={styles.emptyTitle}>Chưa có khóa học</Text>

            <Text style={styles.emptyText}>
              Hiện tại bạn chưa được đăng ký khóa học nào.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================
  // CONTAINER
  // =========================

  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  listContent: {
    padding: 20,
    paddingBottom: 30,
  },

  // =========================
  // COURSE CARD
  // =========================

  courseCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.white,

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

  courseIcon: {
    width: 52,
    height: 52,

    borderRadius: 15,

    backgroundColor: COLORS.backgroundSoft,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 13,
  },

  courseInfo: {
    flex: 1,
  },

  courseName: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    color: COLORS.text,
  },

  shortNameRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 7,
  },

  shortName: {
    marginLeft: 5,

    fontSize: 12,
    color: COLORS.textSecondary,
  },

  arrowContainer: {
    marginLeft: 8,
  },

  // =========================
  // LOADING / ERROR
  // =========================

  center: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",

    padding: 25,
  },

  errorIcon: {
    width: 70,
    height: 70,

    borderRadius: 35,

    backgroundColor: "#FFF1F1",

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 15,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,

    textAlign: "center",
    marginBottom: 7,
  },

  errorText: {
    fontSize: 13,
    lineHeight: 20,

    color: COLORS.textSecondary,

    textAlign: "center",

    marginBottom: 20,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryDark,

    paddingHorizontal: 22,
    paddingVertical: 12,

    borderRadius: 12,

    gap: 7,
  },

  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // =========================
  // EMPTY
  // =========================

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",

    paddingTop: 80,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 80,
    height: 80,

    borderRadius: 40,

    backgroundColor: COLORS.white,

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
  },
});
