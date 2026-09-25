import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation, usePreventRemove, useRoute } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/components/common/AppHeader";
import Loading from "@/components/common/Loading";
import COLORS from "@/constants/colors";
import useExamMonitoring from "@/hooks/useExamMonitoring";
import useExamCountdown from "@/hooks/useExamCountdown";
import ExamTimer from "@/components/exam/ExamTimer";
import { ExamContext, OfflineExam, listOfflineExams, queueExamAnswers, readOfflineExam, subscribeExamSync, updateOfflineExam } from "@/services/examStorageService";
import { isOfflineError, syncExam } from "@/services/syncService";
import { selectRequestedAttempt } from "@/utils/resumeExam";

import {
  getAttemptData,
  getAttemptDeadline,
  getUserAttempts,
  startQuizAttempt,
} from "../../api/quizApi";

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

export default function ExamScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { quizid, quizName, attemptid: requestedAttemptId } = route.params;

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(-1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [deadlineLoaded, setDeadlineLoaded] = useState(false);
  const secondsRemaining = useExamCountdown(deadline, !examFinished);
  const timeExpired = deadlineLoaded && deadline !== null && secondsRemaining === 0;
  const submissionLock = useRef(false);
  const autoSubmitStarted = useRef(false);
  const [examUserId, setExamUserId] = useState<number | null>(null);
  const contextRef = useRef<ExamContext | null>(null);
  const answerRef = useRef<Record<string, string>>({});
  const [offlineExam, setOfflineExam] = useState<OfflineExam | null>(null);
  const [localSaveError, setLocalSaveError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersLocked = !!offlineExam?.submitRequested;
  const isFocused = useIsFocused();
  const monitoring = useExamMonitoring(
    attemptId && examUserId ? { userid: examUserId, quizid: Number(quizid), attemptid: attemptId } : null,
    isFocused && !examFinished,
  );
  usePreventRemove(!!attemptId && questions.length > 0 && !examFinished && !answersLocked, () => {
    Alert.alert("Bài thi đang được giám sát", "Vui lòng nộp bài trước khi rời màn hình thi.");
  });

  // Khởi tạo bài thi
  useEffect(() => {
    const unsubscribe = subscribeExamSync((exam) => {
      const context = contextRef.current;
      if (context && exam.userid === context.userid && exam.attemptid === context.attemptid && exam.quizid === context.quizid) setOfflineExam(exam);
    });
    initializeExam();
    return () => { unsubscribe(); if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, []);

  const initializeExam = async () => {
    try {
      setLoading(true);

      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      const numericQuizId = Number(quizid);
      const numericUserId = Number(userId);
      const resumeId = requestedAttemptId === undefined ? undefined : Number(requestedAttemptId);
      if (resumeId !== undefined && (!Number.isInteger(resumeId) || resumeId <= 0)) throw new Error("Lượt thi cần tiếp tục không hợp lệ.");
      setExamUserId(numericUserId);
      const cached = (await listOfflineExams(numericUserId))
        .filter((exam) => exam.quizid === numericQuizId && !exam.submitted && (resumeId === undefined || exam.attemptid === resumeId))
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      // Resume a queued submission before creating another Moodle attempt.
      if (resumeId === undefined && cached && (cached.submitRequested || (cached.deadline !== null && Date.now() >= cached.deadline))) {
        restoreOfflineExam(cached);
        if (cached.submitRequested) void syncExam(cached).then(async () => {
          const latest = await readOfflineExam(cached);
          if (latest) setOfflineExam(latest);
        }).catch(() => setLocalSaveError(true));
        return;
      }

      // Lấy attempt hiện tại
      const getCurrentAttempt = async () => {
        const response = await getUserAttempts(
          numericQuizId,
          numericUserId,
          "all",
        );

        if (response?.exception) {
          throw new Error(
            response.message || "Không thể lấy danh sách attempt.",
          );
        }

        const attempts = Array.isArray(response?.attempts)
          ? response.attempts
          : [];
        if (resumeId !== undefined) return selectRequestedAttempt(attempts, resumeId);

        const currentAttempt = attempts.find(
          (attempt: any) =>
            Number(attempt.id) > 0 &&
            String(attempt.state).toLowerCase() === "inprogress",
        );

        return currentAttempt;
      };

      // Kiểm tra attempt đang làm
      let currentAttempt;
      try {
        currentAttempt = await getCurrentAttempt();
      } catch (error) {
        if (!isOfflineError(error) || !cached) throw error;
        restoreOfflineExam(cached);
        return;
      }
      if (currentAttempt?.state === "finished") {
        navigation.replace("Result", { attemptId: Number(currentAttempt.id), quizid: numericQuizId });
        return;
      }

      let currentAttemptId: number;

      // Dùng lại attempt cũ
      if (currentAttempt?.id) {
        currentAttemptId = Number(currentAttempt.id);
      } else {
        if (resumeId !== undefined) throw new Error("Không thể tiếp tục lượt thi đã chọn.");
        try {
          // Tạo attempt mới
          currentAttemptId = await startQuizAttempt(numericQuizId);
        } catch (error: any) {
          const message = error?.message?.toLowerCase() || "";

          // Moodle báo đã có attempt đang làm
          if (message.includes("attempt still in progress")) {
            currentAttempt = await getCurrentAttempt();

            if (!currentAttempt?.id) {
              throw new Error(
                "Moodle báo đang có attempt nhưng không tìm thấy Attempt ID.",
              );
            }

            currentAttemptId = Number(currentAttempt.id);
          } else {
            throw error;
          }
        }
      }

      if (!Number.isFinite(currentAttemptId) || currentAttemptId <= 0) {
        throw new Error("Attempt ID không hợp lệ.");
      }

      setAttemptId(currentAttemptId);
      const context = { userid: numericUserId, quizid: numericQuizId, attemptid: currentAttemptId };
      contextRef.current = context;
      const previous = await readOfflineExam(context);
      if (previous) {
        answerRef.current = previous.answers;
        setSelectedAnswers(previous.answers);
        setOfflineExam(previous);
        if (previous.submitRequested) {
          restoreOfflineExam(previous);
          await syncExam(context);
          const latest = await readOfflineExam(context);
          if (latest) setOfflineExam(latest);
          return;
        }
      }
      let currentDeadline;
      try { currentDeadline = await getAttemptDeadline(numericQuizId, currentAttemptId); }
      catch (error) {
        if (!isOfflineError(error) || !previous) throw error;
        currentDeadline = previous.deadline;
      }
      await updateOfflineExam(context, (exam) => ({ ...exam, deadline: currentDeadline }));
      setDeadline(currentDeadline);
      setDeadlineLoaded(true);

      // Lấy câu hỏi
      const resumePage = Number(previous?.currentPage ?? currentAttempt?.currentpage ?? 0);
      await loadQuestion(currentAttemptId, Number.isInteger(resumePage) && resumePage >= 0 ? resumePage : 0);
    } catch (error: any) {
      Alert.alert(
        "Không thể mở bài thi",
        error?.message || "Đã xảy ra lỗi khi mở bài thi.",
        [
          {
            text: "Quay lại",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  };
  const restoreOfflineExam = (exam: OfflineExam) => {
    const pageNumber = exam.pages[exam.currentPage] ? exam.currentPage : Number(Object.keys(exam.pages)[0]);
    const page = exam.pages[pageNumber];
    if (!page) throw new Error("Chưa có câu hỏi lưu trên thiết bị. Hãy kết nối mạng để tải bài thi.");
    contextRef.current = { userid: exam.userid, quizid: exam.quizid, attemptid: exam.attemptid };
    answerRef.current = exam.answers;
    setSelectedAnswers(exam.answers);
    setAttemptId(exam.attemptid);
    setOfflineExam(exam);
    setDeadline(exam.deadline);
    setDeadlineLoaded(true);
    setQuestions(page.questions);
    page.questions.forEach((question: QuizQuestion) => restoreSelectedAnswer(question.html));
    setCurrentPage(pageNumber);
    setNextPage(page.nextpage);
  };
  // Tải câu hỏi
  const loadQuestion = async (currentAttemptId: number, page: number) => {
    try {
      setLoading(true);

      let response;
      try { response = await getAttemptData(currentAttemptId, page); }
      catch (error) {
        if (!isOfflineError(error) || !contextRef.current) throw error;
        const cached = await readOfflineExam(contextRef.current);
        response = cached?.pages[page];
        if (!response) throw new Error("Trang này chưa được tải. Hãy kết nối mạng để xem câu hỏi mới; đáp án hiện tại đã được giữ lại.");
      }

      if (response?.exception) {
        throw new Error(response.message || "Không thể lấy dữ liệu bài thi.");
      }

      const pageQuestions = response?.questions ?? [];

      if (pageQuestions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi.");
      }
      if (contextRef.current) await updateOfflineExam(contextRef.current, (exam) => ({
        ...exam, currentPage: page, pages: { ...exam.pages, [page]: { questions: pageQuestions, nextpage: response.nextpage ?? -1 } },
      }));

      setQuestions(pageQuestions);
      setCurrentPage(page);
      setNextPage(response?.nextpage ?? -1);

      pageQuestions.forEach((question: QuizQuestion) => {
        restoreSelectedAnswer(question.html);
      });
    } finally {
      setLoading(false);
    }
  };

  // Phân tích đáp án
  const parseQuestionHtml = (html: string): AnswerOption[] => {
    const result: AnswerOption[] = [];

    const radioRegex = /<input\b[^>]*type=["']radio["'][^>]*>/gi;

    const radioMatches = [...html.matchAll(radioRegex)];

    radioMatches.forEach((match, index) => {
      const input = match[0];

      const nameMatch = input.match(/name=["']([^"']+)["']/i);

      const valueMatch = input.match(/value=["']([^"']*)["']/i);

      if (!nameMatch || !valueMatch) {
        return;
      }

      const name = nameMatch[1];
      const value = valueMatch[1];

      if (!name.endsWith("_answer") || value === "-1") {
        return;
      }

      const startIndex = match.index ?? 0;
      const nextMatch = radioMatches[index + 1];
      const endIndex = nextMatch?.index ?? html.length;

      const answerHtml = html.substring(startIndex, endIndex);

      let label = "";

      const answerNumberMatch = answerHtml.match(
        /<span[^>]*class=["'][^"']*answernumber[^"']*["'][^>]*>[\s\S]*?<\/span>([\s\S]*?)(?:<\/div>|<\/label>)/i,
      );

      if (answerNumberMatch) {
        label = cleanHtmlText(answerNumberMatch[1]);
      }

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

      if (!label) {
        return;
      }

      result.push({
        name,
        value,
        label,
      });
    });

    return result;
  };

  // Làm sạch HTML
  const cleanHtmlText = (html: string): string => {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  // Lấy nội dung câu hỏi
  const extractQuestionText = (html: string): string => {
    const qtextMatch = html.match(
      /<div[^>]*class=["'][^"']*qtext[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );

    return cleanHtmlText(qtextMatch?.[1] ?? "");
  };

  // Khôi phục đáp án
  const restoreSelectedAnswer = (html: string) => {
    const checkedRegex = /<input[^>]*type=["']radio["'][^>]*checked[^>]*>/gi;

    const checkedInputs = html.match(checkedRegex) ?? [];

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

        if (value !== "-1" && !(name in answerRef.current)) {
          restored[name] = value;
        }
      });

      answerRef.current = { ...restored, ...answerRef.current };
      return answerRef.current;
    });
  };

  // Chọn đáp án
  const handleSelectAnswer = (answer: AnswerOption) => {
    if (saving || submitting || submissionLock.current || examFinished || answersLocked || (deadline !== null && Date.now() >= deadline)) {
      return;
    }

    const answers = { ...answerRef.current, [answer.name]: answer.value };
    answerRef.current = answers;
    setSelectedAnswers(answers);
    if (contextRef.current) {
      const context = contextRef.current;
      void queueExamAnswers(context, answers).then(() => {
        setLocalSaveError(false);
        if (syncTimer.current) clearTimeout(syncTimer.current);
        syncTimer.current = setTimeout(() => { void syncExam(context).catch(() => setLocalSaveError(true)); }, 1500);
      }).catch(() => setLocalSaveError(true));
    }
  };

  // Lưu đáp án
  const saveAnswers = async () => {
    if (!contextRef.current) {
      throw new Error("Không tìm thấy Attempt ID.");
    }

    await queueExamAnswers(contextRef.current, answerRef.current);
    setLocalSaveError(false);
    void syncExam(contextRef.current).catch(() => setLocalSaveError(true));
  };

  // Sang trang tiếp theo
  const handleNext = async () => {
    if (!attemptId) {
      return;
    }

    try {
      setSaving(true);

      await saveAnswers();

      if (nextPage !== -1) {
        await loadQuestion(attemptId, nextPage);
        return;
      }

      Alert.alert(
        "Thông báo",
        "Đây là trang cuối cùng. Bạn có thể kiểm tra lại đáp án rồi nộp bài.",
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể chuyển trang.");
    } finally {
      setSaving(false);
    }
  };

  // Quay lại trang trước
  const handlePrevious = async () => {
    if (!attemptId || currentPage <= 0) {
      return;
    }

    try {
      setSaving(true);

      await saveAnswers();
      await loadQuestion(attemptId, currentPage - 1);
    } catch (error: any) {
      Alert.alert("Lỗi", error?.message || "Không thể quay lại trang trước.");
    } finally {
      setSaving(false);
    }
  };

  // Xác nhận nộp bài
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

  // Nộp và xử lý bài thi
 const submitExam = async () => {
   if (submissionLock.current || examFinished) return;
   if (!attemptId) {
     Alert.alert("Lỗi", "Không tìm thấy Attempt ID.");
     return;
   }

   try {
     submissionLock.current = true;
     setSubmitting(true);

     if (!contextRef.current) throw new Error("Không tìm thấy dữ liệu lượt thi.");
     await queueExamAnswers(contextRef.current, answerRef.current, true);
     setLocalSaveError(false);
     await syncExam(contextRef.current, true);
   } catch (error: any) {
     Alert.alert("Lỗi nộp bài", error?.message || "Không thể nộp bài.");
   } finally {
     submissionLock.current = false;
     setSubmitting(false);
   }
 };

  useEffect(() => {
    if (!offlineExam?.submitted || examFinished) return;
    monitoring.complete();
    setExamFinished(true);
  }, [offlineExam?.submitted, examFinished]);

  useEffect(() => {
    if (examFinished) navigation.replace("Result", { attemptId, quizid: Number(quizid) });
  }, [examFinished, navigation, attemptId, quizid]);

  const retrySync = async () => {
    if (!contextRef.current || syncing) return;
    setSyncing(true);
    try {
      await queueExamAnswers(contextRef.current, answerRef.current, !!offlineExam?.submitRequested);
      setLocalSaveError(false);
      await syncExam(contextRef.current, true);
    } catch { setLocalSaveError(true); }
    finally { setSyncing(false); }
  };

  useEffect(() => {
    if (!timeExpired || loading || saving || submitting || examFinished || autoSubmitStarted.current) return;
    autoSubmitStarted.current = true;
    void submitExam();
  }, [timeExpired, loading, saving, submitting, examFinished]);

  const isLastQuestion = nextPage === -1;

  if (loading && questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Loading message="Đang tải bài thi..." />
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="document-text-outline"
            size={38}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>Không có câu hỏi</Text>

        <Text style={styles.emptyText}>
          Không tìm thấy câu hỏi cho bài thi này.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Bài thi" subtitle={quizName} showBack />

      <View style={styles.monitoringBanner} accessibilityLiveRegion="polite">
        <Text style={[styles.monitoringTitle, { color: localSaveError || offlineExam?.status === "Failed" ? COLORS.error : offlineExam?.status === "Pending" ? COLORS.warning : COLORS.primary }]}>
          Đồng bộ: {localSaveError ? "Failed" : offlineExam?.status ?? "Pending"}{syncing ? " · Đang gửi…" : ""}
        </Text>
        <Text style={styles.monitoringText}>
          {localSaveError ? "Chưa lưu được trên thiết bị. Hãy thử lại trước khi đóng ứng dụng."
            : offlineExam?.status === "Failed" ? "Đồng bộ thất bại. Bài làm vẫn được giữ trên thiết bị; nhấn Đồng bộ lại để thử gửi."
            : offlineExam?.submitRequested && !offlineExam.submitted ? "Đã lưu yêu cầu nộp bài trên thiết bị, đang chờ Moodle xác nhận."
            : offlineExam?.status === "Synced" ? "Moodle đã xác nhận bản lưu gần nhất."
            : "Bài làm được giữ trên thiết bị và sẽ gửi lại khi kết nối phục hồi."}
        </Text>
        {!!offlineExam?.error && <Text style={styles.monitoringError}>{offlineExam.error}</Text>}
        {(localSaveError || offlineExam?.status !== "Synced") && (
          <TouchableOpacity onPress={retrySync} disabled={syncing || submitting} accessibilityRole="button">
            <Text style={styles.monitoringTitle}>Đồng bộ lại</Text>
          </TouchableOpacity>
        )}
      </View>

      {deadlineLoaded && !examFinished && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
          <ExamTimer seconds={secondsRemaining} />
          {timeExpired && (
            <View>
              <Text style={styles.monitoringError}>
                {submitting ? "Hết giờ. Đang nộp bài…" : "Đã hết thời gian làm bài."}
              </Text>
              {!submitting && (
                <TouchableOpacity onPress={submitExam} disabled={saving || loading} accessibilityRole="button">
                  <Text style={styles.monitoringTitle}>Thử nộp bài lại</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.monitoringBanner} accessibilityLiveRegion="polite">
        <Text style={styles.monitoringTitle}>
          {examFinished ? "Đã kết thúc giám sát" : "Đang giám sát màn hình thi"}
        </Text>
        {!examFinished && <Text style={styles.monitoringText}>{monitoring.protection}</Text>}
        <Text style={styles.monitoringText}>
          Số lần rời màn hình: {monitoring.departures} · Nhật ký lưu trên thiết bị
        </Text>
        {monitoring.storageError && <Text style={styles.monitoringError}>Không thể lưu nhật ký giám sát trên thiết bị.</Text>}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizHeader}>
          <View style={styles.quizHeaderIcon}>
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.quizHeaderContent}>
            <Text style={styles.quizName} numberOfLines={2}>
              {quizName}
            </Text>

            <View style={styles.counterRow}>
              <Ionicons
                name="layers-outline"
                size={15}
                color={COLORS.primary}
              />

              <Text style={styles.questionCounter}>
                Trang {currentPage + 1} · {questions.length} câu
              </Text>
            </View>
          </View>
        </View>

        {questions.map((questionItem, questionIndex) => {
          const answers = parseQuestionHtml(questionItem.html);

          return (
            <View
              key={`${questionItem.slot}-${questionItem.questionnumber}`}
              style={styles.questionContainer}
            >
              <View style={styles.questionBox}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>
                      {questionItem.questionnumber || questionIndex + 1}
                    </Text>
                  </View>

                  <Text style={styles.questionLabel}>Câu hỏi</Text>
                </View>

                <Text style={styles.questionText}>
                  {extractQuestionText(questionItem.html)}
                </Text>
              </View>

              <View style={styles.answerBox}>
                <Text style={styles.answerTitle}>Chọn đáp án</Text>

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
                      disabled={saving || submitting || examFinished || timeExpired || answersLocked}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>

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
          <View style={styles.attemptHeader}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={COLORS.primary}
            />

            <Text style={styles.attemptTitle}>Thông tin bài làm</Text>
          </View>

          <View style={styles.attemptDivider} />

          <View style={styles.attemptRow}>
            <Text style={styles.attemptLabel}>Attempt ID</Text>

            <Text style={styles.attemptValue}>{attemptId}</Text>
          </View>

          <View style={styles.attemptRow}>
            <Text style={styles.attemptLabel}>Trang hiện tại</Text>

            <Text style={styles.attemptValue}>{currentPage + 1}</Text>
          </View>

          <View style={styles.attemptRow}>
            <Text style={styles.attemptLabel}>Số câu trên trang</Text>

            <Text style={styles.attemptValue}>{questions.length}</Text>
          </View>

          <View style={styles.attemptRow}>
            <Text style={styles.attemptLabel}>Trạng thái</Text>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>Đang làm bài</Text>
            </View>
          </View>
        </View>

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            disabled={currentPage === 0 || saving || submitting || examFinished || timeExpired || answersLocked}
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />

            <Text style={styles.previousButtonText}>Trang trước</Text>
          </TouchableOpacity>

          {!isLastQuestion ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                saving && styles.navButtonDisabled,
              ]}
              disabled={saving || submitting || examFinished || timeExpired || answersLocked}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {saving ? "Đang lưu..." : "Trang tiếp"}
              </Text>

              {!saving && (
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.submitButton,
                submitting && styles.navButtonDisabled,
              ]}
              disabled={saving || submitting || examFinished || answersLocked}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={COLORS.white}
              />

              <Text style={styles.submitButtonText}>
                {submitting ? "Đang nộp..." : "Nộp bài"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingMore}>
            <Loading
              message="Đang tải câu hỏi..."
              size="small"
              fullScreen={false}
            />
          </View>
        )}
      </ScrollView>
      {monitoring.hidden && (
        <View style={styles.privacyOverlay}>
          <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
          <Text style={styles.monitoringTitle}>Nội dung bài thi đã được che</Text>
          <Text style={styles.monitoringText}>Quay lại ứng dụng để tiếp tục làm bài.</Text>
        </View>
      )}
    </View>
  );
}

// Hiển thị nhãn đáp án
const getAnswerLabel = (index: number, label: string) => {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const prefix = letters[index] ?? `${index + 1}`;

  return `${prefix}. ${label}`;
};

const styles = StyleSheet.create({
  monitoringBanner: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#EAF6EE", gap: 4 },
  monitoringTitle: { fontSize: 14, fontWeight: "700", color: COLORS.primary },
  monitoringText: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  monitoringError: { fontSize: 12, color: COLORS.error },
  privacyOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", gap: 12, zIndex: 10 },
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingMore: {
    marginTop: 12,
  },

  quizHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  quizHeaderIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  quizHeaderContent: {
    flex: 1,
  },

  quizName: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  questionCounter: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  questionContainer: {
    marginBottom: 4,
  },

  questionBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  questionNumber: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  questionNumberText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  questionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  questionText: {
    fontSize: 16,
    lineHeight: 25,
    color: COLORS.text,
  },

  answerBox: {
    marginBottom: 14,
  },

  answerTitle: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  answerOption: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.white,
  },

  answerSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#EFF8F2",
  },

  radioOuter: {
    width: 22,
    height: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#AAB6B0",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  radioOuterSelected: {
    borderColor: COLORS.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  answerText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },

  answerTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: "600",
  },

  attemptInfo: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#EEF6F1",
    borderWidth: 1,
    borderColor: "#D6E7DC",
  },

  attemptHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  attemptTitle: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  attemptDivider: {
    height: 1,
    backgroundColor: "#D9E7DE",
    marginVertical: 12,
  },

  attemptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 27,
  },

  attemptLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  attemptValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#DDF1E4",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  navigation: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  navButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },

  previousButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  previousButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  nextButton: {
    backgroundColor: COLORS.primaryDark,
  },

  nextButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
  },

  navButtonDisabled: {
    opacity: 0.45,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
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
    fontSize: 18,
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

  backButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primaryDark,
  },

  backButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
