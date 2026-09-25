import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExamSyncStatus = "Pending" | "Synced" | "Failed";
export type ExamContext = { userid: number; quizid: number; attemptid: number };
export type CachedExamPage = { questions: any[]; nextpage: number };
export type OfflineExam = ExamContext & {
  deadline: number | null;
  answers: Record<string, string>;
  pages: Record<string, CachedExamPage>;
  currentPage: number;
  revision: number;
  status: ExamSyncStatus;
  error?: string;
  submitRequested: boolean;
  submitted: boolean;
  updatedAt: number;
};

const prefix = "offline-exam:v1:";
const keyFor = (context: ExamContext) => `${prefix}${context.userid}:${context.quizid}:${context.attemptid}`;
let storageTask: Promise<unknown> = Promise.resolve();
const listeners = new Set<(exam: OfflineExam) => void>();

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const task = storageTask.then(operation);
  storageTask = task.catch(() => undefined);
  return task;
}

export function subscribeExamSync(listener: (exam: OfflineExam) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function readOfflineExam(context: ExamContext): Promise<OfflineExam | null> {
  return serialize(async () => {
    const raw = await AsyncStorage.getItem(keyFor(context));
    return raw ? JSON.parse(raw) : null;
  });
}

export function listOfflineExams(userid: number): Promise<OfflineExam[]> {
  return serialize(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(`${prefix}${userid}:`));
    if (!keys.length) return [];
    const items = await AsyncStorage.multiGet(keys);
    return items.filter(([, raw]) => raw !== null).map(([, raw]) => JSON.parse(raw!) as OfflineExam);
  });
}

export function updateOfflineExam(context: ExamContext, update: (exam: OfflineExam) => OfflineExam): Promise<OfflineExam> {
  return serialize(async () => {
    const raw = await AsyncStorage.getItem(keyFor(context));
    const previous: OfflineExam = raw ? JSON.parse(raw) : {
      ...context, deadline: null, answers: {}, pages: {}, currentPage: 0,
      revision: 0, status: "Synced", submitRequested: false, submitted: false, updatedAt: Date.now(),
    };
    const next = update(previous);
    await AsyncStorage.setItem(keyFor(context), JSON.stringify(next));
    listeners.forEach((listener) => listener(next));
    return next;
  });
}

export function queueExamAnswers(context: ExamContext, answers: Record<string, string>, submit = false) {
  return updateOfflineExam(context, (exam) => {
    if (exam.submitted || (exam.submitRequested && !submit)) return exam;
    return {
      ...exam, answers: exam.submitRequested ? exam.answers : { ...exam.answers, ...answers }, revision: exam.revision + 1,
      submitRequested: exam.submitRequested || submit, status: "Pending", error: undefined, updatedAt: Date.now(),
    };
  });
}
