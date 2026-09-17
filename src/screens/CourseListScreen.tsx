import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getUserCourses } from "../api/courseApi";
import { AppStackParamList } from "../types/navigation";

type Course = {
  id: number;
  fullname: string;
  shortname: string;
};

type NavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "CourseList"
>;

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Đang tải khóa học...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={loadCourses}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khóa học của tôi</Text>

      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.courseCard}
            onPress={() => {
              navigation.navigate("ExamList", {
                courseid: item.id,
              });
            }}
          >
            <Text style={styles.courseName}>{item.fullname}</Text>

            <Text style={styles.shortName}>{item.shortname}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có khóa học nào.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },

  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },

  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#333",
  },

  retryText: {
    color: "#fff",
    fontWeight: "600",
  },

  courseCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  courseName: {
    fontSize: 18,
    fontWeight: "600",
  },

  shortName: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#666",
  },
});
