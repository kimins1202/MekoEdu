import type { OfflineExam } from "@/services/examStorageService";

export type ResumeTarget = { attemptid: number; page: number; pendingSubmission: boolean; offline: boolean };
export type ResumeAttempt = { id: number; state: string; timestart?: number; currentpage?: number };

// A successful server response takes precedence over stale local attempts.
export function findResumeTarget(userid: number, quizid: number, attempts: ResumeAttempt[] | null, cache: OfflineExam[]): ResumeTarget | null {
  const local = cache.filter((exam) => exam.userid === userid && exam.quizid === quizid && !exam.submitted);
  if (attempts !== null) {
    const current = [...attempts].filter((attempt) => Number(attempt.id) > 0 && attempt.state === "inprogress")
      .sort((a, b) => (b.timestart ?? 0) - (a.timestart ?? 0) || Number(b.id) - Number(a.id))[0];
    if (!current) return null;
    const saved = local.find((exam) => exam.attemptid === Number(current.id));
    return { attemptid: Number(current.id), page: saved?.currentPage ?? current.currentpage ?? 0, pendingSubmission: !!saved?.submitRequested, offline: false };
  }
  const saved = local.filter((exam) => Object.keys(exam.pages).length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return saved ? { attemptid: saved.attemptid, page: saved.currentPage, pendingSubmission: saved.submitRequested, offline: true } : null;
}

export function selectRequestedAttempt(attempts: ResumeAttempt[], attemptid: number): ResumeAttempt {
  const attempt = attempts.find((item) => Number(item.id) === attemptid);
  if (!attempt) throw new Error("Không tìm thấy lượt thi cần tiếp tục. Hãy tải lại thông tin bài thi.");
  if (attempt.state !== "inprogress" && attempt.state !== "finished") {
    throw new Error("Lượt thi này đã quá hạn hoặc bị đóng, không thể tiếp tục làm bài.");
  }
  return attempt;
}
