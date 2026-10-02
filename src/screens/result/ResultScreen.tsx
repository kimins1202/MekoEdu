import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getQuizzesByCourses } from "../../api/quizApi";
import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";
import { AppStackParamList } from "../../types/navigation";

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type ResultRoute = {
  key: string;
  name: "Result";
  params: {
    courseid: number;
    quizid: number;
    quizName: string;
    attemptid: number;
  };
};

type GradeItem = {
  id?: number;
  iteminstance?: number;
  itemmodule?: string;
  itemname?: string;
  gradeformatted?: string;
  graderaw?: number;
  grademax?: number;
};

export default function ResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRoute>();

  const { courseid, quizid, quizName, attemptid } = route.params;

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [gradeMax, setGradeMax] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [bestGrade, setBestGrade] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadResult();
  }, []);

  const loadResult = async () => {
    try {
      setLoading(true);
      setError("");

      const useridString = await AsyncStorage.getItem("userid");

      if (!useridString) {
        throw new Error("Không tìm thấy User ID.");
      }

      const userid = Number(useridString);

      if (!Number.isFinite(userid) || userid <= 0) {
        throw new Error("User ID không hợp lệ.");
      }

      // 1. Lấy thông tin chi tiết bài làm bằng getAttemptReview
      const { getAttemptReview, getUserBestGrade, getQuizFeedbackForGrade } = await import("../../api/quizApi");
      const reviewResponse = await getAttemptReview(attemptid);

      if (!reviewResponse || !reviewResponse.attempt) {
        throw new Error("Chưa tìm thấy kết quả bài thi.");
      }

      // 2. Tính số câu đúng và tổng số câu
      const questions = Array.isArray(reviewResponse.questions) ? reviewResponse.questions : [];
      const totalQ = questions.length;
      let correctQ = 0;

      questions.forEach((q: any) => {
        if (Number(q.mark) > 0) {
          correctQ++;
        }
      });

      setTotalQuestions(totalQ);
      setCorrectAnswers(correctQ);

      // 3. Lấy điểm và quy đổi (nếu có grade thì là điểm đã quy đổi)
      let finalScore = (reviewResponse.grade !== null && reviewResponse.grade !== undefined)
        ? Number(reviewResponse.grade)
        : Number(reviewResponse.attempt?.sumgrades || 0);
      let maxScore = null;

      try {
        const quizzesResponse = await getQuizzesByCourses(courseid ? [courseid] : []);
        const quizzes = Array.isArray(quizzesResponse?.quizzes) ? quizzesResponse.quizzes : [];
        const foundQuiz = quizzes.find((q: any) => Number(q.id) === Number(quizid));

        if (foundQuiz) {
          maxScore = Number(foundQuiz.grade);

          if ((reviewResponse.grade === null || reviewResponse.grade === undefined) && Number(foundQuiz.sumgrades) > 0) {
            // Nếu Moodle chưa trả về grade (ví dụ bài tự luận chưa chấm xong hết), tự scale theo sumgrades
            if (maxScore > 0) {
              finalScore = (finalScore / Number(foundQuiz.sumgrades)) * maxScore;
            }
          }
        }
      } catch (err) {
        // Fallback
      }

      setScore(Number.isFinite(finalScore) ? finalScore : null);
      setGradeMax(Number.isFinite(maxScore) ? maxScore : null);

      if (Number.isFinite(finalScore)) {
        try {
          const feedbackRes = await getQuizFeedbackForGrade(quizid, finalScore);
          if (feedbackRes && feedbackRes.feedbacktext) {
            setFeedback(feedbackRes.feedbacktext.replace(/(<([^>]+)>)/gi, ""));
          }
        } catch (err) {
          console.log("Error getting feedback", err);
        }
      }

      try {
        const bestGradeRes = await getUserBestGrade(quizid, userid);
        if (bestGradeRes && bestGradeRes.hasgrade) {
          setBestGrade(Number(bestGradeRes.grade));
        }
      } catch (err) {
        console.log("Error getting best grade", err);
      }
    } catch (error: any) {
      setError(error?.message || "Không thể tải kết quả bài thi.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreText = () => {
    if (score === null) {
      return "--";
    }

    return Number.isInteger(score) ? String(score) : score.toFixed(2);
  };

  const getGradeText = () => {
    if (score === null || gradeMax === null || gradeMax <= 0) {
      return "--";
    }

    return `${score}/${gradeMax}`;
  };

  const getPercent = () => {
    if (score === null || gradeMax === null || gradeMax <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (score / gradeMax) * 100));
  };

  const handleReview = () => {
    navigation.navigate("AnswerReview", {
      attemptid,
      quizid,
      quizName,
    } as never);
  };

  const handleHome = () => {
    navigation.navigate("MainTabs");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải kết quả...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Kết quả bài thi" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={42} color={COLORS.white} />
        </View>

        <Text style={styles.title}>Đã hoàn thành bài thi</Text>

        <Text style={styles.quizName}>{quizName}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Điểm của bạn</Text>

          <Text style={styles.score}>{getScoreText()}</Text>

          <Text style={styles.scoreMax}>{getGradeText()}</Text>

          <View style={styles.progressBackground}>
            <View style={[styles.progress, { width: `${getPercent()}%` }]} />
          </View>

          <Text style={styles.percent}>{getPercent().toFixed(0)}%</Text>

          {bestGrade !== null && (
            <View style={styles.bestGradeContainer}>
              <Text style={styles.bestGradeText}>Điểm cao nhất: {Number.isInteger(bestGrade) ? bestGrade : bestGrade.toFixed(2)}</Text>
            </View>
          )}

          {feedback ? (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}
        </View>

        {totalQuestions > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số câu đúng</Text>
                <Text style={styles.infoValue}>
                  {correctAnswers} / {totalQuestions} câu
                </Text>
              </View>
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={COLORS.error}
            />

            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.successCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={COLORS.success}
            />

            <Text style={styles.successText}>
              Kết quả đã được ghi nhận trên hệ thống.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.reviewButton}
          activeOpacity={0.85}
          onPress={handleReview}
        >
          <Ionicons name="eye-outline" size={20} color={COLORS.white} />

          <Text style={styles.reviewButtonText}>Xem lại bài làm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.85}
          onPress={handleHome}
        >
          <Ionicons name="home-outline" size={20} color={COLORS.primary} />

          <Text style={styles.homeButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  successIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginBottom: 16,
  },

  title: {
    textAlign: "center",
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.text,
  },

  quizName: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  scoreCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  score: {
    marginTop: 6,
    fontSize: 52,
    lineHeight: 60,
    fontWeight: "800",
    color: COLORS.primary,
  },

  scoreMax: {
    marginTop: 2,
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  progressBackground: {
    width: "100%",
    height: 9,
    marginTop: 20,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundSoft,
  },

  progress: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  percent: {
    marginTop: 9,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  infoCard: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
  },

  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  infoValue: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  successCard: {
    marginTop: 16,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF7EF",
  },

  successText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.success,
  },

  errorCard: {
    marginTop: 16,
    padding: 15,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1F1",
  },

  errorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.error,
  },

  reviewButton: {
    height: 52,
    marginTop: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  reviewButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.white,
  },

  homeButton: {
    height: 52,
    marginTop: 12,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },

  homeButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  bestGradeContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 12,
  },
  bestGradeText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  feedbackContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B0E0E6",
    width: "100%",
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    textAlign: "center",
  },
});
