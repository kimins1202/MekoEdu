import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getAttemptReview,
  getQuizFeedbackForGrade,
  getQuizzesByCourses,
  getUserBestGrade,
} from "../../api/quizApi";

import AppButton from "../../components/common/AppButton";
import AppCard from "../../components/common/AppCard";
import AppHeader from "../../components/common/AppHeader";
import AppProgressBar from "../../components/common/AppProgressBar";
import Loading from "../../components/common/Loading";

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

export default function ResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ResultRoute>();

  const { courseid, quizid, quizName, attemptid } = route.params;

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [gradeMax, setGradeMax] = useState<number | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [bestGrade, setBestGrade] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadResult = useCallback(async () => {
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

      // Lấy chi tiết bài làm
      const reviewResponse = await getAttemptReview(attemptid);

      if (!reviewResponse?.attempt) {
        throw new Error("Chưa tìm thấy kết quả bài thi.");
      }

      // Tính số câu đúng
      const questions = Array.isArray(reviewResponse.questions)
        ? reviewResponse.questions
        : [];

      const totalQ = questions.length;

      let correctQ = 0;

      questions.forEach((question: any) => {
        const mark = Number(question.mark);
        const maxMark = Number(question.maxmark);

        if (
          Number.isFinite(mark) &&
          Number.isFinite(maxMark) &&
          maxMark > 0 &&
          mark >= maxMark
        ) {
          correctQ++;
        }
      });

      setTotalQuestions(totalQ);
      setCorrectAnswers(correctQ);

      // Lấy điểm bài thi
      let finalScore =
        reviewResponse.grade !== null && reviewResponse.grade !== undefined
          ? Number(reviewResponse.grade)
          : Number(reviewResponse.attempt?.sumgrades || 0);

      let maxScore: number | null = null;

      try {
        const quizzesResponse = await getQuizzesByCourses(
          courseid ? [courseid] : [],
        );

        const quizzes = Array.isArray(quizzesResponse?.quizzes)
          ? quizzesResponse.quizzes
          : [];

        const foundQuiz = quizzes.find(
          (quiz: any) => Number(quiz.id) === Number(quizid),
        );

        if (foundQuiz) {
          maxScore = Number(foundQuiz.grade);

          if (
            (reviewResponse.grade === null ||
              reviewResponse.grade === undefined) &&
            Number(foundQuiz.sumgrades) > 0 &&
            maxScore > 0
          ) {
            finalScore = (finalScore / Number(foundQuiz.sumgrades)) * maxScore;
          }
        }
      } catch {
        // Giữ điểm từ review nếu không lấy được thông tin quiz
      }

      setScore(Number.isFinite(finalScore) ? finalScore : null);
      setGradeMax(
        maxScore !== null && Number.isFinite(maxScore) ? maxScore : null,
      );

      // Lấy feedback
      if (Number.isFinite(finalScore)) {
        try {
          const feedbackResponse = await getQuizFeedbackForGrade(
            quizid,
            finalScore,
          );

          if (feedbackResponse?.feedbacktext) {
            setFeedback(
              feedbackResponse.feedbacktext.replace(/(<([^>]+)>)/gi, ""),
            );
          }
        } catch {
          setFeedback("");
        }
      }

      // Lấy điểm cao nhất
      try {
        const bestGradeResponse = await getUserBestGrade(quizid, userid);

        if (bestGradeResponse?.hasgrade) {
          setBestGrade(Number(bestGradeResponse.grade));
        }
      } catch {
        setBestGrade(null);
      }
    } catch (error: any) {
      setError(error?.message || "Không thể tải kết quả bài thi.");
    } finally {
      setLoading(false);
    }
  }, [attemptid, courseid, quizid]);

  useEffect(() => {
    let isMounted = true;

    const runLoad = async () => {
      if (!isMounted) {
        return;
      }

      await loadResult();
    };

    void runLoad();

    return () => {
      isMounted = false;
    };
  }, [loadResult]);

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
        <Loading message="Đang tải kết quả bài thi..." />
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
        {/* Result header */}
        <View style={styles.resultHeader}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={42} color={COLORS.white} />
          </View>

          <Text style={styles.title}>Đã hoàn thành bài thi</Text>

          <Text style={styles.quizName} numberOfLines={2}>
            {quizName}
          </Text>
        </View>

        {/* Score */}
        <AppCard style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Điểm của bạn</Text>

          <Text style={styles.score}>{getScoreText()}</Text>

          <Text style={styles.scoreMax}>{getGradeText()}</Text>

          <View style={styles.progressWrapper}>
            <AppProgressBar progress={getPercent()} height={9} />
          </View>

          <Text style={styles.percent}>{getPercent().toFixed(0)}%</Text>

          {bestGrade !== null && (
            <View style={styles.bestGradeContainer}>
              <Ionicons
                name="trophy-outline"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.bestGradeText}>
                Điểm cao nhất:{" "}
                {Number.isInteger(bestGrade) ? bestGrade : bestGrade.toFixed(2)}
              </Text>
            </View>
          )}

          {feedback ? (
            <View style={styles.feedbackContainer}>
              <View style={styles.feedbackHeader}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color={COLORS.primary}
                />

                <Text style={styles.feedbackTitle}>Nhận xét</Text>
              </View>

              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}
        </AppCard>

        {/* Correct answers */}
        {totalQuestions > 0 && (
          <AppCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số câu đúng</Text>

                <Text style={styles.infoValue}>
                  {correctAnswers} / {totalQuestions} câu
                </Text>
              </View>
            </View>
          </AppCard>
        )}

        {/* Result status */}
        <AppCard
          style={[
            styles.statusCard,
            error ? styles.errorCard : styles.successCard,
          ]}
        >
          <Ionicons
            name={error ? "alert-circle-outline" : "checkmark-circle-outline"}
            size={22}
            color={error ? COLORS.error : COLORS.success}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: error ? COLORS.error : COLORS.success,
              },
            ]}
          >
            {error ? error : "Kết quả đã được ghi nhận trên hệ thống."}
          </Text>
        </AppCard>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Xem lại bài làm"
            onPress={handleReview}
            style={styles.reviewButton}
          />

          <AppButton
            title="Về trang chủ"
            onPress={handleHome}
            style={styles.homeButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.backgroundSoft,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },

  resultHeader: {
    alignItems: "center",
    marginBottom: 18,
  },

  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    marginBottom: 14,
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  quizName: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  scoreCard: {
    alignItems: "center",
    padding: 22,
    marginBottom: 14,
  },

  scoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  score: {
    marginTop: 4,
    fontSize: 50,
    lineHeight: 58,
    fontWeight: "800",
    color: COLORS.primary,
  },

  scoreMax: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  progressWrapper: {
    width: "100%",
    marginTop: 18,
  },

  percent: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  bestGradeContainer: {
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.backgroundSoft,
  },

  bestGradeText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  feedbackContainer: {
    width: "100%",
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#B0E0E6",
  },

  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 7,
  },

  feedbackTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },

  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },

  infoCard: {
    marginBottom: 14,
    paddingHorizontal: 18,
    paddingVertical: 6,
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

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginBottom: 18,
    gap: 10,
  },

  successCard: {
    backgroundColor: "#EAF7EF",
    borderColor: "#C3E6CC",
  },

  errorCard: {
    backgroundColor: "#FFF1F1",
    borderColor: "#F3C4C4",
  },

  statusText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  actions: {
    gap: 12,
  },

  reviewButton: {
    minHeight: 52,
  },

  homeButton: {
    minHeight: 52,
  },
});
