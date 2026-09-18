import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getQuizzesByCourses } from "../api/quizApi";
import { AppStackParamList } from "../types/navigation";

type ExamListRouteProp = RouteProp<AppStackParamList, "ExamList">;

type NavigationProp = NativeStackNavigationProp<AppStackParamList, "ExamList">;

export default function ExamListScreen() {
  const route = useRoute<ExamListRouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const { courseid } = route.params;

  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // LOAD EXAM TỪ API

  useEffect(() => {
    loadExams();
  }, [courseid]);

  const loadExams = async () => {
    try {
      setLoading(true);

      // LẤY QUIZZES CỦA COURSE ĐƯỢC CHỌN

      const quizData = await getQuizzesByCourses([courseid]);

      // CẬP NHẬT DANH SÁCH

      const quizzes = quizData?.quizzes ?? [];

      setExams(quizzes);
    } catch (error: any) {
      console.error("Lỗi load exams:", error?.response?.data || error?.message);

      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  // ĐĂNG XUẤT

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("wstoken");

      DeviceEventEmitter.emit("authChange");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // LOADING LẦN ĐẦU

  if (loading && exams.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Đang tải danh sách bài thi...</Text>
      </View>
    );
  }

  // UI

  return (
    <View style={styles.container}>
      {/* 
          HEADER
       */}

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Danh sách bài thi</Text>

          <Text style={styles.subtitle}>Chọn bài thi để xem chi tiết</Text>
        </View>

        {/* ĐĂNG XUẤT */}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* 
          NÚT TẢI LẠI
       */}

      <TouchableOpacity
        style={[styles.reloadButton, loading && styles.reloadButtonDisabled]}
        onPress={loadExams}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.reloadContent}>
            <ActivityIndicator size="small" />

            <Text style={styles.reloadText}>Đang tải...</Text>
          </View>
        ) : (
          <Text style={styles.reloadText}>Tải lại danh sách</Text>
        )}
      </TouchableOpacity>

      {/* 
          DANH SÁCH BÀI THI
       */}

      {exams.length === 0 ? (
        <View style={styles.center}>
          <Text>Không có bài thi nào.</Text>
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.examCard}
              onPress={() =>
                navigation.navigate("ExamDetail", {
                  quizid: item.id,
                  quizName: item.name,
                  questionCount: item.questioncount,
                  timelimit: item.timelimit,
                })
              }
            >
              <Text style={styles.examName}>{item.name}</Text>

              <Text style={styles.examInfo}>Quiz ID: {item.id}</Text>

              <Text style={styles.examInfo}>
                Thời gian:{" "}
                {item.timelimit
                  ? `${Math.floor(item.timelimit / 60)} phút`
                  : "Không giới hạn"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// STYLE

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
  },

  // HEADER

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },

  subtitle: {
    marginTop: 5,
    color: "#666666",
    fontSize: 13,
  },

  // LOGOUT

  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    marginLeft: 10,
  },

  logoutText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },

  // RELOAD

  reloadButton: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 8,
    alignItems: "center",
  },

  reloadButtonDisabled: {
    opacity: 0.6,
  },

  reloadContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  reloadText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },

  // EXAM LIST

  list: {
    padding: 20,
  },

  examCard: {
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
  },

  examName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 10,
  },

  examInfo: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 5,
  },
});
