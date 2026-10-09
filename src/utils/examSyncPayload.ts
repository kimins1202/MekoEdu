import { parse } from "node-html-parser";
import type { OfflineExam } from "@/services/examStorageService";

export function buildExamSyncPayload(exam: OfflineExam) {
  const data = new Map(Object.entries(exam.answers).filter(([name]) => !/^q\d+:\d+_recording$/.test(name)).map(([name, value]) => [name, String(value)]));
  const slots = new Set<number>();
  const validated = new Set<string>();
  for (const page of Object.values(exam.pages)) {
    for (const question of page.questions) {
      if (question.type === "recordrtc" || /que recordrtc/.test(question.html ?? "")) continue;
      const root = parse(question.html ?? "");
      const controls = root.querySelectorAll("input, select, textarea");
      const sequence = controls.find(control => /_:sequencecheck$/.test(control.getAttribute("name") ?? ""));
      const prefix = sequence?.getAttribute("name")?.replace(/:sequencecheck$/, "")
        ?? controls.map(control => control.getAttribute("name")?.match(/^q\d+:\d+_/)?.[0]).find(Boolean);
      if (!prefix || !Object.keys(exam.answers).some(name => name.startsWith(prefix))) continue;

      const count = Number(question.sequencecheck ?? sequence?.getAttribute("value"));
      if (!Number.isInteger(count) || count < 0) {
        throw new Error("Thiếu thông tin kiểm tra câu hỏi. Đáp án vẫn được giữ trên thiết bị.");
      }
      // Moodle uses the question usage ID, which is different from the quiz attempt ID.
      data.set(`${prefix}:sequencecheck`, String(count));
      validated.add(prefix);
      slots.add(Number(prefix.match(/:(\d+)_$/)?.[1]));

      for (const control of controls) {
        const name = control.getAttribute("name") ?? "";
        if (control.getAttribute("type") === "hidden" && name.startsWith(prefix)
          && !name.slice(prefix.length).startsWith(":") && !name.slice(prefix.length).startsWith("-")
          && !data.has(name)) {
          data.set(name, control.getAttribute("value") ?? "");
        }
      }
    }
  }
  for (const name of Object.keys(exam.answers)) {
    if (/^q\d+:\d+_recording$/.test(name)) continue;
    const prefix = name.match(/^q\d+:\d+_/)?.[0];
    if (prefix && !validated.has(prefix)) {
      throw new Error("Không tìm thấy thông tin câu hỏi để đồng bộ. Đáp án vẫn được giữ trên thiết bị.");
    }
  }
  if (slots.size) data.set("slots", [...slots].join(","));
  return [...data].map(([name, value]) => ({ name, value }));
}
