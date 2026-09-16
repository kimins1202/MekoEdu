import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TakeQuizScreen() {
  // Câu hỏi hiện tại
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Lưu đáp án đã chọn của từng câu
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: number;
  }>({});

  // =========================
  // MOCK DATA
  // =========================

  const questions = [
    {
      id: 1,
      question: "HTML là viết tắt của cụm từ nào?",
      options: [
        "Hyper Text Markup Language",
        "High Text Machine Language",
        "Hyperlink Text Markup Language",
        "Home Tool Markup Language",
      ],
    },
    {
      id: 2,
      question: "CSS được sử dụng chủ yếu để làm gì?",
      options: [
        "Quản lý cơ sở dữ liệu",
        "Thiết kế và định dạng giao diện",
        "Xử lý API",
        "Tạo máy chủ",
      ],
    },
    {
      id: 3,
      question: "JavaScript được sử dụng để làm gì?",
      options: [
        "Tạo và xử lý tương tác cho website",
        "Thiết kế database",
        "Tạo file hình ảnh",
        "Quản lý hệ điều hành",
      ],
    },
    {
      id: 4,
      question: "API là gì?",
      options: [
        "Một loại database",
        "Một giao diện cho phép các hệ thống giao tiếp với nhau",
        "Một ngôn ngữ lập trình",
        "Một hệ điều hành",
      ],
    },
    {
      id: 5,
      question: "HTTP method nào thường được sử dụng để lấy dữ liệu?",
      options: ["POST", "PUT", "GET", "DELETE"],
    },
  ];

  // Câu hỏi hiện tại
  const question = questions[currentQuestion];

  // =========================
  // CHỌN ĐÁP ÁN
  // =========================

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [question.id]: optionIndex,
    });
  };

  // =========================
  // CÂU TRƯỚC
  // =========================

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // =========================
  // CÂU TIẾP
  // =========================

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  // =========================
  // NỘP BÀI
  // =========================

  const handleSubmit = () => {
    console.log("Đáp án đã chọn:", selectedAnswers);
  };

  return (
    <View style={styles.container}>
      {/* =========================
          HEADER
      ========================= */}

      <View style={styles.header}>
        <Text style={styles.title}>Làm bài thi</Text>

        <Text style={styles.timer}>45:00</Text>
      </View>

      {/* =========================
          TIẾN ĐỘ
      ========================= */}

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Câu {currentQuestion + 1} / {questions.length}
        </Text>
      </View>

      {/* =========================
          NỘI DUNG CÂU HỎI
      ========================= */}

      <View style={styles.questionContainer}>
        {/* Số câu */}
        <Text style={styles.questionNumber}>Câu {question.id}</Text>

        {/* Câu hỏi */}
        <Text style={styles.questionText}>{question.question}</Text>

        {/* =========================
            DANH SÁCH ĐÁP ÁN
        ========================= */}

        {question.options.map((option, index) => {
          const isSelected = selectedAnswers[question.id] === index;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.option, isSelected && styles.selectedOption]}
              onPress={() => handleSelectAnswer(index)}
              activeOpacity={0.7}
            >
              {/* Radio */}
              <View style={[styles.radio, isSelected && styles.selectedRadio]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>

              {/* Chữ đáp án */}
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.selectedOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* =========================
          NÚT TRƯỚC / TIẾP
      ========================= */}

      <View style={styles.navigation}>
        {/* Trước */}
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestion === 0 && styles.disabledButton,
          ]}
          onPress={handleBack}
          disabled={currentQuestion === 0}
        >
          <Text
            style={[
              styles.navText,
              currentQuestion === 0 && styles.disabledText,
            ]}
          >
            ← Trước
          </Text>
        </TouchableOpacity>

        {/* Tiếp */}
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestion === questions.length - 1 && styles.disabledButton,
          ]}
          onPress={handleNext}
          disabled={currentQuestion === questions.length - 1}
        >
          <Text
            style={[
              styles.navText,
              currentQuestion === questions.length - 1 && styles.disabledText,
            ]}
          >
            Tiếp →
          </Text>
        </TouchableOpacity>
      </View>

      {/* =========================
          NỘP BÀI
      ========================= */}

      {currentQuestion === questions.length - 1 && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Nộp bài</Text>
        </TouchableOpacity>
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
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,

    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },

  timer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  progressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666666",
  },

  // Question
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  questionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",

    marginBottom: 12,
  },

  questionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",

    marginBottom: 25,
  },

  // Option
  option: {
    flexDirection: "row",
    alignItems: "center",

    padding: 15,
    marginBottom: 12,

    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,

    backgroundColor: "#FAFAFA",
  },

  selectedOption: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  // Radio
  radio: {
    width: 22,
    height: 22,

    borderWidth: 2,
    borderColor: "#999999",

    borderRadius: 11,

    marginRight: 12,

    alignItems: "center",
    justifyContent: "center",
  },

  selectedRadio: {
    borderColor: "#2563EB",
  },

  radioDot: {
    width: 12,
    height: 12,

    borderRadius: 6,

    backgroundColor: "#2563EB",
  },

  // Option text
  optionText: {
    flex: 1,

    fontSize: 14,
    color: "#333333",
  },

  selectedOptionText: {
    color: "#2563EB",
    fontWeight: "600",
  },

  // Navigation
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  navButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,

    borderWidth: 1,
    borderColor: "#2563EB",

    borderRadius: 8,
  },

  disabledButton: {
    borderColor: "#CCCCCC",
  },

  navText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },

  disabledText: {
    color: "#AAAAAA",
  },

  // Submit
  submitButton: {
    marginHorizontal: 20,
    marginBottom: 25,

    paddingVertical: 15,

    backgroundColor: "#2563EB",

    borderRadius: 8,

    alignItems: "center",
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
