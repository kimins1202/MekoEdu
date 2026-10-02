import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useIsFocused,
  useNavigation,
  usePreventRemove,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Loading from "@/components/common/Loading";
import ExamTimer from "@/components/exam/ExamTimer";
import COLORS from "@/constants/colors";
import useExamCountdown from "@/hooks/useExamCountdown";
import useExamMonitoring from "@/hooks/useExamMonitoring";

import {
  ExamContext,
  OfflineExam,
  listOfflineExams,
  queueExamAnswers,
  readOfflineExam,
  subscribeExamSync,
  updateOfflineExam,
} from "@/services/examStorageService";

import { isOfflineError, syncExam } from "@/services/syncService";
import { selectRequestedAttempt } from "@/utils/resumeExam";

import {
  getAttemptData,
  getAttemptDeadline,
  getQuizMonitoringConfig,
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

type CachedPage = {
  questions: QuizQuestion[];
  nextpage: number;
};

type QuestionOverviewItem = {
  slot: number;
  page: number;
  questionNumber: string;
  answerName: string | null;
  flagged: boolean;
};

export default function ExamScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    quizid,
    quizName,
    attemptid: requestedAttemptId,
    submitConfirmed,
    targetQuestionSlot,
  } = route.params;

  const [attemptId, setAttemptId] = useState<number | null>(null);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(-1);

  const [totalQuestions, setTotalQuestions] = useState(0);

  const [questionOverview, setQuestionOverview] = useState<
    QuestionOverviewItem[]
  >([]);

  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<number, boolean>
  >({});

  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  const [monitoringConfigLoaded, setMonitoringConfigLoaded] = useState(false);

  const [maxDepartures, setMaxDepartures] = useState(3);

  const [questionMenuVisible, setQuestionMenuVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [examFinished, setExamFinished] = useState(false);

  const [deadline, setDeadline] = useState<number | null>(null);
  const [deadlineLoaded, setDeadlineLoaded] = useState(false);

  const [examUserId, setExamUserId] = useState<number | null>(null);

  const [offlineExam, setOfflineExam] = useState<OfflineExam | null>(null);

  const [localSaveError, setLocalSaveError] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const contextRef = useRef<ExamContext | null>(null);

  const answerRef = useRef<Record<string, string>>({});

  const pageCacheRef = useRef<Record<number, CachedPage>>({});

  const flaggedRef = useRef<Record<number, boolean>>({});

  const submissionLock = useRef(false);

  const autoSubmitStarted = useRef(false);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  const questionPositionsRef = useRef<Record<number, number>>({});

  const pendingQuestionSlotRef = useRef<number | null>(null);

  const secondsRemaining = useExamCountdown(deadline, !examFinished);

  const timeExpired =
    deadlineLoaded && deadline !== null && secondsRemaining === 0;

  const answersLocked = !!offlineExam?.submitRequested;

  const insets = useSafeAreaInsets();

  const isFocused = useIsFocused();

  const monitoring = useExamMonitoring(
    attemptId && examUserId
      ? {
          userid: examUserId,
          quizid: Number(quizid),
          attemptid: attemptId,
        }
      : null,

    monitoringEnabled && monitoringConfigLoaded && isFocused && !examFinished,
  );

  const answeredCount = Math.min(
    totalQuestions || Object.keys(selectedAnswers).length,
    Object.values(selectedAnswers).filter(
      (value) => value !== undefined && value !== null && value !== "",
    ).length,
  );

  const progressPercent =
    totalQuestions > 0
      ? Math.min(Math.round((answeredCount / totalQuestions) * 100), 100)
      : 0;

  const isLastPage = nextPage === -1;

  const timerIsUrgent =
    !timeExpired &&
    secondsRemaining !== null &&
    secondsRemaining > 0 &&
    secondsRemaining <= 60;

  usePreventRemove(
    monitoringEnabled &&
      !!attemptId &&
      questions.length > 0 &&
      !examFinished &&
      !answersLocked,

    () => {
      Alert.alert(
        "Bài thi đang được giám sát",
        "Vui lòng nộp bài trước khi rời màn hình thi.",
      );
    },
  );

  // Quản lý toàn bộ câu hỏi, đáp án và trạng thái đánh dấu xuyên suốt các page.
  useEffect(() => {
    const unsubscribe = subscribeExamSync((exam) => {
      const context = contextRef.current;

      if (
        context &&
        exam.userid === context.userid &&
        exam.attemptid === context.attemptid &&
        exam.quizid === context.quizid
      ) {
        setOfflineExam(exam);
      }
    });

    initializeExam();

    return () => {
      unsubscribe();

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (pendingQuestionSlotRef.current === null) {
      return;
    }

    const slot = pendingQuestionSlotRef.current;
    const position = questionPositionsRef.current[slot];

    if (position !== undefined) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(position - 20, 0),
          animated: true,
        });

        pendingQuestionSlotRef.current = null;
      }, 100);
    }
  }, [currentPage, questions]);

  const getQuestionSlot = (question: QuizQuestion) => {
    const slot = Number(question.slot);

    if (Number.isFinite(slot) && slot > 0) {
      return slot;
    }

    const number = Number(question.number);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }

    return 0;
  };

  const getQuestionAnswerName = (html: string): string | null => {
    const match = html.match(
      /<input\b[^>]*type=["']radio["'][^>]*name=["']([^"']+)["']/i,
    );

    return match?.[1] ?? null;
  };

  const mergeQuestionOverview = (
    page: number,
    pageQuestions: QuizQuestion[],
  ) => {
    setQuestionOverview((previous) => {
      const map = new Map<number, QuestionOverviewItem>();

      previous.forEach((item) => {
        map.set(item.slot, item);
      });

      pageQuestions.forEach((question) => {
        const slot = getQuestionSlot(question);

        if (!slot) {
          return;
        }

        const existingFlag = flaggedRef.current[slot];

        map.set(slot, {
          slot,
          page,
          questionNumber:
            question.questionnumber || String(question.number ?? slot),
          answerName: getQuestionAnswerName(question.html),
          flagged:
            existingFlag !== undefined
              ? existingFlag
              : Boolean(question.flagged),
        });
      });

      return Array.from(map.values()).sort((a, b) => a.slot - b.slot);
    });
  };

  const getOfflineQuestionCount = (exam: OfflineExam) => {
    const slots = new Set<number>();

    Object.values(exam.pages ?? {}).forEach((page: any) => {
      (page?.questions ?? []).forEach((question: QuizQuestion) => {
        const slot = getQuestionSlot(question);

        if (slot > 0) {
          slots.add(slot);
        }
      });
    });

    return slots.size;
  };

  const buildOverviewFromOfflineExam = (exam: OfflineExam) => {
    const map = new Map<number, QuestionOverviewItem>();

    Object.entries(exam.pages ?? {}).forEach(
      ([pageNumber, page]: [string, any]) => {
        const pageIndex = Number(pageNumber);

        (page?.questions ?? []).forEach((question: QuizQuestion) => {
          const slot = getQuestionSlot(question);

          if (!slot) {
            return;
          }

          const existingFlag = flaggedRef.current[slot];

          if (existingFlag === undefined) {
            flaggedRef.current[slot] = Boolean(question.flagged);
          }

          map.set(slot, {
            slot,
            page: pageIndex,
            questionNumber:
              question.questionnumber || String(question.number ?? slot),
            answerName: getQuestionAnswerName(question.html),
            flagged:
              existingFlag !== undefined
                ? existingFlag
                : Boolean(question.flagged),
          });
        });
      },
    );

    setQuestionOverview(
      Array.from(map.values()).sort((a, b) => a.slot - b.slot),
    );
  };

  const getAllQuestionsCount = async (currentAttemptId: number) => {
    const slots = new Set<number>();
    const overviewMap = new Map<number, QuestionOverviewItem>();

    let page = 0;

    const visitedPages = new Set<number>();

    while (page >= 0 && !visitedPages.has(page)) {
      visitedPages.add(page);

      const cachedPage = pageCacheRef.current[page];

      if (cachedPage) {
        cachedPage.questions.forEach((question) => {
          const slot = getQuestionSlot(question);

          if (!slot) {
            return;
          }

          slots.add(slot);

          const existingFlag = flaggedRef.current[slot];

          if (existingFlag === undefined) {
            flaggedRef.current[slot] = Boolean(question.flagged);
          }

          overviewMap.set(slot, {
            slot,
            page,
            questionNumber:
              question.questionnumber || String(question.number ?? slot),
            answerName: getQuestionAnswerName(question.html),
            flagged:
              existingFlag !== undefined
                ? existingFlag
                : Boolean(question.flagged),
          });
        });

        page = cachedPage.nextpage;

        continue;
      }

      const response = await getAttemptData(currentAttemptId, page);

      if (response?.exception) {
        throw new Error(response.message || "Không thể lấy dữ liệu bài thi.");
      }

      const pageQuestions: QuizQuestion[] = response?.questions ?? [];

      const pageNext = Number(response?.nextpage ?? -1);

      pageQuestions.forEach((question) => {
        const slot = getQuestionSlot(question);

        if (!slot) {
          return;
        }

        slots.add(slot);

        const existingFlag = flaggedRef.current[slot];

        if (existingFlag === undefined) {
          flaggedRef.current[slot] = Boolean(question.flagged);
        }

        overviewMap.set(slot, {
          slot,
          page,
          questionNumber:
            question.questionnumber || String(question.number ?? slot),
          answerName: getQuestionAnswerName(question.html),
          flagged:
            existingFlag !== undefined
              ? existingFlag
              : Boolean(question.flagged),
        });
      });

      pageCacheRef.current[page] = {
        questions: pageQuestions,
        nextpage: pageNext,
      };

      page = pageNext;
    }

    setQuestionOverview(
      Array.from(overviewMap.values()).sort((a, b) => a.slot - b.slot),
    );

    return slots.size;
  };

  const initializeExam = async () => {
    try {
      setLoading(true);

      pageCacheRef.current = {};
      flaggedRef.current = {};

      const userId = await AsyncStorage.getItem("userid");

      if (!userId) {
        throw new Error("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
      }

      const numericQuizId = Number(quizid);
      const numericUserId = Number(userId);

      try {
        const monitoringConfig = await getQuizMonitoringConfig(numericQuizId);

        setMonitoringEnabled(monitoringConfig.monitoring_enabled);

        setMaxDepartures(monitoringConfig.max_departures);

      } catch (error) {

        // Fail-safe:
        // nếu không lấy được cấu hình thì mặc định tắt
        setMonitoringEnabled(false);
        setMaxDepartures(3);
      } finally {
        setMonitoringConfigLoaded(true);
      }

      const resumeId =
        requestedAttemptId === undefined
          ? undefined
          : Number(requestedAttemptId);

      if (
        resumeId !== undefined &&
        (!Number.isInteger(resumeId) || resumeId <= 0)
      ) {
        throw new Error("Lượt thi cần tiếp tục không hợp lệ.");
      }

      setExamUserId(numericUserId);

      const cached = (await listOfflineExams(numericUserId))
        .filter(
          (exam) =>
            exam.quizid === numericQuizId &&
            !exam.submitted &&
            (resumeId === undefined || exam.attemptid === resumeId),
        )
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];

      if (
        resumeId === undefined &&
        cached &&
        (cached.submitRequested ||
          (cached.deadline !== null && Date.now() >= cached.deadline))
      ) {
        restoreOfflineExam(cached);

        const cachedTotal = getOfflineQuestionCount(cached);

        if (cachedTotal > 0) {
          setTotalQuestions(cachedTotal);
        }

        buildOverviewFromOfflineExam(cached);

        if (cached.submitRequested) {
          void syncExam(cached)
            .then(async () => {
              const latest = await readOfflineExam(cached);

              if (latest) {
                setOfflineExam(latest);
              }
            })
            .catch(() => {
              setLocalSaveError(true);
            });
        }

        return;
      }

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

        if (resumeId !== undefined) {
          return selectRequestedAttempt(attempts, resumeId);
        }

        return attempts.find(
          (attempt: any) =>
            Number(attempt.id) > 0 &&
            String(attempt.state).toLowerCase() === "inprogress",
        );
      };

      let currentAttempt;

      try {
        currentAttempt = await getCurrentAttempt();
      } catch (error) {
        if (!isOfflineError(error) || !cached) {
          throw error;
        }

        restoreOfflineExam(cached);

        const cachedTotal = getOfflineQuestionCount(cached);

        if (cachedTotal > 0) {
          setTotalQuestions(cachedTotal);
        }

        buildOverviewFromOfflineExam(cached);

        return;
      }

      if (currentAttempt?.state === "finished") {
        navigation.replace("Result", {
          attemptId: Number(currentAttempt.id),
          quizid: numericQuizId,
        });

        return;
      }

      let currentAttemptId: number;

      if (currentAttempt?.id) {
        currentAttemptId = Number(currentAttempt.id);
      } else {
        if (resumeId !== undefined) {
          throw new Error("Không thể tiếp tục lượt thi đã chọn.");
        }

        try {
          currentAttemptId = await startQuizAttempt(numericQuizId);
        } catch (error: any) {
          const message = error?.message?.toLowerCase() || "";

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

      const context: ExamContext = {
        userid: numericUserId,
        quizid: numericQuizId,
        attemptid: currentAttemptId,
      };

      contextRef.current = context;

      const previous = await readOfflineExam(context);

      if (previous) {
        answerRef.current = previous.answers;

        setSelectedAnswers(previous.answers);

        setOfflineExam(previous);

        const previousTotal = getOfflineQuestionCount(previous);

        if (previousTotal > 0) {
          setTotalQuestions(previousTotal);
        }

        buildOverviewFromOfflineExam(previous);

        if (previous.submitRequested) {
          restoreOfflineExam(previous);

          await syncExam(context);

          const latest = await readOfflineExam(context);

          if (latest) {
            setOfflineExam(latest);
          }

          return;
        }
      }

      let currentDeadline: number | null;

      try {
        currentDeadline = await getAttemptDeadline(
          numericQuizId,
          currentAttemptId,
        );
      } catch (error) {
        if (!isOfflineError(error) || !previous) {
          throw error;
        }

        currentDeadline = previous.deadline;
      }

      await updateOfflineExam(context, (exam) => ({
        ...exam,
        deadline: currentDeadline,
      }));

      setDeadline(currentDeadline);
      setDeadlineLoaded(true);

      try {
        const total = await getAllQuestionsCount(currentAttemptId);

        if (total > 0) {
          setTotalQuestions(total);
        }
      } catch (error) {
        const fallback = previous ? getOfflineQuestionCount(previous) : 0;

        if (fallback > 0) {
          setTotalQuestions(fallback);

          if (previous) {
            buildOverviewFromOfflineExam(previous);
          }
        } else {
          throw error;
        }
      }

      const resumePage = Number(
        previous?.currentPage ?? currentAttempt?.currentpage ?? 0,
      );

      await loadQuestion(
        currentAttemptId,
        Number.isInteger(resumePage) && resumePage >= 0 ? resumePage : 0,
      );
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
    const pageKeys = Object.keys(exam.pages ?? {});

    const fallbackPage = pageKeys.length > 0 ? Number(pageKeys[0]) : 0;

    const pageNumber = exam.pages[exam.currentPage]
      ? exam.currentPage
      : fallbackPage;

    const page = exam.pages[pageNumber];

    if (!page) {
      throw new Error(
        "Chưa có câu hỏi lưu trên thiết bị. Hãy kết nối mạng để tải bài thi.",
      );
    }

    contextRef.current = {
      userid: exam.userid,
      quizid: exam.quizid,
      attemptid: exam.attemptid,
    };

    answerRef.current = exam.answers;

    setSelectedAnswers(exam.answers);

    setAttemptId(exam.attemptid);

    setOfflineExam(exam);

    setDeadline(exam.deadline);

    setDeadlineLoaded(true);

    const restoredFlags: Record<number, boolean> = {};

    Object.values(exam.pages ?? {}).forEach((cachedPage: any) => {
      cachedPage.questions?.forEach((question: QuizQuestion) => {
        const slot = getQuestionSlot(question);

        if (slot > 0) {
          restoredFlags[slot] = Boolean(question.flagged);
        }
      });
    });

    flaggedRef.current = restoredFlags;

    setFlaggedQuestions(restoredFlags);

    const restoredQuestions = page.questions.map((question: QuizQuestion) => ({
      ...question,
      flagged:
        restoredFlags[getQuestionSlot(question)] ?? Boolean(question.flagged),
    }));

    setQuestions(restoredQuestions);

    setCurrentPage(pageNumber);

    setNextPage(page.nextpage);

    const total = getOfflineQuestionCount(exam);

    if (total > 0) {
      setTotalQuestions(total);
    }

    buildOverviewFromOfflineExam(exam);
  };

  const loadQuestion = async (currentAttemptId: number, page: number) => {
    try {
      setLoading(true);

      let response: any;

      const cachedPage = pageCacheRef.current[page];

      if (cachedPage) {
        response = {
          questions: cachedPage.questions,
          nextpage: cachedPage.nextpage,
        };
      } else {
        try {
          response = await getAttemptData(currentAttemptId, page);
        } catch (error) {
          if (!isOfflineError(error) || !contextRef.current) {
            throw error;
          }

          const cached = await readOfflineExam(contextRef.current);

          response = cached?.pages?.[page];

          if (!response) {
            throw new Error(
              "Trang này chưa được tải. Hãy kết nối mạng để xem câu hỏi mới; đáp án hiện tại đã được giữ lại.",
            );
          }
        }
      }

      if (response?.exception) {
        throw new Error(response.message || "Không thể lấy dữ liệu bài thi.");
      }

      const pageQuestions: QuizQuestion[] = response?.questions ?? [];

      const pageNext = Number(response?.nextpage ?? -1);

      if (pageQuestions.length === 0) {
        throw new Error("Không tìm thấy câu hỏi.");
      }

      const normalizedQuestions = pageQuestions.map((question) => {
        const slot = getQuestionSlot(question);

        const storedFlag = flaggedRef.current[slot];

        if (storedFlag === undefined) {
          flaggedRef.current[slot] = Boolean(question.flagged);
        }

        return {
          ...question,
          flagged: flaggedRef.current[slot] ?? Boolean(question.flagged),
        };
      });

      pageCacheRef.current[page] = {
        questions: normalizedQuestions,
        nextpage: pageNext,
      };

      mergeQuestionOverview(page, normalizedQuestions);

      if (contextRef.current) {
        await updateOfflineExam(contextRef.current, (exam) => ({
          ...exam,
          currentPage: page,
          pages: {
            ...exam.pages,
            [page]: {
              questions: normalizedQuestions,
              nextpage: pageNext,
            },
          },
        }));
      }

      setQuestions(normalizedQuestions);

      setCurrentPage(page);

      setNextPage(pageNext);

      normalizedQuestions.forEach((question) => {
        restoreSelectedAnswer(question.html);
      });
    } finally {
      setLoading(false);
    }
  };

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

        for (const paragraph of pMatches) {
          const text = cleanHtmlText(paragraph);

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

  const extractQuestionText = (html: string): string => {
    const qtextMatch = html.match(
      /<div[^>]*class=["'][^"']*qtext[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    );

    return cleanHtmlText(qtextMatch?.[1] ?? "");
  };

  const restoreSelectedAnswer = (html: string) => {
    const checkedRegex = /<input[^>]*type=["']radio["'][^>]*checked[^>]*>/gi;

    const checkedInputs = html.match(checkedRegex) ?? [];

    if (checkedInputs.length === 0) {
      return;
    }

    const restored = {
      ...answerRef.current,
    };

    checkedInputs.forEach((input) => {
      const nameMatch = input.match(/name=["']([^"']+)["']/i);

      const valueMatch = input.match(/value=["']([^"']*)["']/i);

      if (!nameMatch || !valueMatch) {
        return;
      }

      const name = nameMatch[1];
      const value = valueMatch[1];

      if (value !== "-1" && !(name in restored)) {
        restored[name] = value;
      }
    });

    answerRef.current = restored;

    setSelectedAnswers(restored);
  };

  const handleSelectAnswer = (answer: AnswerOption) => {
    if (
      saving ||
      submitting ||
      submissionLock.current ||
      examFinished ||
      answersLocked ||
      timeExpired
    ) {
      return;
    }

    const answers = {
      ...answerRef.current,
      [answer.name]: answer.value,
    };

    answerRef.current = answers;

    setSelectedAnswers(answers);

    if (contextRef.current) {
      const context = contextRef.current;

      void queueExamAnswers(context, answers)
        .then(() => {
          setLocalSaveError(false);

          if (syncTimer.current) {
            clearTimeout(syncTimer.current);
          }

          syncTimer.current = setTimeout(() => {
            void syncExam(context).catch(() => {
              setLocalSaveError(true);
            });
          }, 1500);
        })
        .catch(() => {
          setLocalSaveError(true);
        });
    }
  };

  const saveAnswers = async () => {
    if (!contextRef.current) {
      throw new Error("Không tìm thấy Attempt ID.");
    }

    const context = contextRef.current;

    await queueExamAnswers(context, answerRef.current);

    setLocalSaveError(false);

    void syncExam(context).catch(() => {
      setLocalSaveError(true);
    });
  };

  const handleNext = async () => {
    if (!attemptId || timeExpired) {
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

  const handlePrevious = async () => {
    if (!attemptId || currentPage <= 0 || timeExpired) {
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

  const toggleQuestionFlag = async (question: QuizQuestion) => {
    const slot = getQuestionSlot(question);

    if (!slot) {
      return;
    }

    const nextFlag = !Boolean(flaggedRef.current[slot]);

    flaggedRef.current[slot] = nextFlag;

    setFlaggedQuestions((previous) => ({
      ...previous,
      [slot]: nextFlag,
    }));

    setQuestions((previous) =>
      previous.map((item) =>
        getQuestionSlot(item) === slot
          ? {
              ...item,
              flagged: nextFlag,
            }
          : item,
      ),
    );

    if (pageCacheRef.current[currentPage]) {
      pageCacheRef.current[currentPage].questions = pageCacheRef.current[
        currentPage
      ].questions.map((item) =>
        getQuestionSlot(item) === slot
          ? {
              ...item,
              flagged: nextFlag,
            }
          : item,
      );
    }

    setQuestionOverview((previous) =>
      previous.map((item) =>
        item.slot === slot
          ? {
              ...item,
              flagged: nextFlag,
            }
          : item,
      ),
    );

    if (contextRef.current) {
      const context = contextRef.current;

      await updateOfflineExam(context, (exam) => {
        const currentCachedPage = exam.pages?.[currentPage];

        if (!currentCachedPage) {
          return exam;
        }

        return {
          ...exam,
          pages: {
            ...exam.pages,
            [currentPage]: {
              ...currentCachedPage,
              questions: currentCachedPage.questions.map(
                (item: QuizQuestion) =>
                  getQuestionSlot(item) === slot
                    ? {
                        ...item,
                        flagged: nextFlag,
                      }
                    : item,
              ),
            },
          },
        };
      });
    }
  };

  const goToQuestion = async (item: QuestionOverviewItem) => {
    if (!attemptId || submitting || examFinished) {
      return;
    }

    setQuestionMenuVisible(false);

    pendingQuestionSlotRef.current = item.slot;

    if (item.page === currentPage) {
      const position = questionPositionsRef.current[item.slot];

      if (position !== undefined) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(position - 20, 0),
            animated: true,
          });

          pendingQuestionSlotRef.current = null;
        }, 100);
      }

      return;
    }

    try {
      setSaving(true);

      await saveAnswers();

      await loadQuestion(attemptId, item.page);
    } catch (error: any) {
      pendingQuestionSlotRef.current = null;

      Alert.alert("Lỗi", error?.message || "Không thể chuyển tới câu hỏi.");
    } finally {
      setSaving(false);
    }
  };

  const submitExam = async (currentAttemptId: number) => {
    if (submissionLock.current || examFinished) {
      return;
    }

    if (!currentAttemptId) {
      Alert.alert("Lỗi", "Không tìm thấy Attempt ID.");
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);

    try {
      if (!contextRef.current) {
        throw new Error("Không tìm thấy dữ liệu lượt thi.");
      }

      const context = {
        ...contextRef.current,
        attemptid: currentAttemptId,
      };

      contextRef.current = context;

      await queueExamAnswers(context, answerRef.current, true);

      setLocalSaveError(false);

      await syncExam(context, true);

      const afterSync = await readOfflineExam(context);

      if (afterSync?.submitted) {
        return;
      }

      if (afterSync?.status === "Failed") {
        throw new Error(
          afterSync.error || "Nộp bài thất bại. Vui lòng thử lại.",
        );
      }

      setLocalSaveError(true);
    } catch (error: any) {
      Alert.alert("Lỗi nộp bài", error?.message || "Không thể nộp bài.");

      submissionLock.current = false;
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!attemptId) {
      Alert.alert("Lỗi", "Không tìm thấy Attempt ID.");
      return;
    }

    if (timeExpired) {
      void submitExam(attemptId);
      return;
    }

    const confirmQuestions = questionOverview.map((item) => ({
      id: item.slot,
      number: Number(item.questionNumber) || item.slot,
      status: (item.answerName && selectedAnswers[item.answerName]
        ? "answered"
        : "unanswered") as "answered" | "unanswered",
      flagged: Boolean(flaggedQuestions[item.slot] ?? item.flagged),
      saveStatus: (offlineExam?.status === "Synced"
        ? "saved"
        : offlineExam?.status === "Failed"
          ? "not_saved"
          : "saving") as "saved" | "saving" | "not_saved",
    }));

    navigation.navigate("ConfirmSubmit", {
      quizid: Number(quizid),
      quizName,
      attemptid: attemptId,
      questions: confirmQuestions,
    });
  };

  // Khi user xác nhận nộp bài từ ConfirmSubmitScreen.
  useEffect(() => {
    const { DeviceEventEmitter } = require("react-native");
    const subscription = DeviceEventEmitter.addListener(
      "submitExamConfirmed",
      (confirmedAttemptId: number) => {
        if (submissionLock.current || examFinished) {
          return;
        }
        void submitExam(Number(confirmedAttemptId));
      },
    );

    return () => {
      subscription.remove();
    };
  }, [examFinished]);

  // Khi user chọn xem lại câu hỏi cụ thể từ ConfirmSubmitScreen.
  useEffect(() => {
    if (!targetQuestionSlot || !questionOverview.length) {
      return;
    }

    const item = questionOverview.find((q) => q.slot === targetQuestionSlot);

    if (item) {
      void goToQuestion(item);
    }
  }, [targetQuestionSlot]);

  useEffect(() => {
    if (!offlineExam?.submitted || examFinished) {
      return;
    }

    // Nhả lock và spinner trước khi navigate để tránh state cũ tồn tại.
    submissionLock.current = false;
    setSubmitting(false);

    monitoring.complete();

    setExamFinished(true);
  }, [offlineExam?.submitted, examFinished]);

  useEffect(() => {
    if (!examFinished) {
      return;
    }

    navigation.replace("Result", {
      attemptId,
      quizid: Number(quizid),
    });
  }, [examFinished, navigation, attemptId, quizid]);

  const retrySync = async () => {
    if (!contextRef.current || syncing) {
      return;
    }

    setSyncing(true);

    try {
      const context = contextRef.current;

      await queueExamAnswers(
        context,
        answerRef.current,
        !!offlineExam?.submitRequested,
      );

      await syncExam(context, true);

      // syncExam không throw — đọc lại kết quả để xác định trạng thái.
      const afterSync = await readOfflineExam(context);

      if (afterSync?.status === "Synced" || afterSync?.submitted) {
        setLocalSaveError(false);
      } else {
        setLocalSaveError(true);
      }
    } catch {
      setLocalSaveError(true);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!monitoringEnabled) {
      return;
    }

    if (monitoring.departures >= maxDepartures) {
      Alert.alert(
        "Vượt quá số lần rời màn hình",
        `Bạn đã rời màn hình thi ${monitoring.departures}/${maxDepartures} lần.`,
      );
    }
  }, [monitoring.departures, monitoringEnabled, maxDepartures]);

  useEffect(() => {
    if (
      !timeExpired ||
      !attemptId ||
      loading ||
      saving ||
      submitting ||
      examFinished ||
      autoSubmitStarted.current
    ) {
      return;
    }

    autoSubmitStarted.current = true;

    void submitExam(attemptId);
  }, [timeExpired, attemptId, loading, saving, submitting, examFinished]);

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
      {/* ── Compact top bar (thay thế AppHeader) ── */}
      <View style={[styles.examTopBar, { paddingTop: insets.top + 8 }]}>
        {/* Hàng 1: Tên đề thi */}
        <View style={styles.examTopBarTitleRow}>
          <TouchableOpacity
            style={styles.examBackButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.examTopBarTitleBox}>
            <Text style={styles.examTopBarTitle} numberOfLines={1}>
              {quizName}
            </Text>

            <Text style={styles.examTopBarSubtitle}>
              {answeredCount}/{totalQuestions} câu · Trang {currentPage + 1}
            </Text>
          </View>
        </View>

        {/* Hàng 2: Câu hỏi + Timer cùng 1 hàng */}
        <View style={styles.examTopBarRow2}>
          {/* Nút câu hỏi */}
          <TouchableOpacity
            style={styles.questionMenuButton}
            onPress={() => setQuestionMenuVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="grid-outline" size={17} color={COLORS.primary} />
            <Text style={styles.questionMenuButtonText}>Câu hỏi</Text>
          </TouchableOpacity>

          {/* Tiến độ % */}
          <View style={styles.progressBarInline}>
            <View style={styles.progressTrackInline}>
              <View
                style={[
                  styles.progressFillInline,
                  { width: `${progressPercent}%` as any },
                ]}
              />
            </View>
            <Text style={styles.progressPercentInline}>{progressPercent}%</Text>
          </View>

          {/* Timer */}
          {deadlineLoaded && !examFinished ? (
            <View
              style={[
                styles.timerInline,
                timerIsUrgent && styles.timerInlineUrgent,
                timeExpired && styles.timerInlineExpired,
              ]}
            >
              <Ionicons
                name={timeExpired ? "alert-circle-outline" : "time-outline"}
                size={15}
                color={
                  timeExpired
                    ? COLORS.error
                    : timerIsUrgent
                      ? COLORS.warning
                      : COLORS.primary
                }
              />
              <ExamTimer seconds={secondsRemaining} compact />
            </View>
          ) : null}
        </View>
      </View>

      {timeExpired && !submitting && (
        <View style={styles.expiredBox}>
          <View style={styles.expiredContent}>
            <Ionicons name="warning-outline" size={20} color={COLORS.error} />

            <Text style={styles.monitoringError}>
              Đã hết thời gian làm bài.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => attemptId && void submitExam(attemptId)}
            disabled={saving || loading}
            style={styles.retrySubmitButton}
            activeOpacity={0.8}
          >
            <Text style={styles.retrySubmitText}>Thử nộp bài lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {localSaveError && (
        <View style={styles.syncErrorBanner}>
          <View style={styles.syncErrorContent}>
            <Ionicons
              name="cloud-offline-outline"
              size={19}
              color={COLORS.error}
            />

            <Text style={styles.syncErrorText}>
              Đáp án đã lưu trên thiết bị nhưng chưa đồng bộ.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => void retrySync()}
            disabled={syncing}
            activeOpacity={0.8}
          >
            <Text style={styles.syncRetry}>
              {syncing ? "Đang đồng bộ..." : "Thử lại"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {questions.map((questionItem, questionIndex) => {
          const answers = parseQuestionHtml(questionItem.html);

          const slot = getQuestionSlot(questionItem);

          const isFlagged = Boolean(
            flaggedQuestions[slot] ?? questionItem.flagged,
          );

          return (
            <View
              key={`${questionItem.slot}-${questionItem.questionnumber}`}
              style={styles.questionContainer}
              onLayout={(event) => {
                questionPositionsRef.current[slot] = event.nativeEvent.layout.y;
              }}
            >
              <View style={styles.questionBox}>
                <View style={styles.questionHeader}>
                  <View style={styles.questionHeaderLeft}>
                    <View style={styles.questionNumber}>
                      <Text style={styles.questionNumberText}>
                        {questionItem.questionnumber || questionIndex + 1}
                      </Text>
                    </View>

                    <Text style={styles.questionLabel}>Câu hỏi</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.flagButton,
                      isFlagged && styles.flagButtonActive,
                    ]}
                    onPress={() => void toggleQuestionFlag(questionItem)}
                    disabled={submitting || examFinished || answersLocked}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isFlagged ? "flag" : "flag-outline"}
                      size={19}
                      color={isFlagged ? COLORS.warning : COLORS.textLight}
                    />

                    <Text
                      style={[
                        styles.flagText,
                        isFlagged && styles.flagTextActive,
                      ]}
                    >
                      {isFlagged ? "Đã đánh dấu" : "Đánh dấu"}
                    </Text>
                  </TouchableOpacity>
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
                      disabled={
                        saving ||
                        submitting ||
                        examFinished ||
                        timeExpired ||
                        answersLocked
                      }
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

        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.previousButton,
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            disabled={
              currentPage === 0 ||
              saving ||
              submitting ||
              examFinished ||
              timeExpired ||
              answersLocked
            }
            onPress={handlePrevious}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />

            <Text style={styles.previousButtonText}>Trang trước</Text>
          </TouchableOpacity>

          {!isLastPage ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.nextButton,
                saving && styles.navButtonDisabled,
              ]}
              disabled={
                saving ||
                submitting ||
                examFinished ||
                timeExpired ||
                answersLocked
              }
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

          <Text style={styles.monitoringTitle}>
            Nội dung bài thi đã được che
          </Text>

          <Text style={styles.monitoringText}>
            Quay lại ứng dụng để tiếp tục làm bài.
          </Text>
        </View>
      )}

      <Modal
        visible={questionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuestionMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.questionMenuModal}>
            <View style={styles.menuHeader}>
              <View>
                <Text style={styles.menuTitle}>Tổng quan câu hỏi</Text>

                <Text style={styles.menuSubtitle}>
                  {answeredCount}/{totalQuestions} câu đã trả lời
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setQuestionMenuVisible(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendAnswered]} />

                <Text style={styles.legendText}>Đã trả lời</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendUnanswered]} />

                <Text style={styles.legendText}>Chưa trả lời</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendFlagged]} />

                <Text style={styles.legendText}>Đã đánh dấu</Text>
              </View>
            </View>

            <ScrollView
              style={styles.questionGridScroll}
              contentContainerStyle={styles.questionGrid}
              showsVerticalScrollIndicator={false}
            >
              {questionOverview.map((item) => {
                const answered =
                  !!item.answerName && !!selectedAnswers[item.answerName];

                const flagged = Boolean(
                  flaggedQuestions[item.slot] ?? item.flagged,
                );

                return (
                  <TouchableOpacity
                    key={item.slot}
                    style={[
                      styles.questionGridItem,
                      answered && !flagged && styles.questionGridAnswered,
                      !answered && !flagged && styles.questionGridUnanswered,
                      flagged && styles.questionGridFlagged,
                    ]}
                    onPress={() => void goToQuestion(item)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.questionGridNumber,
                        answered &&
                          !flagged &&
                          styles.questionGridNumberAnswered,
                        flagged && styles.questionGridNumberFlagged,
                      ]}
                    >
                      {item.questionNumber || item.slot}
                    </Text>

                    {flagged && (
                      <Ionicons
                        name="flag"
                        size={11}
                        color={COLORS.warning}
                        style={styles.gridFlagIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.menuFooter}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={COLORS.textSecondary}
              />

              <Text style={styles.menuFooterText}>
                Chạm vào số câu để xem nhanh câu hỏi cần kiểm tra.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Submitting Overlay ── */}
      <Modal
        visible={submitting}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <SubmittingOverlay />
      </Modal>
    </View>
  );
}

// ─────────────────────────── Submitting Overlay ─────────────────────────────

function SubmittingOverlay() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={overlayStyles.backdrop}>
      <LinearGradient
        colors={["rgba(0,110,39,0.96)", "rgba(0,61,24,0.98)"]}
        style={overlayStyles.container}
      >
        {/* Pulsing icon ring */}
        <Animated.View
          style={[
            overlayStyles.iconRing,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={overlayStyles.iconInner}>
            <ActivityIndicator size={36} color="#fff" />
          </View>
        </Animated.View>

        <Text style={overlayStyles.title}>Đang nộp bài...</Text>

        <Text style={overlayStyles.subtitle}>
          Vui lòng không thoát ứng dụng trong lúc này.
        </Text>

        {/* Dots */}
        <View style={overlayStyles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <DotsIndicator key={i} delay={i * 220} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

function DotsIndicator({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return <Animated.View style={[overlayStyles.dot, { opacity: anim }]} />;
}

const overlayStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: 280,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  iconRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});

// ─────────────────────────────────────────────────────────────────────────────

const getAnswerLabel = (index: number, label: string) => {
  const letters = ["A", "B", "C", "D", "E", "F"];

  const prefix = letters[index] ?? String(index + 1);

  return `${prefix}. ${label}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  examTopBar: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  examTopBarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  examBackButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  examTopBarTitleBox: {
    flex: 1,
  },

  examTopBarTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },

  examTopBarSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  examTopBarRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  progressBarInline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  progressTrackInline: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFillInline: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },

  progressPercentInline: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    minWidth: 32,
    textAlign: "right",
  },

  timerInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundSoft,
  },

  timerInlineUrgent: {
    backgroundColor: "#FFF0C7",
  },

  timerInlineExpired: {
    backgroundColor: "#FBE1E1",
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

  timerCard: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  timerCardUrgent: {
    borderColor: "#E9C56A",
    backgroundColor: "#FFF9E8",
  },

  timerCardExpired: {
    borderColor: "#E8BABA",
    backgroundColor: "#FFF4F4",
  },

  timerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },

  timerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  timerIconUrgent: {
    backgroundColor: "#FFF0C7",
  },

  timerIconExpired: {
    backgroundColor: "#FBE1E1",
  },

  timerTextBox: {
    flex: 1,
  },

  timerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  timerDescription: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },

  timerDescriptionExpired: {
    color: COLORS.error,
  },

  expiredBox: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "#FFF0F0",
    borderWidth: 1,
    borderColor: "#F1CCCC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  expiredContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  retrySubmitButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  retrySubmitText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.error,
  },

  syncErrorBanner: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#FFF4F4",
    borderWidth: 1,
    borderColor: "#F0D0D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  syncErrorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  syncErrorText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.error,
  },

  syncRetry: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 8,
  },

  progressCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  progressCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  questionMenuButton: {
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: COLORS.backgroundSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 8,
  },

  questionMenuButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },

  progressPercentBox: {
    minWidth: 52,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  progressPercent: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },

  progressTrack: {
    height: 8,
    marginTop: 14,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 999,
  },

  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  progressFooterText: {
    fontSize: 12,
    color: COLORS.textLight,
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
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  questionHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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

  flagButton: {
    minHeight: 34,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  flagButtonActive: {
    backgroundColor: "#FFF4D6",
  },

  flagText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textLight,
  },

  flagTextActive: {
    color: COLORS.warning,
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

  privacyOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 10,
  },

  monitoringTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  monitoringText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },

  monitoringError: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.error,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  questionMenuModal: {
    maxHeight: "78%",
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
  },

  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },

  menuSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 13,
    height: 13,
    borderRadius: 5,
    marginRight: 5,
    borderWidth: 1,
  },

  legendAnswered: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  legendUnanswered: {
    backgroundColor: COLORS.white,
    borderColor: "#B8C1BD",
  },

  legendFlagged: {
    backgroundColor: "#FFF0C7",
    borderColor: COLORS.warning,
  },

  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  questionGridScroll: {
    maxHeight: 390,
  },

  questionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    paddingBottom: 10,
  },

  questionGridItem: {
    width: 43,
    height: 43,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },

  questionGridAnswered: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  questionGridUnanswered: {
    backgroundColor: COLORS.white,
    borderColor: "#B8C1BD",
  },

  questionGridFlagged: {
    backgroundColor: "#FFF0C7",
    borderColor: COLORS.warning,
  },

  questionGridNumber: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },

  questionGridNumberAnswered: {
    color: COLORS.white,
  },

  questionGridNumberFlagged: {
    color: "#8A6414",
  },

  gridFlagIcon: {
    position: "absolute",
    right: 4,
    top: 4,
  },

  menuFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  menuFooterText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
  },
});
