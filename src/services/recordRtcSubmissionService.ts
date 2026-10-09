import { saveQuizAttempt } from "../api/quizApi";
import { uploadRecording } from "../api/recordRtcApi";

interface Params {
  attemptId: number;
  fieldName: string;
  sequencecheck: number;
  audioUri: string;
}

export async function saveSpeakingRecording({
  attemptId,
  fieldName,
  sequencecheck,
  audioUri,
}: Params) {
  if (!/^q\d+:\d+_recording$/.test(fieldName)) {
    throw new Error("Tên trường Speaking không hợp lệ.");
  }

  const uploaded = await uploadRecording(audioUri);

  const prefix = fieldName.replace(/recording$/, "");
  const slot = Number(fieldName.match(/^q\d+:(\d+)_recording$/)?.[1]);

  const result = await saveQuizAttempt(attemptId, [
    {
      name: fieldName,
      value: String(uploaded.itemid),
    },
    {
      name: `${prefix}:sequencecheck`,
      value: String(sequencecheck),
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
