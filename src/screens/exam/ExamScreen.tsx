import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useIsFocused,
  useNavigation,
  usePreventRemove,
  useRoute,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  DeviceEventEmitter,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NestableScrollContainer } from "react-native-draggable-flatlist";
import { SafeAreaView } from "react-native-safe-area-context";

import Loading from "@/components/common/Loading";
import ExamLoading from "@/components/exam/ExamLoading";
import ExamNavigation from "@/components/exam/ExamNavigation";
import ExamQuestionItem from "@/components/exam/ExamQuestionItem";
import ExamQuestionMenu from "@/components/exam/ExamQuestionMenu";
import ExamTopBar from "@/components/exam/ExamTopBar";
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

import { parseQuestion } from "@/parsers/questionParser";
import { getQuestionAnswerNames, isQuestionAnswered } from "@/utils/questionAnswerStatus";
import type { ParsedQuestion } from "@/types/question";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

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
  answerNames: string[];
  flagged: boolean;
};

type ExamAnswers = Record<string, string>;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* EXAM SCREEN                                                                */
/* -------------------------------------------------------------------------- */

export default function ExamScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    courseid,
    quizid,
    quizName,
    attemptid: requestedAttemptId,
    targetQuestionSlot,
  } = route.params;

  /* STATE                                                                  */

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<ExamAnswers>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPage, setNextPage] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [questionOverview, setQuestionOverview] = useState<
    QuestionOverviewItem[]
  >([]);

  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Record<number, boolean>
  >({});

  const [questionMenuVisible, setQuestionMenuVisible] = useState(false);

  const [monitoringEnabled, setMonitoringEnabled] = useState(false);

  const [monitoringConfigLoaded, setMonitoringConfigLoaded] = useState(false);

  const [maxDepartures, setMaxDepartures] = useState(3);

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

  const [token, setToken] = useState<string>("");

  /* REFS                                                                   */

  const contextRef = useRef<ExamContext | null>(null);

  const answerRef = useRef<ExamAnswers>({});

  const pageCacheRef = useRef<Record<number, CachedPage>>({});

  const playedAudioRef = useRef<Set<string>>(new Set());

  const flaggedRef = useRef<Record<number, boolean>>({});

  const submissionLock = useRef(false);

  const autoSubmitStarted = useRef(false);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);

  const questionPositionsRef = useRef<Record<number, number>>({});

  const pendingQuestionSlotRef = useRef<number | null>(null);

  /* HOOKS                                                                  */

  const secondsRemaining = useExamCountdown(deadline, !examFinished);

  const timeExpired =
    deadlineLoaded && deadline !== null && secondsRemaining === 0;

  const answersLocked = !!offlineExam?.submitRequested;

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

  /* CALCULATIONS                                                           */

  const answeredCount = questionOverview.filter((item) =>
    isQuestionAnswered(item.answerNames, selectedAnswers),
  ).length;

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

  /* PREVENT LEAVING EXAM                                                   */

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

  /* QUESTION OVERVIEW                                                      */

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
          answerNames: getQuestionAnswerNames(parseQuestion(question.html)),
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
            answerNames: getQuestionAnswerNames(parseQuestion(question.html)),
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

  /* GET TOTAL QUESTION COUNT                                               */

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
            answerNames: getQuestionAnswerNames(parseQuestion(question.html)),
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
          answerNames: getQuestionAnswerNames(parseQuestion(question.html)),
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

  /* RESTORE OFFLINE EXAM                                                   */

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

  /* LOAD QUESTION PAGE                                                     */

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
    } finally {
      setLoading(false);
    }
  };

  /* INITIALIZE EXAM                                                        */

  async function initializeExamImpl() {
    try {
      setLoading(true);

      pageCacheRef.current = {};
      flaggedRef.current = {};
      playedAudioRef.current = new Set();

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
      } catch {
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
          courseid: Number(courseid),
          quizid: numericQuizId,
          quizName,
          attemptid: Number(currentAttempt.id),
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
  }

  /* INITIALIZATION EFFECT                                                  */

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const initTimer = setTimeout(() => {
      void initializeExamImpl();
    }, 0);

    return () => {
      clearTimeout(initTimer);
      unsubscribe();

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    };
  }, []);

  /* SCROLL TO TARGET QUESTION                                              */

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

  /* ANSWER HANDLING                                                        */

  const handleAnswerChange = (answer: unknown) => {
    if (typeof answer !== "object" || answer === null) {
      return;
    }

    const answers = { ...answerRef.current, ...(answer as Record<string, string>) };

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

  /* PAGE NAVIGATION                                                        */

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

  /* FLAG QUESTION                                                          */

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

  /* GO TO QUESTION                                                         */

  const clearTargetQuestionSlot = () => {
    if (!route?.params) {
      return;
    }

    navigation.setParams({
      ...route.params,
      targetQuestionSlot: undefined,
    });
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

      clearTargetQuestionSlot();
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

    clearTargetQuestionSlot();
  };

  /* SUBMIT EXAM                                                            */

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

  /* CONFIRM SUBMIT                                                         */

  const handleSubmit = async () => {
    if (saving || submitting || examFinished) {
      return;
    }

    if (!attemptId) {
      Alert.alert("Lỗi", "Không tìm thấy Attempt ID.");

      return;
    }

    if (timeExpired) {
      void submitExam(attemptId);
      return;
    }

    try {
      setSaving(true);

      await saveAnswers();
    } catch (error) {
      Alert.alert(
        "Lỗi lưu bài",
        error instanceof Error ? error.message : "Không thể lưu bài làm.",
      );

      return;
    } finally {
      setSaving(false);
    }

    const confirmQuestions = questionOverview.map((item) => ({
      id: item.slot,
      number: Number(item.questionNumber) || item.slot,
      status:
        isQuestionAnswered(item.answerNames, answerRef.current)
          ? "answered"
          : "unanswered",
      flagged: Boolean(flaggedQuestions[item.slot] ?? item.flagged),
      saveStatus:
        offlineExam?.status === "Synced"
          ? "saved"
          : offlineExam?.status === "Failed"
            ? "not_saved"
            : "saving",
    }));

    navigation.navigate("ConfirmSubmit", {
      courseid,
      quizid: Number(quizid),
      quizName,
      attemptid: attemptId,
      questions: confirmQuestions,
    });
  };

  /* CONFIRM SUBMIT EVENT                                                   */

  useEffect(() => {
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

  /* TARGET QUESTION FROM CONFIRM                                           */

  useEffect(() => {
    if (
      !isFocused ||
      targetQuestionSlot === undefined ||
      targetQuestionSlot === null ||
      !questionOverview.length ||
      loading ||
      saving ||
      submitting ||
      examFinished
    ) {
      return;
    }

    const item = questionOverview.find(
      (question) => question.slot === targetQuestionSlot,
    );

    if (!item) {
      clearTargetQuestionSlot();
      return;
    }

    const timeoutId = setTimeout(() => {
      void goToQuestion(item);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [
    targetQuestionSlot,
    isFocused,
    questionOverview,
    loading,
    saving,
    submitting,
    examFinished,
    navigation,
  ]);

  /* SUBMIT SUCCESS                                                         */

  useEffect(() => {
    if (!offlineExam?.submitted || examFinished) {
      return;
    }

    const timeoutId = setTimeout(() => {
      submissionLock.current = false;

      setSubmitting(false);

      monitoring.complete();

      setExamFinished(true);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [offlineExam?.submitted, examFinished, monitoring]);

  useEffect(() => {
    if (!examFinished || !attemptId) {
      return;
    }

    navigation.replace("Result", {
      courseid: Number(courseid),
      quizid: Number(quizid),
      quizName,
      attemptid: Number(attemptId),
    });
  }, [examFinished, navigation, attemptId, courseid, quizid, quizName]);

  /* RETRY SYNC                                                             */

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
      const loadToken = async () => {
        const savedToken = await AsyncStorage.getItem("wstoken");

        if (savedToken) {
          setToken(savedToken);
        }
      };

      loadToken();
  }, []);

  /* MONITORING WARNING                                                     */

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

  /* AUTO SUBMIT                                                            */

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

  /* LOADING                                                                */

  if (loading && questions.length === 0) {
    return <ExamLoading quizName={quizName} />;
  }

  /* EMPTY                                                                  */

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



  /* MAIN UI                                                                */

  return (
    <View style={styles.container}>
      <ExamTopBar
        quizName={quizName}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        currentPage={currentPage}
        progressPercent={progressPercent}
        deadlineLoaded={deadlineLoaded}
        examFinished={examFinished}
        timerIsUrgent={timerIsUrgent}
        timeExpired={timeExpired}
        secondsRemaining={secondsRemaining}
        onMenuPress={() => setQuestionMenuVisible(true)}
      />

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

      <NestableScrollContainer
        ref={scrollRef as any}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {questions.map((questionItem, questionIndex) => {
          const slot = getQuestionSlot(questionItem);

          const isFlagged = Boolean(
            flaggedQuestions[slot] ?? questionItem.flagged,
          );

          const parsedQuestion: ParsedQuestion = parseQuestion(
            questionItem.html,
          );

          return (
            <ExamQuestionItem
              key={`${questionItem.slot}-${questionItem.questionnumber}`}
              questionNumberText={
                questionItem.questionnumber || String(questionIndex + 1)
              }
              questionText={parsedQuestion.text}
              question={parsedQuestion}
              token={token}
              playedAudioRef={playedAudioRef}
              isFlagged={isFlagged}
              selectedAnswers={selectedAnswers}
              disabled={submitting || examFinished || answersLocked}
              flagDisabled={submitting || examFinished || answersLocked}
              answerDisabled={
                saving ||
                submitting ||
                examFinished ||
                timeExpired ||
                answersLocked
              }
              onFlagToggle={() => void toggleQuestionFlag(questionItem)}
              onAnswerChange={handleAnswerChange}
              onLayout={(event) => {
                questionPositionsRef.current[slot] = event.nativeEvent.layout.y;
              }}
            />
          );
        })}

        {loading && (
          <View style={styles.loadingMore}>
            <Loading
              message="Đang tải câu hỏi..."
              size="small"
              fullScreen={false}
            />
          </View>
        )}
      </NestableScrollContainer>

      <SafeAreaView edges={["bottom"]} style={styles.navigationFooter}>
        <ExamNavigation
          currentPage={currentPage}
          isLastPage={isLastPage}
          saving={saving}
          submitting={submitting}
          examFinished={examFinished}
          timeExpired={timeExpired}
          answersLocked={answersLocked}
          onPrevious={() => void handlePrevious()}
          onNext={() => void handleNext()}
          onSubmit={() => void handleSubmit()}
        />
      </SafeAreaView>

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

      <ExamQuestionMenu
        visible={questionMenuVisible}
        onClose={() => setQuestionMenuVisible(false)}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        questionOverview={questionOverview}
        selectedAnswers={selectedAnswers}
        flaggedQuestions={flaggedQuestions}
        onGoToQuestion={(item) => void goToQuestion(item)}
      />

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

/* -------------------------------------------------------------------------- */
/* SUBMITTING OVERLAY                                                         */
/* -------------------------------------------------------------------------- */

function SubmittingOverlay() {
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.loop(
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
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulseAnim]);

  return (
    <View style={overlayStyles.backdrop}>
      <LinearGradient
        colors={["rgba(0,110,39,0.96)", "rgba(0,61,24,0.98)"]}
        style={overlayStyles.container}
      >
        <Animated.View
          style={[
            overlayStyles.iconRing,
            {
              transform: [
                {
                  scale: pulseAnim,
                },
              ],
            },
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

        <View style={overlayStyles.dotsRow}>
          {[0, 1, 2].map((index) => (
            <DotsIndicator key={index} delay={index * 220} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* DOT INDICATOR                                                              */
/* -------------------------------------------------------------------------- */

function DotsIndicator({ delay }: { delay: number }) {
  const anim = useMemo(() => new Animated.Value(0.3), []);

  useEffect(() => {
    const animation = Animated.loop(
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
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        overlayStyles.dot,
        {
          opacity: anim,
        },
      ]}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },

  navigationFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  loadingMore: {
    marginTop: 12,
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
});

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
    shadowOffset: {
      width: 0,
      height: 12,
    },
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
