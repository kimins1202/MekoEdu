import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  DeviceEventEmitter,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/common/AppHeader";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";

import { getQuizzesByCourses } from "../../api/quizApi";
import { AppStackParamList } from "../../types/navigation";

type ExamListRouteProp = RouteProp<AppStackParamList, "ExamList">;

type NavigationProp = NativeStackNavigationProp<AppStackParamList, "ExamList">;

type Exam = {
  id: number;
  name: string;
  questioncount?: number;
  timelimit?: number;
};

export default function ExamListScreen() {
  const route = useRoute<ExamListRouteProp>();
  const navigation = useNavigation<NavigationProp>();

  const { courseid } = route.params;

  const [exams, setExams] = useState<Exam[]>([]);
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
      <View style={styles.container}>
        <AppHeader
          title="Danh sách bài thi"
          subtitle="Các bài kiểm tra trong khóa học"
          showBack
        />

        <Loading message="Đang tải danh sách bài thi..." />
      </View>
    );
  }

  // UI

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <AppHeader
        title="Danh sách bài thi"
        subtitle={`${exams.length} bài kiểm tra`}
        showBack
        rightText="Đăng xuất"
        onRightPress={handleLogout}
      />

      {/* RELOAD */}
      <TouchableOpacity
        style={[styles.reloadButton, loading && styles.reloadButtonDisabled]}
        onPress={loadExams}
        disabled={loading}
        activeOpacity={0.75}
      >
        <Ionicons name="refresh-outline" size={18} color={COLORS.primaryDark} />

        <Text style={styles.reloadText}>
          {loading ? "Đang tải..." : "Tải lại danh sách"}
        </Text>
      </TouchableOpacity>

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
        <FlatList
          data={exams}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.examCard}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate("ExamDetail", {
                  quizid: item.id,
                  quizName: item.name,
                  questionCount: item.questioncount,
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
                    {item.questioncount
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
    </View>
  );
}

// =========================
// STYLE
// =========================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  // RELOAD

  reloadButton: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 4,

    height: 44,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: COLORS.border,

    backgroundColor: COLORS.white,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,
  },

  reloadButtonDisabled: {
    opacity: 0.55,
  },

  reloadText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: "600",
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
