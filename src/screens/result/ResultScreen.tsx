import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAttemptReview,
  getQuizFeedbackForGrade,
  getQuizzesByCourses,
  getUserBestGrade,
} from "../../api/quizApi";

import AppButton from "../../components/common/AppButton";
import AppCard from "../../components/common/AppCard";
import ResultScoreWater from "../../components/exam/ResultScoreWater";
import THEME from "../../constants/theme";
import Loading from "../../components/common/Loading";

import COLORS from "../../constants/colors";
import { isDescriptionQuestion } from "../../utils/questionCount";
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

// Luôn hiển thị điểm với 2 chữ số thập phân.
const formatScore = (value: number): string => {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
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
      setFeedback("");
      setBestGrade(null);

      const useridString = await AsyncStorage.getItem("userid");

      if (!useridString) {
        throw new Error("Không tìm thấy User ID.");
      }

      const userid = Number(useridString);

      if (!Number.isFinite(userid) || userid <= 0) {
        throw new Error("User ID không hợp lệ.");
      }

      // Lấy chi tiết bài làm.
      const reviewResponse = await getAttemptReview(attemptid);

      if (!reviewResponse?.attempt) {
        throw new Error("Chưa tìm thấy kết quả bài thi.");
      }

      // Tính số câu đúng.
      const questions = Array.isArray(reviewResponse.questions)
        ? reviewResponse.questions.filter((question: any) => !isDescriptionQuestion(question))
        : [];

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

      setTotalQuestions(questions.length);
      setCorrectAnswers(correctQ);

      // Lấy điểm bài thi từ Moodle.
      let finalScore =
        reviewResponse.grade !== null && reviewResponse.grade !== undefined
          ? Number(reviewResponse.grade)
          : Number(reviewResponse.attempt?.sumgrades ?? 0);

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
          const parsedMaxScore = Number(foundQuiz.grade);

          maxScore =
            Number.isFinite(parsedMaxScore) && parsedMaxScore > 0
              ? parsedMaxScore
              : null;

          // Chỉ quy đổi sumgrades khi review chưa trả về grade.
          if (
            (reviewResponse.grade === null ||
              reviewResponse.grade === undefined) &&
            Number(foundQuiz.sumgrades) > 0 &&
            maxScore !== null
          ) {
            finalScore = (finalScore / Number(foundQuiz.sumgrades)) * maxScore;
          }
        }
      } catch {
        // Giữ điểm từ review nếu không lấy được thông tin quiz.
      }

      setScore(Number.isFinite(finalScore) ? finalScore : null);
      setGradeMax(maxScore);

      // Lấy nhận xét theo điểm thực tế, không dùng điểm đã làm tròn.
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

      // Lấy điểm cao nhất.
      try {
        const bestGradeResponse = await getUserBestGrade(quizid, userid);

        if (bestGradeResponse?.hasgrade) {
          const parsedBestGrade = Number(bestGradeResponse.grade);

          setBestGrade(
            Number.isFinite(parsedBestGrade) ? parsedBestGrade : null,
          );
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
    void loadResult();
  }, [loadResult]);

  // Điểm số.
  const getScoreText = () => {
    if (score === null) {
      return "--";
    }

    return formatScore(score);
  };

  // Điểm đạt được / điểm tối đa.
  const getGradeText = () => {
    if (score === null || gradeMax === null || gradeMax <= 0) {
      return "--";
    }

    return `${formatScore(score)} / ${formatScore(gradeMax)}`;
  };

  // Phần trăm tiến độ.
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
      <SafeAreaView style={styles.loadingContainer}>
        <Loading message="Đang tải kết quả bài thi..." />
      </SafeAreaView>
    );
  }

  const percent = getPercent();
  const hasPercent = score !== null && gradeMax !== null && gradeMax > 0;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      <View style={styles.background}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.resultHeader}>
            <Text style={styles.quizName}>{quizName}</Text>
          </View>

          <View style={styles.scoreSection}>
            <View style={styles.scoreCircle} accessible accessibilityLabel={
              'Điểm ' + getGradeText() + (hasPercent ? ', đạt ' + percent.toFixed(0) + ' phần trăm' : '')
            }>
              <ResultScoreWater percent={percent} scoreText={getScoreText()} />
            </View>
            <Text style={styles.scoreMax}>{getGradeText()}</Text>
            {hasPercent && <View style={styles.percentBadge}>
              <Ionicons name="trending-up" size={16} color={COLORS.primary} />
              <Text style={styles.percent}>Đạt {percent.toFixed(0)}%</Text>
            </View>}
          </View>

          <View style={styles.details}>
            {bestGrade !== null && <AppCard style={styles.infoCard}>
              <View style={styles.infoIcon}><Ionicons name="trophy" size={23} color={COLORS.primary} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Điểm cao nhất</Text>
                <Text style={styles.bestValue}>{formatScore(bestGrade)} điểm</Text>
              </View>
            </AppCard>}
            {totalQuestions > 0 && <AppCard style={styles.infoCard}>
              <View style={styles.infoIcon}><Ionicons name="checkmark-circle" size={25} color={COLORS.primary} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số câu trả lời đúng</Text>
                <Text style={styles.infoValue}>{correctAnswers} / {totalQuestions} câu</Text>
              </View>
            </AppCard>}
            {!!feedback && <AppCard style={styles.feedbackCard}>
              <View style={styles.feedbackIcon}><Ionicons name="chatbubble-ellipses" size={23} color={COLORS.primary} /></View>
              <View style={styles.infoContent}>
                <Text style={styles.feedbackTitle}>Nhận xét</Text>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            </AppCard>}
          </View>

          {!!error && <View style={[styles.statusRow, styles.errorRow]}>
            <Ionicons name="alert-circle" size={22} color={COLORS.error} />
            <Text style={[styles.statusText, styles.errorText]}>
              {error}
            </Text>
          </View>}

        </ScrollView>
      </View>
      <View style={styles.footer}>
        <View style={styles.actions}>
            <AppButton onPress={handleReview}>
              <View style={styles.buttonContent}>
                <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
                <Text style={styles.reviewButtonText}>Xem lại bài làm</Text>
              </View>
            </AppButton>
            <AppButton onPress={handleHome} variant="outline">
              <View style={styles.buttonContent}>
                <Ionicons name="home" size={19} color={COLORS.primary} />
                <Text style={styles.homeButtonText}>Về trang chủ</Text>
              </View>
            </AppButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundSoft },
  background: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.backgroundSoft },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: THEME.spacing.lg, paddingTop: THEME.spacing.lg, paddingBottom: THEME.spacing.lg, width: "100%", maxWidth: 520, alignSelf: "center" },
  resultHeader: { alignItems: "center", gap: 5 },
  successIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, marginBottom: 3, borderWidth: 4, borderColor: COLORS.border },
  title: { ...THEME.typography.heading, textAlign: "center", fontSize: 19, fontWeight: "800", color: COLORS.text },
  quizName: { ...THEME.typography.title, textAlign: "center", lineHeight: 32, color: COLORS.text },
  scoreSection: { alignItems: "center", paddingTop: THEME.spacing.lg, paddingBottom: THEME.spacing.lg },
  scoreCircle: { width: 208, height: 208 },
  scoreMax: { marginTop: 9, fontSize: 19, fontWeight: "800", color: COLORS.text, fontVariant: ["tabular-nums"] },
  percentBadge: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.backgroundSoft, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 5 },
  percent: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
  details: { gap: 10 },
  infoCard: { flexDirection: "row", alignItems: "center", minHeight: 68, backgroundColor: COLORS.surface, borderRadius: THEME.radius.lg, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 9, elevation: 1 },
  infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.backgroundSoft, alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1, marginLeft: 12 },
  infoLabel: { ...THEME.typography.caption, color: COLORS.textSecondary, lineHeight: 18 },
  bestValue: { fontSize: 20, fontWeight: "800", color: COLORS.primary, marginTop: 1 },
  infoValue: { fontSize: 15, fontWeight: "700", color: COLORS.primary, marginTop: 2 },
  feedbackCard: { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, padding: 14, backgroundColor: COLORS.backgroundSoft, borderWidth: 1, borderColor: COLORS.border },
  feedbackIcon: { width: 38, alignItems: "center", paddingTop: 2 },
  feedbackTitle: { fontSize: 14, fontWeight: "700", color: COLORS.primary, marginBottom: 5 },
  feedbackText: { ...THEME.typography.bodySmall, lineHeight: 20, color: COLORS.textSecondary },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 8, paddingVertical: 16 },
  statusText: { flex: 1, fontSize: 11, lineHeight: 18, color: COLORS.textSecondary },
  errorRow: { marginTop: 10, paddingHorizontal: 12, backgroundColor: COLORS.backgroundSoft, borderRadius: 12 },
  errorText: { color: COLORS.error },
  footer: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: THEME.spacing.lg, paddingTop: THEME.spacing.sm, paddingBottom: THEME.spacing.md },
  actions: { gap: THEME.spacing.sm, width: "100%", maxWidth: 520, alignSelf: "center" },
  buttonContent: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: THEME.spacing.sm },
  reviewButtonText: { ...THEME.typography.bodySmall, fontWeight: "700", color: COLORS.white },
  homeButtonText: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
});
