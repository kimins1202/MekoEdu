// src/screens/ExamScreen.tsx

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

import {
  getAttemptData,
  getUserAttempts,
  processQuizAttempt,
  saveQuizAttempt,
  startQuizAttempt,
} from "../api/quizApi";

// =====================================================
// TYPES
// =====================================================

type AnswerOption = {
  name: string;
  value: string;
  label: string;
};

type QuizQuestion = {
  slot: number;
  type?: string;
  page: number;
  questionnumber: string;
  number?: number;
  html: string;
  sequencecheck: number;
  lastactiontime?: number;
  hasautosavedstep?: boolean;
  flagged?: boolean;
  stateclass?: string;
  status?: string;
  blockedbyprevious?: boolean;
  maxmark?: number;
  settings?: string;
};

// =====================================================
// EXAM SCREEN
// =====================================================

export default function ExamScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { quizid, quizName } = route.params;

  // ===================================================
  // ATTEMPT
  // ===================================================

  const [attemptId, setAttemptId] = useState<number | null>(null);

  // ===================================================
  // QUESTION
  // ===================================================

  const [question, setQuestion] = useState<QuizQuestion | null>(null);

  const [answers, setAnswers] = useState<AnswerOption[]>([]);

  // ===================================================
  // SELECTED ANSWERS
  //
  // Ví dụ:
  //
  // {
  //   "q7:1_answer": "2",
  //   "q7:2_answer": "0"
  // }
  //
  // key = name của input Moodle
  // value = value của đáp án
  // ===================================================

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  // ===================================================
  // PAGE
  // ===================================================

  const [currentPage, setCurrentPage] = useState(0);

  const [nextPage, setNextPage] = useState(-1);

  // ===================================================
  // LOADING
  // ===================================================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // ===================================================
  // INITIALIZE
  // ===================================================

  useEffect(() => {
    initializeExam();
  }, []);

  // =====================================================
  // API 7 → API 8 → API 9
  // =====================================================

  const initializeExam = async () => {
    try {
      setLoading(true);

      // -------------------------------------------------
      // LẤY USER ID
      // -------------------------------------------------

      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      console.log("================================");
      console.log("INITIALIZE EXAM");
      console.log("USER ID:", userId);
      console.log("QUIZ ID:", quizid);
      console.log("================================");

      // =================================================
      // API 7
      // mod_quiz_get_user_attempts
      // =================================================

      console.log("API 7 - GET USER ATTEMPTS");

      const attemptsResponse = await getUserAttempts(
        Number(quizid),
        Number(userId),
        "all",
      );

      console.log("API 7 RESPONSE:", attemptsResponse);

      if (attemptsResponse?.exception) {
        throw new Error(
          attemptsResponse.message || "Không thể lấy danh sách attempt.",
        );
      }

      const attempts = attemptsResponse?.attempts ?? [];

      // -------------------------------------------------
      // TÌM ATTEMPT ĐANG LÀM
      // -------------------------------------------------

      const inProgressAttempt = attempts.find(
        (attempt: any) => attempt.state === "inprogress",
      );

      let currentAttemptId: number;

      // =================================================
      // CÓ ATTEMPT ĐANG LÀM
      // =================================================

      if (inProgressAttempt) {
        currentAttemptId = Number(inProgressAttempt.id);

        console.log("ĐÃ CÓ ATTEMPT ĐANG LÀM:", currentAttemptId);
      } else {
        // =================================================
        // API 8
        // mod_quiz_start_attempt
        // =================================================

        console.log("KHÔNG CÓ ATTEMPT INPROGRESS");

        console.log("API 8 - START QUIZ ATTEMPT");

        currentAttemptId = await startQuizAttempt(Number(quizid));

        console.log("NEW ATTEMPT ID:", currentAttemptId);
      }

      setAttemptId(currentAttemptId);

      // =================================================
      // API 9
      // mod_quiz_get_attempt_data
      // =================================================

      await loadQuestion(currentAttemptId, 0);
    } catch (error: any) {
      console.error("INITIALIZE EXAM ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể mở bài thi.", [
        {
          text: "Quay lại",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // API 9
  // mod_quiz_get_attempt_data
  // =====================================================

  const loadQuestion = async (currentAttemptId: number, page: number) => {
    try {
      setLoading(true);

      console.log("================================");
      console.log("API 9 - GET ATTEMPT DATA");
      console.log("ATTEMPT ID:", currentAttemptId);
      console.log("PAGE:", page);
      console.log("================================");

      const response = await getAttemptData(currentAttemptId, page);

      console.log("API 9 RESPONSE:", response);

      if (response?.exception) {
        throw new Error(response.message || "Không thể lấy dữ liệu bài thi.");
      }

      const questions = response?.questions ?? [];

      if (questions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi.");
      }

      // -------------------------------------------------
      // LẤY CÂU HỎI HIỆN TẠI
      // -------------------------------------------------

      const currentQuestion = questions[0] as QuizQuestion;

      setQuestion(currentQuestion);

      // -------------------------------------------------
      // PARSE ANSWERS TỪ HTML
      // -------------------------------------------------

      const parsedAnswers = parseQuestionHtml(currentQuestion.html);

      setAnswers(parsedAnswers);

      // -------------------------------------------------
      // KHÔI PHỤC ĐÁP ÁN ĐÃ CHỌN
      // -------------------------------------------------

      restoreSelectedAnswer(currentQuestion.html);

      // -------------------------------------------------
      // PAGE
      // -------------------------------------------------

      setCurrentPage(page);

      setNextPage(response?.nextpage ?? -1);

      console.log("CURRENT PAGE:", page);

      console.log("NEXT PAGE:", response?.nextpage);

      console.log("PARSED ANSWERS:", parsedAnswers);
    } catch (error: any) {
      console.error("LOAD QUESTION ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể tải câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PARSE ANSWERS
  //
  // API 9 trả:
  //
  // <input
  //   type="radio"
  //   name="q7:1_answer"
  //   value="0"
  // />
  //
  // <p>3</p>
  // =====================================================

  const parseQuestionHtml = (html: string): AnswerOption[] => {
    const result: AnswerOption[] = [];

    // Tìm tất cả radio input
    const radioRegex = /<input\b[^>]*type=["']radio["'][^>]*>/gi;

    const radioMatches = [...html.matchAll(radioRegex)];

    radioMatches.forEach((match, index) => {
      const input = match[0];

      // Lấy name
      const nameMatch = input.match(/name=["']([^"']+)["']/i);

      // Lấy value
      const valueMatch = input.match(/value=["']([^"']*)["']/i);

      if (!nameMatch || !valueMatch) {
        return;
      }

      const name = nameMatch[1];
      const value = valueMatch[1];

      // Chỉ nhận radio của answer
      if (!name.endsWith("_answer")) {
        return;
      }

      // ==========================================
      // BỎ QUA RADIO "CLEAR MY CHOICE" CỦA MOODLE
      // ==========================================
      if (value === "-1") {
        console.log("BỎ QUA RADIO CLEAR MY CHOICE:", {
          name,
          value,
        });

        return;
      }

      // Vị trí radio hiện tại
      const startIndex = match.index ?? 0;

      // Vị trí radio tiếp theo
      const nextMatch = radioMatches[index + 1];

      const endIndex = nextMatch?.index ?? html.length;

      // Lấy phần HTML nằm giữa
      // radio hiện tại và radio tiếp theo
      const answerHtml = html.substring(startIndex, endIndex);

      // ==========================================
      // TÌM NỘI DUNG ĐÁP ÁN
      // ==========================================

      let label = "";

      // Cách 1: tìm phần answernumber + nội dung
      const answerNumberMatch = answerHtml.match(
        /<span[^>]*class=["'][^"']*answernumber[^"']*["'][^>]*>[\s\S]*?<\/span>([\s\S]*?)(?:<\/div>|<\/label>)/i,
      );

      if (answerNumberMatch) {
        label = cleanHtmlText(answerNumberMatch[1]);
      }

      // Cách 2: nếu không tìm được,
      // lấy p đầu tiên có nội dung
      if (!label) {
        const pMatches = answerHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [];

        for (const p of pMatches) {
          const text = cleanHtmlText(p);

          if (text) {
            label = text;
            break;
          }
        }
      }

      // ==========================================
      // NẾU KHÔNG CÓ NỘI DUNG
      // → KHÔNG THÊM VÀO RESULT
      // ==========================================

      if (!label) {
        console.log("BỎ QUA RADIO KHÔNG CÓ NỘI DUNG:", {
          name,
          value,
        });

        return;
      }

      // ==========================================
      // THÊM ĐÁP ÁN
      // ==========================================

      result.push({
        name,
        value,
        label,
      });
    });

    // ==========================================
    // DEBUG
    // ==========================================

    console.log("================================");
    console.log("SỐ RADIO TÌM THẤY:", radioMatches.length);
    console.log("SỐ ĐÁP ÁN HỢP LỆ:", result.length);
    console.log("ĐÁP ÁN:", result);
    console.log("================================");

    return result;
  };
  console.log(
    "ANSWERS PARSED:",
    answers.map((a) => ({
      name: a.name,
      value: a.value,
      label: a.label,
    })),
  );
  // =====================================================
  // CLEAN HTML TEXT
  // =====================================================

  const cleanHtmlText = (html: string): string => {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  };

  // =====================================================
  // LẤY NỘI DUNG CÂU HỎI
  // =====================================================

  const extractQuestionText = (html: string): string => {
    const qtextMatch = html.match(
      /<div[^>]*class=["'][^"']*qtext[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );

    let text = qtextMatch?.[1] ?? "";

    text = cleanHtmlText(text);

    return text;
  };

  // =====================================================
  // KHÔI PHỤC ANSWER
  //
  // Nếu Moodle trả checked thì lấy value đó.
  // =====================================================

  const restoreSelectedAnswer = (html: string) => {
    const checkedRegex = /<input[^>]*type=["']radio["'][^>]*checked[^>]*>/gi;

    const checkedInputs = html.match(checkedRegex) ?? [];

    console.log("CHECKED INPUTS:", checkedInputs);

    if (checkedInputs.length === 0) {
      return;
    }

    setSelectedAnswers((previous) => {
      const restored = { ...previous };

      checkedInputs.forEach((input) => {
        const nameMatch = input.match(/name=["']([^"']+)["']/i);

        const valueMatch = input.match(/value=["']([^"']*)["']/i);

        if (!nameMatch || !valueMatch) {
          return;
        }

        const name = nameMatch[1];
        const value = valueMatch[1];

        // Bỏ "Clear my choice"
        if (value === "-1") {
          return;
        }

        restored[name] = value;
      });

      console.log("RESTORED ANSWERS:", restored);

      return restored;
    });
  };

  // =====================================================
  // CHỌN ANSWER
  // =====================================================

  const handleSelectAnswer = (answer: AnswerOption) => {
    if (saving || submitting) {
      return;
    }

    console.log("SELECT ANSWER:", answer.name, answer.value);

    setSelectedAnswers((previous) => ({
      ...previous,

      // QUAN TRỌNG:
      // Không tự tạo name.
      // Dùng chính name Moodle trả về.
      [answer.name]: answer.value,
    }));
  };

  // =====================================================
  // BUILD DATA
  //
  // API 10:
  //
  // attemptid
  // data
  //
  // API 11:
  //
  // attemptid
  // data
  // finishattempt
  // =====================================================

  const buildSaveData = () => {
    return Object.entries(selectedAnswers).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // =====================================================
  // API 10
  // mod_quiz_save_attempt
  // =====================================================

  const saveAnswers = async () => {
    if (!attemptId) {
      throw new Error("Không tìm thấy Attempt ID.");
    }

    const data = buildSaveData();

    console.log("================================");
    console.log("API 10 - SAVE ATTEMPT");
    console.log("ATTEMPT ID:", attemptId);
    console.log("DATA:", data);
    console.log("================================");

    // Không có data thì không gọi
    if (data.length === 0) {
      console.log("Không có đáp án để lưu.");

      return;
    }

    const response = await saveQuizAttempt(attemptId, data);

    console.log("API 10 RESPONSE:", response);

    if (response?.exception) {
      throw new Error(response.message || "Không thể lưu câu trả lời.");
    }
  };

  // =====================================================
  // CÂU TIẾP THEO
  // =====================================================

  const handleNext = async () => {
    if (!attemptId) {
      return;
    }

    try {
      setSaving(true);

      // -------------------------------------------------
      // API 10
      // LƯU TRƯỚC KHI SANG CÂU TIẾP
      // -------------------------------------------------

      await saveAnswers();

      // -------------------------------------------------
      // CÒN CÂU TIẾP
      // -------------------------------------------------

      if (nextPage !== -1) {
        await loadQuestion(attemptId, nextPage);

        return;
      }

      // -------------------------------------------------
      // ĐÃ TỚI CÂU CUỐI
      // -------------------------------------------------

      Alert.alert(
        "Thông báo",
        "Đây là câu hỏi cuối cùng. Bạn có thể kiểm tra lại đáp án rồi nộp bài.",
      );
    } catch (error: any) {
      console.error("NEXT ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể chuyển câu.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CÂU TRƯỚC
  // =====================================================

  const handlePrevious = async () => {
    if (!attemptId) {
      return;
    }

    if (currentPage <= 0) {
      return;
    }

    try {
      setSaving(true);

      // -------------------------------------------------
      // API 10
      // -------------------------------------------------

      await saveAnswers();

      // -------------------------------------------------
      // API 9
      // LOAD PAGE TRƯỚC
      // -------------------------------------------------

      await loadQuestion(attemptId, currentPage - 1);
    } catch (error: any) {
      console.error("PREVIOUS ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể quay lại câu trước.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // XÁC NHẬN NỘP
  // =====================================================

  const handleSubmit = () => {
    Alert.alert("Nộp bài", "Bạn có chắc chắn muốn nộp bài không?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Nộp bài",
        onPress: submitExam,
      },
    ]);
  };

  // =====================================================
  // API 10 → API 11
  //
  // API 10:
  // save_quiz_attempt
  //
  // API 11:
  // mod_quiz_process_attempt
  //
  // finishattempt = 1
  // =====================================================

  const submitExam = async () => {
    if (!attemptId) {
      Alert.alert("Lỗi", "Không tìm thấy Attempt ID.");

      return;
    }

    try {
      setSubmitting(true);

      // =================================================
      // API 10
      // LƯU ĐÁP ÁN CUỐI
      // =================================================

      console.log("================================");
      console.log("SUBMIT - API 10");
      console.log("SAVE LAST ANSWERS");
      console.log("================================");

      await saveAnswers();

      // =================================================
      // DATA
      // =================================================

      const data = buildSaveData();

      // =================================================
      // API 11
      // mod_quiz_process_attempt
      // =================================================

      console.log("================================");
      console.log("SUBMIT - API 11");
      console.log("PROCESS ATTEMPT");
      console.log("ATTEMPT ID:", attemptId);
      console.log("DATA:", data);
      console.log("FINISH ATTEMPT:", 1);
      console.log("================================");

      const response = await processQuizAttempt(attemptId, data, 1);

      console.log("API 11 RESPONSE:", response);

      // =================================================
      // ERROR
      // =================================================

      if (response?.exception) {
        throw new Error(response.message || "Không thể nộp bài.");
      }

      // =================================================
      // THÀNH CÔNG
      // =================================================

      Alert.alert("Nộp bài thành công", "Bài thi đã được nộp và xử lý.", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error("SUBMIT EXAM ERROR:", error);

      Alert.alert("Lỗi nộp bài", error?.message || "Không thể nộp bài.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // GET CURRENT SELECTED ANSWER
  // =====================================================

  const currentAnswerName = answers.length > 0 ? answers[0].name : "";

  const selectedValue = selectedAnswers[currentAnswerName];

  // =====================================================
  // LAST PAGE
  // =====================================================

  const isLastQuestion = nextPage === -1;

  // =====================================================
  // INITIAL LOADING
  // =====================================================

  if (loading && !question) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Đang tải bài thi...</Text>
      </View>
    );
  }

  // =====================================================
  // NO QUESTION
  // =====================================================

  if (!question) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không có câu hỏi.</Text>
      </View>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* =============================================
            HEADER
        ============================================= */}

        <View style={styles.header}>
          <Text style={styles.quizName}>{quizName}</Text>

          <Text style={styles.questionCounter}>
            Câu {question.questionnumber || currentPage + 1}
          </Text>
        </View>

        {/* =============================================
            QUESTION
        ============================================= */}

        <View style={styles.questionBox}>
          <Text style={styles.questionTitle}>
            Câu {question.questionnumber || currentPage + 1}
          </Text>

          <Text style={styles.questionText}>
            {extractQuestionText(question.html)}
          </Text>
        </View>

        {/* =============================================
            ANSWERS
        ============================================= */}

        <View style={styles.answerBox}>
          <Text style={styles.answerTitle}>Chọn đáp án:</Text>

          {answers.map((answer, index) => {
            const isSelected = selectedAnswers[answer.name] === answer.value;

            return (
              <TouchableOpacity
                key={`${answer.name}-${answer.value}-${index}`}
                style={[
                  styles.answerOption,
                  isSelected && styles.answerSelected,
                ]}
                onPress={() => handleSelectAnswer(answer)}
                disabled={saving || submitting}
              >
                {/* RADIO */}

                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                {/* TEXT */}

                <Text
                  style={[
                    styles.answerText,
                    isSelected && styles.answerTextSelected,
                  ]}
                >
                  {getAnswerLabel(index, answer.label)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* =============================================
            ATTEMPT INFO
        ============================================= */}

        <View style={styles.attemptInfo}>
          <Text style={styles.attemptText}>Attempt ID: {attemptId}</Text>

          <Text style={styles.attemptText}>Trang: {currentPage + 1}</Text>

          <Text style={styles.attemptText}>Trạng thái: Đang làm bài</Text>
        </View>

        {/* =============================================
            NAVIGATION
        ============================================= */}

        <View style={styles.navigation}>
          {/* ===========================================
              PREVIOUS
          =========================================== */}

          <TouchableOpacity
            style={[
              styles.navButton,
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            disabled={currentPage === 0 || saving || submitting}
            onPress={handlePrevious}
          >
            <Text style={styles.navButtonText}>← Câu trước</Text>
          </TouchableOpacity>

          {/* ===========================================
              NEXT / SUBMIT
          =========================================== */}

          {!isLastQuestion ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                saving && styles.navButtonDisabled,
              ]}
              disabled={saving || submitting}
              onPress={handleNext}
            >
              <Text style={styles.navButtonText}>
                {saving ? "Đang lưu..." : "Câu tiếp →"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.submitButton,
                submitting && styles.navButtonDisabled,
              ]}
              disabled={saving || submitting}
              onPress={handleSubmit}
            >
              <Text style={styles.navButtonText}>
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* =============================================
            LOADING KHI CHUYỂN CÂU
        ============================================= */}

        {loading && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" />

            <Text style={styles.loadingMoreText}>Đang tải câu hỏi...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// =====================================================
// ANSWER LABEL
// =====================================================

const getAnswerLabel = (index: number, label: string) => {
  const letters = ["A", "B", "C", "D", "E", "F"];

  const prefix = letters[index] ?? `${index + 1}`;

  return `${prefix}. ${label}`;
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // ===================================================
  // LOADING
  // ===================================================

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

  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  loadingMoreText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666666",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#DDDDDD",
  },

  quizName: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#111827",
  },

  questionCounter: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },

  // ===================================================
  // QUESTION
  // ===================================================

  questionBox: {
    margin: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
  },

  questionTitle: {
    marginBottom: 15,
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },

  questionText: {
    fontSize: 16,
    lineHeight: 25,
    color: "#222222",
  },

  // ===================================================
  // ANSWERS
  // ===================================================

  answerBox: {
    marginHorizontal: 20,
  },

  answerTitle: {
    marginBottom: 12,
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },

  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  answerSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },

  // ===================================================
  // RADIO
  // ===================================================

  radioOuter: {
    width: 22,
    height: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  radioOuterSelected: {
    borderColor: "#2563EB",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
  },

  // ===================================================
  // ANSWER TEXT
  // ===================================================

  answerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: "#333333",
  },

  answerTextSelected: {
    color: "#1D4ED8",
    fontWeight: "600",
  },

  // ===================================================
  // ATTEMPT INFO
  // ===================================================

  attemptInfo: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },

  attemptText: {
    marginBottom: 3,
    fontSize: 13,
    color: "#6B7280",
  },

  // ===================================================
  // NAVIGATION
  // ===================================================

  navigation: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 25,
  },

  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6B7280",
  },

  nextButton: {
    backgroundColor: "#2563EB",
  },

  submitButton: {
    backgroundColor: "#16A34A",
  },

  navButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },

  navButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
