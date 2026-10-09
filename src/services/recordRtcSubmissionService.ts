import { saveQuizAttempt } from "../api/quizApi";
import { uploadRecording } from "../api/recordRtcApi";
import { fetchSpeakingQuestion, validLocalRecording } from "./speakingStorageService";
import { parseQuestion } from "../parsers/questionParser";

interface Params {
  attemptId: number;
  fieldName: string;
  sequencecheck: number;
  audioUri: string;
  page: number;
  canSave: () => boolean;
}

export async function saveSpeakingRecording({
  attemptId,
  fieldName,
  sequencecheck,
  audioUri,
  page,
  canSave,
}: Params) {
  if (!/^q\d+:\d+_recording$/.test(fieldName)) {
    throw new Error("Tên trường Speaking không hợp lệ.");
  }

  if (!canSave() || !validLocalRecording(audioUri)) throw new Error("Không thể tải bản ghi lúc này.");
  const uploaded = await uploadRecording(audioUri);
  if (!canSave()) throw new Error("Thao tác lưu bản ghi đã bị khóa. Bản ghi vẫn được giữ trên thiết bị.");
  // Page cache may contain an obsolete sequence after a previous Speaking save.
  const current = await fetchSpeakingQuestion(attemptId, page, fieldName);
  const freshSequence = Number(current.sequencecheck ?? parseQuestion(current.html ?? "").sequencecheck);
  if (!Number.isInteger(freshSequence) || freshSequence < 0) throw new Error("Thiếu sequencecheck hiện tại từ Moodle.");
  if (!canSave()) throw new Error("Thao tác lưu bản ghi đã bị khóa.");

  const prefix = fieldName.replace(/recording$/, "");
  const slot = Number(fieldName.match(/^q\d+:(\d+)_recording$/)?.[1]);

  const result = await saveQuizAttempt(attemptId, [
    {
      name: fieldName,
      value: String(uploaded.itemid),
    },
    {
      name: `${prefix}:sequencecheck`,
      value: String(freshSequence),
    },
    {
      name: "slots",
      value: String(slot),
    },
  ]);

  if (result?.status !== true) {
    throw new Error("Moodle chưa xác nhận lưu bản ghi.");
  }

  return uploaded;
}
