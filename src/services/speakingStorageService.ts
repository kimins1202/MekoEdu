import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import { getAttemptData } from "../api/quizApi";
import { parseQuestion } from "../parsers/questionParser";

export interface SpeakingRecording {
  attemptId: number;
  fieldName: string;
  audioUri: string | null;
  uploaded: boolean;
  itemid?: number;
  updatedAt: number;
}
const prefix = "speaking:v1:";
const keyFor = (userid: number, attemptId: number, fieldName: string) =>
  `${prefix}${userid}:${attemptId}:${encodeURIComponent(fieldName)}`;

export function validLocalRecording(uri?: string | null): string | null {
  try {
    if (!uri?.startsWith("file://")) return null;
    const file = new File(uri);
    return file.exists && file.size > 0 ? uri : null;
  } catch { return null; }
}

export async function readSpeaking(userid: number, attemptId: number, fieldName: string): Promise<SpeakingRecording | null> {
  const raw = await AsyncStorage.getItem(keyFor(userid, attemptId, fieldName));
  if (!raw) return null;
  const value = JSON.parse(raw) as SpeakingRecording;
  return value.attemptId === attemptId && value.fieldName === fieldName ? value : null;
}

export async function writeSpeaking(userid: number, value: SpeakingRecording) {
  await AsyncStorage.setItem(keyFor(userid, value.attemptId, value.fieldName), JSON.stringify(value));
}

// Only response areas of the matching slot are inspected; prompt audio is never used.
export function responseRecordingUrl(question: any): string | null {
  const areas = question?.responsefileareas;
  if (!Array.isArray(areas)) return null;
  for (const area of areas) {
    if (area.area !== "recording" && area.area !== "response_recording") continue;
    for (const file of area.files ?? []) {
      if (typeof file.fileurl !== "string" || !/^https?:\/\//i.test(file.fileurl)) continue;
      if (/\.(m4a|mp3|ogg)(?:$|[?#])/i.test(file.filename ?? file.fileurl)) return file.fileurl;
    }
  }
  return null;
}

const reads = new Map<string, Promise<any>>();
export async function fetchSpeakingQuestion(attemptId: number, page: number, fieldName: string) {
  const key = `${attemptId}:${page}`;
  let request = reads.get(key);
  if (!request) {
    request = getAttemptData(attemptId, page).finally(() => reads.delete(key));
    reads.set(key, request);
  }
  const data = await request;
  const slot = Number(fieldName.match(/:(\d+)_recording$/)?.[1]);
  const question = data.questions?.find((q: any) => Number(q.slot) === slot && parseQuestion(q.html ?? "").fieldName === fieldName);
  if (!question) throw new Error("Không tìm thấy câu Speaking trong lượt thi hiện tại.");
  return question;
}

export async function assertSpeakingReady(userid: number, attemptId: number) {
  const keys = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(`${prefix}${userid}:${attemptId}:`));
  const records = await AsyncStorage.multiGet(keys);
  if (records.some(([, raw]) => raw && !JSON.parse(raw).uploaded)) {
    throw new Error("Có bản ghi Speaking chưa lưu lên Moodle. Hãy mở câu Speaking và tải bản ghi lên trước khi nộp bài.");
  }
}
