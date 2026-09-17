// src/screens/ExamDetailScreen.tsx

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";

import { getQuizAccessInformation, getUserAttempts } from "../api/quizApi";

export default function ExamDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // LẤY THÔNG TIN BÀI THI TỪ EXAM LIST
  const { quizid, quizName, questionCount, timelimit } = route.params;

  // STATE
  const [loading, setLoading] = useState(true);

  // API 6 - Quyền truy cập
  const [canAttempt, setCanAttempt] = useState(false);

  const [preventAccessReasons, setPreventAccessReasons] = useState<string[]>(
    [],
  );

  // API 7 - Lịch sử làm bài
  const [attempts, setAttempts] = useState<any[]>([]);

  // GỌI API KHI MỞ MÀN HÌNH
  useEffect(() => {
    loadExamData();
  }, []);

  const loadExamData = async () => {
    try {
      setLoading(true);

      // LẤY USER ID TỪ ASYNC STORAGE
      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        Alert.alert("Lỗi", "Không tìm thấy User ID. Vui lòng đăng nhập lại.");
        return;
      }

      // API 6
      // mod_quiz_get_quiz_access_information

      const accessResponse = await getQuizAccessInformation(quizid);

      // Kiểm tra quyền làm bài
      setCanAttempt(accessResponse?.canattempt ?? false);

      // Lấy lý do không được truy cập
      setPreventAccessReasons(accessResponse?.preventaccessreasons ?? []);

      // API 7
      // mod_quiz_get_user_attempts

      const attemptsResponse = await getUserAttempts(
        quizid,
        Number(userId),
        "all",
      );

      // Lưu lịch sử làm bài
      setAttempts(attemptsResponse?.attempts ?? []);
    } catch (error) {
      console.error("EXAM DETAIL ERROR:", error);

      Alert.alert("Lỗi", "Không thể tải thông tin bài thi.");
    } finally {
      setLoading(false);
    }
  };

  // CHUYỂN TRẠNG THÁI ATTEMPT SANG TIẾNG VIỆT
  const getAttemptStatus = (state: string) => {
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
        return state || "Không xác định";
    }
  };

  // FORMAT NGÀY GIỜ
  const formatDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) {
      return "Chưa xác định";
    }

    return new Date(timestamp * 1000).toLocaleString("vi-VN");
  };

  // FORMAT THỜI GIAN LÀM BÀI
  // timelimit từ Moodle tính bằng GIÂY
  const formatTimeLimit = (seconds: number) => {
    if (!seconds || seconds <= 0) {
      return "Không giới hạn";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours} giờ ${minutes} phút`;
    }

    if (hours > 0) {
      return `${hours} giờ`;
    }

    return `${minutes} phút`;
  };

  // BẮT ĐẦU LÀM BÀI
  const handleStartQuiz = () => {
    // Nếu không có quyền
    if (!canAttempt) {
      Alert.alert(
        "Không thể làm bài",
        preventAccessReasons.length > 0
          ? preventAccessReasons.join("\n")
          : "Bạn không được phép làm bài thi này.",
      );

      return;
    }

    // Nếu có quyền → sang Exam
    navigation.navigate("Exam", {
      quizid: quizid,
      quizName: quizName,
    });
  };

  // LOADING
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Đang tải thông tin bài thi...</Text>
      </View>
    );
  }

  // UI
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* 
          HEADER
       */}

      <View style={styles.header}>
        {/* Nút quay lại */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Quay lại</Text>
        </TouchableOpacity>

        {/* Tên bài thi */}
        <Text style={styles.title}>{quizName}</Text>
      </View>

      {/* 
          CONTENT
       */}

      <View style={styles.content}>
        {/* 
            THÔNG TIN BÀI THI
         */}

        <Text style={styles.sectionTitle}>Thông tin bài thi</Text>

        <View style={styles.infoBox}>
          <Text style={styles.info}>Quiz ID: {quizid}</Text>

          {/* Thời gian làm bài lấy từ timelimit */}
          <Text style={styles.info}>
            Thời gian: {formatTimeLimit(timelimit)}
          </Text>

          {/* Số câu hỏi */}
          <Text style={styles.info}>
            Số câu hỏi:{" "}
            {questionCount !== undefined
              ? `${questionCount} câu`
              : "Chưa xác định"}
          </Text>

          {/* Số lần đã làm */}
          <Text style={styles.info}>
            Số lần đã làm:{" "}
            {attempts.length > 0 ? `${attempts.length} lần` : "Chưa làm"}
          </Text>
        </View>

        {/* 
            QUYỀN TRUY CẬP - API 6
         */}

        <Text style={styles.sectionTitle}>Quyền truy cập</Text>

        <View style={styles.infoBox}>
          {/* Trạng thái */}
          <Text style={canAttempt ? styles.success : styles.error}>
            {canAttempt ? "✓ Có thể làm bài" : "✕ Không thể làm bài"}
          </Text>

          <Text style={styles.info}>
            Trạng thái:{" "}
            {canAttempt ? "Được phép truy cập" : "Không được phép truy cập"}
          </Text>

          {/* Lý do không được truy cập */}
          {!canAttempt && preventAccessReasons.length > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Lý do:</Text>

              {preventAccessReasons.map((reason, index) => (
                <Text key={index} style={styles.reason}>
                  • {reason}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* 
            LỊCH SỬ LÀM BÀI - API 7
         */}

        <Text style={styles.sectionTitle}>Lịch sử làm bài</Text>

        <View style={styles.infoBox}>
          {/* Chưa có lịch sử */}
          {attempts.length === 0 ? (
            <Text style={styles.info}>Chưa có lịch sử làm bài</Text>
          ) : (
            attempts.map((attempt, index) => (
              <View key={attempt.id ?? index} style={styles.attemptItem}>
                {/* Lần làm */}
                <Text style={styles.attemptTitle}>
                  Lần {attempt.attempt ?? index + 1}
                </Text>

                {/* Trạng thái */}
                <Text style={styles.info}>
                  Trạng thái: {getAttemptStatus(attempt.state)}
                </Text>

                {/* Điểm */}
                {attempt.sumgrades !== undefined &&
                  attempt.sumgrades !== null && (
                    <Text style={styles.info}>Điểm: {attempt.sumgrades}</Text>
                  )}

                {/* Thời gian bắt đầu */}
                {attempt.timestart ? (
                  <Text style={styles.info}>
                    Bắt đầu: {formatDate(attempt.timestart)}
                  </Text>
                ) : null}

                {/* Thời gian kết thúc */}
                {attempt.timefinish && attempt.timefinish !== 0 ? (
                  <Text style={styles.info}>
                    Kết thúc: {formatDate(attempt.timefinish)}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* 
            BUTTON BẮT ĐẦU
         */}

        <TouchableOpacity
          style={[styles.button, !canAttempt && styles.buttonDisabled]}
          disabled={!canAttempt}
          onPress={handleStartQuiz}
        >
          <Text style={styles.buttonText}>Bắt đầu làm bài</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // LOADING

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555555",
  },

  // HEADER

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },

  back: {
    fontSize: 15,
    color: "#2563EB",
    marginBottom: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },

  // CONTENT

  content: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 15,
    marginBottom: 10,
  },

  // INFO

  infoBox: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    gap: 10,
  },

  info: {
    fontSize: 14,
    color: "#555555",
  },

  // SUCCESS / ERROR

  success: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },

  error: {
    fontSize: 14,
    color: "#DC2626",
    fontWeight: "600",
  },

  // WARNING

  warningBox: {
    marginTop: 5,
    padding: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },

  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 5,
  },

  reason: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
    marginTop: 3,
  },

  // ATTEMPT

  attemptItem: {
    paddingBottom: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    gap: 5,
  },

  attemptTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  // BUTTON

  button: {
    marginTop: 30,
    paddingVertical: 15,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    alignItems: "center",
  },

  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
