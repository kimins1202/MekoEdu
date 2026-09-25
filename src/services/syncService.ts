import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserAttempts, processQuizAttempt, saveQuizAttempt } from "@/api/quizApi";
import { ExamContext, listOfflineExams, readOfflineExam, updateOfflineExam } from "./examStorageService";

const running = new Map<string, Promise<void>>();
export const isOfflineError = (error: any) =>
  !!error?.isAxiosError && !error.response;

export function syncExam(context: ExamContext, retryFailed = false): Promise<void> {
  const key = `${context.userid}:${context.quizid}:${context.attemptid}`;
  const existing = running.get(key);
  if (existing) return existing;
  const task = (async () => {
    // Re-read after each response; a newer edit must never be marked Synced by an old response.
    while (true) {
      const snapshot = await readOfflineExam(context);
      if (!snapshot || snapshot.submitted || snapshot.status === "Synced" || (snapshot.status === "Failed" && !retryFailed)) return;
      if (Number(await AsyncStorage.getItem("userid")) !== context.userid || !(await AsyncStorage.getItem("wstoken"))) return;
      const data = Object.entries(snapshot.answers).map(([name, value]) => ({ name, value }));
      try {
        if (snapshot.submitRequested) {
          // Resolve a lost submission response before attempting submission again.
          const history = await getUserAttempts(context.quizid, context.userid, "all");
          const attempt = history?.attempts?.find((item: any) => Number(item.id) === context.attemptid);
          if (!attempt) throw new Error("Không tìm thấy lượt thi để đồng bộ.");
          if (attempt.state === "abandoned") throw new Error("Lượt thi đã bị đóng. Đáp án vẫn được giữ trên thiết bị.");
          if (attempt.state !== "finished") {
            if (Number(await AsyncStorage.getItem("userid")) !== context.userid) return;
            const result = await processQuizAttempt(context.attemptid, data, 1);
            if (result?.state !== "finished") throw new Error("Moodle chưa xác nhận nộp bài thành công.");
          }
        } else {
          const result = await saveQuizAttempt(context.attemptid, data);
          if (result?.status === false) throw new Error("Moodle không xác nhận lưu câu trả lời.");
        }
        await updateOfflineExam(context, (current) => current.revision !== snapshot.revision ? current : {
          ...current, status: "Synced", error: undefined, submitted: snapshot.submitRequested,
        });
      } catch (error: any) {
        await updateOfflineExam(context, (current) => current.revision !== snapshot.revision ? current : {
          ...current, status: isOfflineError(error) ? "Pending" : "Failed",
          error: isOfflineError(error) ? "Chưa kết nối được Moodle. Bài làm đã lưu trên thiết bị." : error?.message || "Đồng bộ thất bại.",
        });
        return;
      }
    }
  })().finally(() => running.delete(key));
  running.set(key, task);
  return task;
}

export async function syncPendingExams() {
  const userid = Number(await AsyncStorage.getItem("userid"));
  if (!userid) return;
  const exams = await listOfflineExams(userid);
  for (const exam of exams) {
    if (exam.status === "Pending") await syncExam(exam);
  }
}
