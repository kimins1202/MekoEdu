import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getAttemptReview } from "../../api/quizApi";
import AppCard from "../../components/common/AppCard";
import AppHeader from "../../components/common/AppHeader";
import COLORS from "../../constants/colors";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewRoute = {
  key: string;
  name: "AnswerReview";
  params: { attemptid: number; quizid: number; quizName: string };
};

type ReviewQuestion = {
  slot: number;
  type: string;
  page: number;
  html: string;
  flagged: boolean;
  questionnumber?: string;
  state?: string;
  mark?: string;
  maxmark?: number;
};

// Đáp án chỉ có 3 trạng thái:
// - correct: đáp án đúng
// - incorrect: người dùng chọn nhưng chọn sai
// - neutral: đáp án không được chọn và không phải đáp án đúng
type AnswerState = "correct" | "incorrect" | "neutral";

type ParsedAnswer = {
  label: string;
  text: string;
  state: AnswerState;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Chuẩn hóa text để so sánh:
 * "Application Programming Interface"
 * và
 * " Application Programming Interface "
 * được xem là giống nhau.
 */
function normalizeText(text: string): string {
  return stripHtml(text).replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Lấy nội dung đáp án đúng từ:
 *
 * <div class="rightanswer">
 *   The correct answer is: Application Programming Interface
 * </div>
 *
 * Moodle có thể dùng:
 * - The correct answer is:
 * - The correct answers are:
 */
function parseCorrectAnswer(html: string): string {
  const rightAnswerMatch = html.match(
    /<div[^>]*class="[^"]*\brightanswer\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );

  if (!rightAnswerMatch) {
    return "";
  }

  const rightAnswerText = stripHtml(rightAnswerMatch[1]);

  const answerMatch = rightAnswerText.match(
    /The correct answers?\s+(?:is|are)\s*:\s*([\s\S]*)/i,
  );

  if (answerMatch) {
    return answerMatch[1].trim();
  }

  return rightAnswerText.trim();
}

/**
 * Parse từng answer row của Moodle.
 *
 * Response thực tế:
 *
 * <div class="r0">
 *   <input ... value="0" ... />
 *   <div ... id="..._label">
 *      <span class="answernumber">a. </span>
 *      <div>Application Programming Interface</div>
 *   </div>
 * </div>
 *
 * hoặc:
 *
 * <div class="r1 incorrect">
 *   <input ... value="1" ... checked="checked" />
 *   ...
 * </div>
 *
 * Ta không dựa vào class "correct" để tìm đáp án đúng,
 * vì Moodle response thực tế không thêm class "correct".
 *
 * Đáp án đúng được lấy từ .rightanswer.
 */
function parseAnswerRows(
  html: string,
  correctAnswerText: string,
): ParsedAnswer[] {
  const answers: ParsedAnswer[] = [];
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

  // Tìm vị trí bắt đầu của tất cả row r0/r1.
  const rowStarts: { index: number; className: string }[] = [];

  const rowStartRegex = /<div[^>]*class="([^"]*\b(?:r0|r1)\b[^"]*)"[^>]*>/gi;

  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowStartRegex.exec(html)) !== null) {
    rowStarts.push({
      index: rowMatch.index,
      className: rowMatch[1],
    });
  }

  const normalizedCorrectAnswer = normalizeText(correctAnswerText);

  rowStarts.forEach((row, index) => {
    const startIndex = row.index;

    // Row hiện tại kết thúc ngay trước row tiếp theo.
    const endIndex =
      index + 1 < rowStarts.length ? rowStarts[index + 1].index : html.length;

    const rowHtml = html.substring(startIndex, endIndex);

    // Tìm input của answer.
    const inputMatch = rowHtml.match(
      /<input[^>]*type=["'](?:radio|checkbox)["'][^>]*>/i,
    );

    if (!inputMatch) {
      return;
    }

    const inputHtml = inputMatch[0];

    // Moodle dùng checked="checked" cho đáp án user đã chọn.
    const isChecked =
      /\bchecked\s*=\s*(?:"checked"|'checked'|checked)/i.test(inputHtml) ||
      /\bchecked\b/i.test(inputHtml);

    // Tìm label tương ứng.
    const labelMatch = rowHtml.match(
      /<div[^>]*data-region=["']answer-label["'][^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>)?/i,
    );

    let answerText = "";

    if (labelMatch) {
      answerText = stripHtml(labelMatch[1]);
    } else {
      // Fallback nếu Moodle thay đổi cấu trúc label.
      answerText = stripHtml(rowHtml);
    }

    // Xóa ký hiệu a. / b. / c. / d. nếu có.
    answerText = answerText
      .replace(/^\s*[a-z]\.\s*/i, "")
      .replace(/^\s*\d+[\.\)]\s*/, "")
      .trim();

    if (!answerText) {
      return;
    }

    const normalizedAnswer = normalizeText(answerText);

    /**
     * Xác định đây có phải đáp án đúng không.
     *
     * Moodle response:
     *
     * <div class="rightanswer">
     *   The correct answer is: Application Programming Interface
     * </div>
     *
     * Vì vậy không tìm class="correct" ở answer row.
     */
    let isCorrect = false;

    if (normalizedCorrectAnswer && normalizedAnswer) {
      isCorrect =
        normalizedAnswer === normalizedCorrectAnswer ||
        normalizedCorrectAnswer.includes(normalizedAnswer);
    }

    /**
     * Logic trạng thái:
     *
     * 1. Đúng → correct
     * 2. User chọn nhưng sai → incorrect
     * 3. Còn lại → neutral
     *
     * Nếu user chọn đúng:
     *    isCorrect = true
     *    isChecked = true
     *    => correct
     *
     * Nếu user chọn sai:
     *    isCorrect = false
     *    isChecked = true
     *    => incorrect
     *
     * Nếu user không chọn nhưng đây là đáp án đúng:
     *    isCorrect = true
     *    isChecked = false
     *    => correct
     */
    let state: AnswerState = "neutral";

    if (isCorrect) {
      state = "correct";
    } else if (isChecked) {
      state = "incorrect";
    }

    answers.push({
      label: letters[answers.length] ?? String(answers.length + 1),
      text: answerText,
      state,
    });
  });

  return answers;
}

