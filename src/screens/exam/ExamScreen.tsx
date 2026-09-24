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
} from "../../api/quizApi";

// TYPES

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

// EXAM SCREEN

export default function ExamScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { quizid, quizName } = route.params;

  // ATTEMPT

  const [attemptId, setAttemptId] = useState<number | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  // PAGE

  const [currentPage, setCurrentPage] = useState(0);

  const [nextPage, setNextPage] = useState(-1);

  // LOADING

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // INITIALIZE

  useEffect(() => {
    initializeExam();
  }, []);

  // API 7 → API 8 → API 9

  const initializeExam = async () => {
    try {
      setLoading(true);

      // LẤY USER ID

      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      // API 7
      // mod_quiz_get_user_attempts

      const attemptsResponse = await getUserAttempts(
        Number(quizid),
        Number(userId),
        "all",
      );

      if (attemptsResponse?.exception) {
        throw new Error(
          attemptsResponse.message || "Không thể lấy danh sách attempt.",
        );
      }

      const attempts = attemptsResponse?.attempts ?? [];

      // TÌM ATTEMPT ĐANG LÀM

      const inProgressAttempt = attempts.find(
        (attempt: any) => attempt.state === "inprogress",
      );

      let currentAttemptId: number;

      // CÓ ATTEMPT ĐANG LÀM

      if (inProgressAttempt) {
        currentAttemptId = Number(inProgressAttempt.id);
      } else {
        // API 8
        // mod_quiz_start_attempt

        currentAttemptId = await startQuizAttempt(Number(quizid));
      }

      setAttemptId(currentAttemptId);

      // API 9
      // mod_quiz_get_attempt_data

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

  // API 9
  // mod_quiz_get_attempt_data
  // Moodle quyết định số câu trên page.

  const loadQuestion = async (currentAttemptId: number, page: number) => {
    try {
      setLoading(true);

      const response = await getAttemptData(currentAttemptId, page);

      if (response?.exception) {
        throw new Error(response.message || "Không thể lấy dữ liệu bài thi.");
      }

      // LẤY TOÀN BỘ QUESTIONS CỦA PAGE

      const pageQuestions = response?.questions ?? [];

      if (pageQuestions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi.");
      }

      // LƯU TOÀN BỘ QUESTIONS

      setQuestions(pageQuestions);

      // KHÔI PHỤC ANSWER
      //
      // Mỗi câu có HTML riêng.
      // Moodle trả checked nếu câu đó đã được lưu.
      // =================================================

      pageQuestions.forEach((question: QuizQuestion) => {
        restoreSelectedAnswer(question.html);
      });

      // PAGE

      setCurrentPage(page);

      setNextPage(response?.nextpage ?? -1);
    } catch (error: any) {
      console.error("LOAD QUESTION ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể tải câu hỏi.");
    } finally {
      setLoading(false);
    }
  };

  // PARSE ANSWERS
  // Lấy radio input từ HTML của TỪNG CÂU.

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

      // BỎ QUA "CLEAR MY CHOICE"

      if (value === "-1") {
        return;
      }

      // Vị trí radio hiện tại

      const startIndex = match.index ?? 0;

      // Vị trí radio tiếp theo

      const nextMatch = radioMatches[index + 1];

      const endIndex = nextMatch?.index ?? html.length;

      // Lấy HTML từ radio hiện tại
      // đến radio tiếp theo

      const answerHtml = html.substring(startIndex, endIndex);

      // TÌM NỘI DUNG ĐÁP ÁN

      let label = "";

      // Cách 1:
      // tìm answernumber + nội dung

      const answerNumberMatch = answerHtml.match(
        /<span[^>]*class=["'][^"']*answernumber[^"']*["'][^>]*>[\s\S]*?<\/span>([\s\S]*?)(?:<\/div>|<\/label>)/i,
      );

      if (answerNumberMatch) {
        label = cleanHtmlText(answerNumberMatch[1]);
      }

      // Cách 2:
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

      // NẾU KHÔNG CÓ NỘI DUNG

      if (!label) {
        return;
      }

      // THÊM ANSWER

      result.push({
        name,
        value,
        label,
      });
    });

    // DEBUG

    return result;
  };

  // CLEAN HTML TEXT

  const cleanHtmlText = (html: string): string => {
    return html // Xóa script và style
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "") // Giữ cấu trúc xuống dòng của Moodle

      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n") // Xóa các HTML tag còn lại

      .replace(/<[^>]+>/g, "") // Decode HTML entities

      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"') // Chuẩn hóa khoảng trắng nhưng KHÔNG phá \n

      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")

      .trim();
  };

  // LẤY NỘI DUNG CÂU HỎI

  const extractQuestionText = (html: string): string => {
    const qtextMatch = html.match(
      /<div[^>]*class=["'][^"']*qtext[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );

    let text = qtextMatch?.[1] ?? "";

    text = cleanHtmlText(text);

    return text;
  };

  // KHÔI PHỤC ANSWER
  // Nếu Moodle trả checked thì lấy value đó.

  const restoreSelectedAnswer = (html: string) => {
    const checkedRegex = /<input[^>]*type=["']radio["'][^>]*checked[^>]*>/gi;

    const checkedInputs = html.match(checkedRegex) ?? [];

    if (checkedInputs.length === 0) {
      return;
    }

    setSelectedAnswers((previous) => {
      const restored = {
        ...previous,
      };

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

      return restored;
    });
  };

  // CHỌN ANSWER

  const handleSelectAnswer = (answer: AnswerOption) => {
    if (saving || submitting) {
      return;
    }

    setSelectedAnswers((previous) => ({
      ...previous,

      // Dùng chính name Moodle trả về

      [answer.name]: answer.value,
    }));
  };

  // BUILD DATA
  // Chuyển selectedAnswers thành format API 10/11.

  const buildSaveData = () => {
    return Object.entries(selectedAnswers).map(([name, value]) => ({
      name,
      value,
    }));
  };

  // API 10
  // mod_quiz_save_attempt

  const saveAnswers = async () => {
    if (!attemptId) {
      throw new Error("Không tìm thấy Attempt ID.");
    }

    const data = buildSaveData();

    // Không có đáp án thì không gọi API

    if (data.length === 0) {
      return;
    }

    const response = await saveQuizAttempt(attemptId, data);

    if (response?.exception) {
      throw new Error(response.message || "Không thể lưu câu trả lời.");
    }
  };

  // CÂU / PAGE TIẾP THEO

  const handleNext = async () => {
    if (!attemptId) {
      return;
    }

    try {
      setSaving(true);

      // API 10
      // Lưu toàn bộ đáp án trước khi sang page khác

      await saveAnswers();

      // CÒN PAGE TIẾP THEO

      if (nextPage !== -1) {
        await loadQuestion(attemptId, nextPage);

        return;
      }

      // ĐÃ TỚI PAGE CUỐI

      Alert.alert(
        "Thông báo",
        "Đây là trang cuối cùng. Bạn có thể kiểm tra lại đáp án rồi nộp bài.",
      );
    } catch (error: any) {
      console.error("NEXT ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể chuyển trang.");
    } finally {
      setSaving(false);
    }
  };

  // PAGE TRƯỚC

  const handlePrevious = async () => {
    if (!attemptId) {
      return;
    }

    if (currentPage <= 0) {
      return;
    }

    try {
      setSaving(true);

      // API 10
      // Lưu đáp án hiện tại

      await saveAnswers();

      // API 9
      // Load page trước

      await loadQuestion(attemptId, currentPage - 1);
    } catch (error: any) {
      console.error("PREVIOUS ERROR:", error);

      Alert.alert("Lỗi", error?.message || "Không thể quay lại trang trước.");
    } finally {
      setSaving(false);
    }
  };

  // XÁC NHẬN NỘP

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

  // API 10 → API 11

  const submitExam = async () => {
    if (!attemptId) {
      Alert.alert("Lỗi", "Không tìm thấy Attempt ID.");

      return;
    }

    try {
      setSubmitting(true);

      // API 10
      // LƯU ĐÁP ÁN CUỐI

      await saveAnswers();

      // DATA

      const data = buildSaveData();

      // API 11
      // mod_quiz_process_attempt

      const response = await processQuizAttempt(attemptId, data, 1);

      // ERROR

      if (response?.exception) {
        throw new Error(response.message || "Không thể nộp bài.");
      }

      // SUCCESS

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

  // LAST PAGE

  const isLastQuestion = nextPage === -1;

  // INITIAL LOADING

  if (loading && questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Đang tải bài thi...</Text>
      </View>
    );
  }

  // NO QUESTION

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Không có câu hỏi.</Text>
      </View>
    );
  }

  // UI

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.quizName}>{quizName}</Text>

          <Text style={styles.questionCounter}>
            Trang {currentPage + 1} · {questions.length} câu
          </Text>
        </View>

        {questions.map((questionItem, questionIndex) => {
          // -----------------------------------------
          // Mỗi câu tự lấy danh sách đáp án
          // -----------------------------------------

          const answers = parseQuestionHtml(questionItem.html);

          return (
            <View
              key={`${questionItem.slot}-${questionItem.questionnumber}`}
              style={styles.questionContainer}
            >
              <View style={styles.questionBox}>
                <Text style={styles.questionTitle}>
                  Câu {questionItem.questionnumber || questionIndex + 1}
                </Text>

                <Text style={styles.questionText}>
                  {extractQuestionText(questionItem.html)}
                </Text>
              </View>

              <View style={styles.answerBox}>
                <Text style={styles.answerTitle}>Chọn đáp án:</Text>

                {answers.map((answer, answerIndex) => {
                  const isSelected =
                    selectedAnswers[answer.name] === answer.value;

                  return (
                    <TouchableOpacity
                      key={`${answer.name}-${answer.value}-${answerIndex}`}
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
                        {getAnswerLabel(answerIndex, answer.label)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={styles.attemptInfo}>
          <Text style={styles.attemptText}>Attempt ID: {attemptId}</Text>

          <Text style={styles.attemptText}>Trang: {currentPage + 1}</Text>

          <Text style={styles.attemptText}>
            Số câu trên trang: {questions.length}
          </Text>

          <Text style={styles.attemptText}>Trạng thái: Đang làm bài</Text>
        </View>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            disabled={currentPage === 0 || saving || submitting}
            onPress={handlePrevious}
          >
            <Text style={styles.navButtonText}>← Trang trước</Text>
          </TouchableOpacity>

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
                {saving ? "Đang lưu..." : "Trang tiếp →"}
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

// ANSWER LABEL

const getAnswerLabel = (index: number, label: string) => {
  const letters = ["A", "B", "C", "D", "E", "F"];

  const prefix = letters[index] ?? `${index + 1}`;

  return `${prefix}. ${label}`;
};

// STYLES

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingBottom: 40,
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

  // HEADER

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

  // QUESTION CONTAINER

  questionContainer: {
    marginBottom: 5,
  },

  // QUESTION

  questionBox: {
    margin: 20,
    marginBottom: 10,
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

  // ANSWERS

  answerBox: {
    marginHorizontal: 20,
    marginBottom: 15,
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

  // RADIO

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

  // ANSWER TEXT

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
