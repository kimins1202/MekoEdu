import RenderHTML from "react-native-render-html";
import { getReviewGrade, parseReviewHtml } from "@/parsers/reviewParser";
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
  useWindowDimensions,
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
  stateclass?: string;
  mark?: string;
  maxmark?: number;
};

function getStateInfo(question: ReviewQuestion) {
  switch (getReviewGrade(question)) {
    case "correct": return { label: "Đúng", color: COLORS.success, bg: "#EAF7EF", icon: "checkmark-circle" as const };
    case "partial": return { label: "Đúng một phần", color: COLORS.warning, bg: "#FFF6E4", icon: "alert-circle" as const };
    case "incorrect": return { label: "Sai", color: COLORS.error, bg: "#FFF1F1", icon: "close-circle" as const };
    default: return { label: "Chưa chấm", color: COLORS.textLight, bg: COLORS.backgroundSoft, icon: "help-circle" as const };
  }
}
// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AnswerReviewScreen() {
  useNavigation();
  const { width } = useWindowDimensions();
  const contentWidth = Math.max(1, width - 60);

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

  const correctCount = questions.filter(q => getReviewGrade(q) === "correct").length;
  const wrongCount = questions.filter(q => ["incorrect", "partial"].includes(getReviewGrade(q))).length;
  const uncheckCount = questions.filter(q => getReviewGrade(q) === "ungraded").length;
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
          const stateInfo = getStateInfo(q);
          const isExpanded = expandedSlots.has(q.slot);

          const { contentHtml, feedbackHtml } = parseReviewHtml(q.html ?? "");

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
                        : `—/${mx}`}{" "}
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

                  <RenderHTML
                    contentWidth={contentWidth}
                    source={{ html: contentHtml || "<p>Nội dung câu hỏi không được cung cấp.</p>" }}
                    baseStyle={{ fontSize: 15, lineHeight: 23, color: COLORS.text }}
                    classesStyles={{ correct: { color: COLORS.success }, incorrect: { color: COLORS.error }, partiallycorrect: { color: COLORS.warning } }}
                  />
                  {!!feedbackHtml && (
                    <View style={styles.rawContent}>
                      <Text style={styles.answersLabel}>Nhận xét và đáp án</Text>
                      <RenderHTML
                        contentWidth={Math.max(1, contentWidth - 24)}
                        source={{ html: feedbackHtml }}
                        baseStyle={{ fontSize: 14, lineHeight: 22, color: COLORS.text }}
                      />
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