function parseQuestionHtml(html: string): {
  questionText: string;
  answers: ParsedAnswer[];
  feedback: string;
} {
  const qtextMatch = html.match(
    /<div[^>]*class="[^"]*\bqtext\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );

  const questionText = qtextMatch
    ? stripHtml(qtextMatch[1])
    : stripHtml(html.substring(0, 400));

  // Đáp án đúng lấy từ .rightanswer.
  const correctAnswerText = parseCorrectAnswer(html);

  // Các answer row lấy checked + text rồi đối chiếu với .rightanswer.
  const answers = parseAnswerRows(html, correctAnswerText);

  const feedbackMatch = html.match(
    /<div[^>]*class="[^"]*\bgeneralfeedback\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );

  const feedback = feedbackMatch ? stripHtml(feedbackMatch[1]) : "";

  return {
    questionText,
    answers,
    feedback,
  };
}

function getStateInfo(state?: string, mark?: string, maxmark?: number) {
  const m = parseFloat(mark ?? "");
  const max = maxmark ?? 0;

  if (max > 0 && Number.isFinite(m)) {
    if (m >= max)
      return {
        label: "Đúng",
        color: COLORS.success,
        bg: "#EAF7EF",
        icon: "checkmark-circle" as const,
      };

    if (m > 0)
      return {
        label: "Đúng một phần",
        color: COLORS.warning,
        bg: "#FFF6E4",
        icon: "alert-circle" as const,
      };

    return {
      label: "Sai",
      color: COLORS.error,
      bg: "#FFF1F1",
      icon: "close-circle" as const,
    };
  }

  switch (state) {
    case "gradedright":
      return {
        label: "Đúng",
        color: COLORS.success,
        bg: "#EAF7EF",
        icon: "checkmark-circle" as const,
      };

    case "gradedpartial":
      return {
        label: "Đúng một phần",
        color: COLORS.warning,
        bg: "#FFF6E4",
        icon: "alert-circle" as const,
      };

    case "gradedwrong":
      return {
        label: "Sai",
        color: COLORS.error,
        bg: "#FFF1F1",
        icon: "close-circle" as const,
      };

    default:
      return {
        label: "Chưa chấm",
        color: COLORS.textLight,
        bg: COLORS.backgroundSoft,
        icon: "help-circle" as const,
      };
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnswerReviewScreen() {
  useNavigation();

  const route = useRoute<ReviewRoute>();
  const { attemptid, quizName } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [totalMark, setTotalMark] = useState<number | null>(null);
  const [maxMark, setMaxMark] = useState<number | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getAttemptReview(attemptid);

      if (!res || !Array.isArray(res.questions)) {
        throw new Error("Không lấy được dữ liệu bài làm.");
      }

      setQuestions(res.questions);

      let total = 0;
      let max = 0;

      res.questions.forEach((q: ReviewQuestion) => {
        const m = parseFloat(q.mark ?? "");
        const mx = q.maxmark ?? 0;

        if (Number.isFinite(m)) {
          total += m;
        }

        if (Number.isFinite(mx) && mx > 0) {
          max += mx;
        }
      });

      setTotalMark(max > 0 ? total : null);
      setMaxMark(max > 0 ? max : null);
    } catch (e: any) {
      setError(e?.message ?? "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      void load();
    }, 0);

    return () => clearTimeout(timeout);
  }, [attemptid]);

  const toggleExpand = (slot: number) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);

      if (next.has(slot)) {
        next.delete(slot);
      } else {
        next.add(slot);
      }

      return next;
    });
  };

  const expandAll = () =>
    setExpandedSlots(new Set(questions.map((q) => q.slot)));

  const collapseAll = () => setExpandedSlots(new Set());

  const correctCount = questions.filter((q) => {
    const m = parseFloat(q.mark ?? "");
    const mx = q.maxmark ?? 0;

    return mx > 0 && Number.isFinite(m) && m >= mx;
  }).length;

  const wrongCount = questions.filter((q) => {
    const m = parseFloat(q.mark ?? "");
    const mx = q.maxmark ?? 0;

    return mx > 0 && Number.isFinite(m) && m < mx;
  }).length;

  const uncheckCount = questions.filter((q) => !(q.mark && q.maxmark)).length;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải bài làm...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Xem lại bài làm" showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Summary ── */}
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <View style={styles.summaryIconWrap}>
              <Ionicons
                name="document-text-outline"
                size={26}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle} numberOfLines={2}>
                {quizName}
              </Text>

              <Text style={styles.summarySubtitle}>
                {correctCount}/{questions.length} câu đúng
              </Text>
            </View>
          </View>

          {totalMark !== null && maxMark !== null && (
            <View style={styles.scorePill}>
              <Text style={styles.scorePillValue}>
                {totalMark % 1 === 0 ? totalMark : totalMark.toFixed(2)}
              </Text>

              <Text style={styles.scorePillMax}>/{maxMark}</Text>
            </View>
          )}
        </AppCard>

        {/* ── Stat chips ── */}
        <View style={styles.statRow}>
          <View style={[styles.statChip, { backgroundColor: "#EAF7EF" }]}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={COLORS.success}
            />

            <Text style={[styles.statChipText, { color: COLORS.success }]}>
              {correctCount} Đúng
            </Text>
          </View>

          <View style={[styles.statChip, { backgroundColor: "#FFF1F1" }]}>
            <Ionicons name="close-circle" size={15} color={COLORS.error} />

            <Text style={[styles.statChipText, { color: COLORS.error }]}>
              {wrongCount} Sai
            </Text>
          </View>

          <View
            style={[
              styles.statChip,
              { backgroundColor: COLORS.backgroundSoft },
            ]}
          >
            <Ionicons name="help-circle" size={15} color={COLORS.textLight} />

            <Text style={[styles.statChipText, { color: COLORS.textLight }]}>
              {uncheckCount} Chưa chấm
            </Text>
          </View>
        </View>

        {/* ── Error ── */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle-outline"
              size={18}
              color={COLORS.error}
            />

            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── Controls ── */}
        {questions.length > 0 && (
          <View style={styles.controls}>
            <Text style={styles.sectionTitle}>{questions.length} câu hỏi</Text>

            <View style={styles.controlButtons}>
              <TouchableOpacity
                onPress={expandAll}
                style={styles.controlBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-down-circle-outline"
                  size={15}
                  color={COLORS.primary}
                />

                <Text style={styles.controlBtnText}>Mở hết</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={collapseAll}
                style={styles.controlBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-up-circle-outline"
                  size={15}
                  color={COLORS.textSecondary}
                />

                <Text
                  style={[
                    styles.controlBtnText,
                    { color: COLORS.textSecondary },
                  ]}
                >
                  Thu hết
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Question list ── */}
        {questions.map((q, idx) => {
          const stateInfo = getStateInfo(q.state, q.mark, q.maxmark);
          const isExpanded = expandedSlots.has(q.slot);

          const { questionText, answers, feedback } = parseQuestionHtml(
            q.html ?? "",
          );

          const m = parseFloat(q.mark ?? "");
          const mx = q.maxmark ?? 0;

          return (
            <AppCard key={q.slot} style={styles.questionCard}>
              {/* Collapse header */}
              <TouchableOpacity
                style={styles.questionHeader}
                onPress={() => toggleExpand(q.slot)}
                activeOpacity={0.75}
              >
                <View
                  style={[styles.qNumBadge, { backgroundColor: stateInfo.bg }]}
                >
                  <Text style={[styles.qNumText, { color: stateInfo.color }]}>
                    {q.questionnumber ?? idx + 1}
                  </Text>
                </View>

                <View style={styles.questionHeaderCenter}>
                  <Text style={styles.questionNumberLabel}>
                    Câu {q.questionnumber ?? idx + 1}
                  </Text>

                  {mx > 0 && (
                    <Text style={styles.markText}>
                      {Number.isFinite(m)
                        ? `${m % 1 === 0 ? m : m.toFixed(2)}/${mx}`
                        : `0/${mx}`}{" "}
                      điểm
                    </Text>
                  )}
                </View>

                <View
                  style={[styles.stateBadge, { backgroundColor: stateInfo.bg }]}
                >
                  <Ionicons
                    name={stateInfo.icon}
                    size={13}
                    color={stateInfo.color}
                  />

                  <Text style={[styles.stateText, { color: stateInfo.color }]}>
                    {stateInfo.label}
                  </Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.textLight}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>

              {/* Expanded body */}
              {isExpanded && (
                <View style={styles.questionBody}>
                  <View style={styles.divider} />

                  {!!questionText && (
                    <Text style={styles.questionText}>{questionText}</Text>
                  )}

                  {answers.length > 0 && (
                    <View style={styles.answersSection}>
                      <Text style={styles.answersLabel}>Đáp án</Text>

                      {answers.map((ans) => (
                        <View
                          key={ans.label}
                          style={[
                            styles.answerRow,

                            ans.state === "correct" && styles.answerCorrect,

                            ans.state === "incorrect" && styles.answerIncorrect,
                          ]}
                        >
                          <View
                            style={[
                              styles.answerLabelBadge,

                              ans.state === "correct" && {
                                backgroundColor: COLORS.success,
                              },

                              ans.state === "incorrect" && {
                                backgroundColor: COLORS.error,
                              },
                            ]}
                          >
                            <Text style={styles.answerLabelText}>
                              {ans.label}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.answerText,

                              ans.state === "correct" && {
                                color: COLORS.success,
                                fontWeight: "600",
                              },

                              ans.state === "incorrect" && {
                                color: COLORS.error,
                              },
                            ]}
                          >
                            {ans.text}
                          </Text>

                          {ans.state === "correct" && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color={COLORS.success}
                            />
                          )}

                          {ans.state === "incorrect" && (
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color={COLORS.error}
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Fallback: show raw stripped html */}
                  {answers.length === 0 && !!q.html && (
                    <View style={styles.rawContent}>
                      <Text style={styles.questionText}>
                        {stripHtml(q.html).substring(0, 800)}
                      </Text>
                    </View>
                  )}

                  {!!feedback && (
                    <View style={styles.feedbackBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={15}
                        color={COLORS.info}
                      />

                      <Text style={styles.feedbackText}>{feedback}</Text>
                    </View>
                  )}
                </View>
              )}
            </AppCard>
          );
        })}

        {/* Empty state */}
        {questions.length === 0 && !error && (
          <AppCard style={styles.emptyCard}>
            <Ionicons
              name="document-text-outline"
              size={36}
              color={COLORS.textLight}
            />

            <Text style={styles.emptyTitle}>Không có câu hỏi</Text>

            <Text style={styles.emptyText}>
              Bài thi này chưa có dữ liệu xem lại.
            </Text>
          </AppCard>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },

  centered: {
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

  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },

  // Summary
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  summaryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  summaryIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  summaryInfo: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  summarySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  scorePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: COLORS.backgroundSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  scorePillValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },

  scorePillMax: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },

  // Stat chips
  statRow: {
    flexDirection: "row",
    gap: 8,
  },

  statChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },

  statChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF1F1",
    padding: 14,
    borderRadius: 14,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    lineHeight: 18,
  },

  // Controls
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  controlButtons: {
    flexDirection: "row",
    gap: 8,
  },

  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  controlBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },

  // Question card
  questionCard: {
    padding: 0,
    overflow: "hidden",
  },

  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },

  qNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  qNumText: {
    fontSize: 13,
    fontWeight: "800",
  },

  questionHeaderCenter: {
    flex: 1,
  },

  questionNumberLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },

  markText: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  stateText: {
    fontSize: 10,
    fontWeight: "700",
  },

  questionBody: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 14,
  },

  questionText: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.text,
    marginBottom: 14,
  },

  answersSection: {
    gap: 8,
  },

  answersLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },

  answerCorrect: {
    borderColor: COLORS.success,
    backgroundColor: "#EAF7EF",
  },

  answerIncorrect: {
    borderColor: COLORS.error,
    backgroundColor: "#FFF1F1",
  },

  answerLabelBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.backgroundSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  answerLabelText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.white,
  },

  answerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },

  rawContent: {
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 12,
    padding: 12,
  },

  feedbackBox: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EEF6FB",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B8D9EC",
  },

  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.text,
  },

  // Empty state
  emptyCard: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },

  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});
