import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useNavigation, useRoute } from "@react-navigation/native";

export default function QuizScreen() {
  const navigation = useNavigation<any>();

  const route = useRoute<any>();

  const { quizid, quizName } = route.params;

  return (
    <View style={styles.container}>
      {/* =========================
          HEADER
      ========================= */}

      <View style={styles.header}>
        {/* Nút quay lại */}
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Quay lại</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{quizName}</Text>
      </View>

      {/* =========================
          CONTENT
      ========================= */}

      <View style={styles.content}>
        {/* Thông tin bài thi */}
        <Text style={styles.sectionTitle}>Thông tin bài thi</Text>

        <View style={styles.infoBox}>
          <Text style={styles.info}>Quiz ID: {quizid}</Text>

          <Text style={styles.info}>Thời gian: 45 phút</Text>

          <Text style={styles.info}>Số câu hỏi: 20 câu</Text>

          <Text style={styles.info}>Số lần làm: 2 lần</Text>
        </View>

        {/* =========================
            QUYỀN TRUY CẬP
        ========================= */}

        <Text style={styles.sectionTitle}>Quyền truy cập</Text>

        <View style={styles.infoBox}>
          <Text style={styles.success}>✓ Có thể làm bài</Text>

          <Text style={styles.info}>Trạng thái: Được phép truy cập</Text>
        </View>

        {/* =========================
            LỊCH SỬ LÀM BÀI
        ========================= */}

        <Text style={styles.sectionTitle}>Lịch sử làm bài</Text>

        <View style={styles.infoBox}>
          <Text style={styles.info}>Lần 1 - Đã hoàn thành - 8.5 điểm</Text>

          <Text style={styles.info}>Lần 2 - Đã hoàn thành - 9.0 điểm</Text>
        </View>

        {/* =========================
            BUTTON BẮT ĐẦU
        ========================= */}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate("TakeQuiz", {
              quizid: quizid,
              quizName: quizName,
            })
          }
        >
          <Text style={styles.buttonText}>Bắt đầu làm bài</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // =========================
  // HEADER
  // =========================

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

  // =========================
  // CONTENT
  // =========================

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

  // =========================
  // INFO
  // =========================

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

  success: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },

  // =========================
  // BUTTON
  // =========================

  button: {
    marginTop: 30,

    paddingVertical: 15,

    backgroundColor: "#2563EB",

    borderRadius: 8,

    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
