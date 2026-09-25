import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";
import {
  MonitoringContext,
  MonitoringEventName,
  readMonitoringEvents,
  recordMonitoringEvent,
} from "@/services/monitoringService";

// Serialize native protection changes, including fast unmount/remount cycles.
let protectionTask: Promise<unknown> = Promise.resolve();
const protectionKey = "mekoedu-exam";

export default function useExamMonitoring(context: MonitoringContext | null, active: boolean) {
  const [protection, setProtection] = useState("Đang bật bảo vệ màn hình…");
  const [departures, setDepartures] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const [hidden, setHidden] = useState(AppState.currentState !== "active");
  const finished = useRef(false);
  const userid = context?.userid;
  const quizid = context?.quizid;
  const attemptid = context?.attemptid;

  useEffect(() => {
    if (!active || !userid || !quizid || !attemptid) return;
    const session = { userid, quizid, attemptid };
    let disposed = false;
    let away = false;
    finished.current = false;
    setStorageError(false);
    const record = (event: MonitoringEventName) => {
      void recordMonitoringEvent(session, event).then((events) => {
        if (!disposed) setDepartures(events.filter((entry) => entry.event === "APP_BACKGROUND").length);
      }).catch(() => { if (!disposed) setStorageError(true); });
    };
    void readMonitoringEvents(session).then((events) => {
      if (!disposed) setDepartures(events.filter((entry) => entry.event === "APP_BACKGROUND").length);
    }).catch(() => { if (!disposed) setStorageError(true); });
    record("EXAM_OPEN");

    const transition = (isAway: boolean) => {
      if (disposed || finished.current) return;
      setHidden(isAway);
      if (isAway && !away) {
        away = true;
        record("APP_BACKGROUND");
      } else if (!isAway && away) {
        away = false;
        record("APP_FOREGROUND");
        Alert.alert("Bạn đã rời màn hình thi", "Ứng dụng đã phát hiện việc rời màn hình. Vui lòng ở lại màn hình thi cho đến khi nộp bài.");
      }
    };
    // Inactive -> background -> active is one departure, not two.
    const onAppState = (state: string) => {
      // iOS alerts/control center can be inactive without leaving the app.
      if (state === "inactive") setHidden(true);
      else transition(state === "background");
    };
    const subscription = AppState.addEventListener("change", onAppState);
    onAppState(AppState.currentState);
    const onVisibility = () => transition(document.hidden);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
      onVisibility();
    }

    setProtection("Đang bật bảo vệ màn hình…");
    protectionTask = protectionTask.catch(() => undefined).then(async () => {
      if (disposed) return;
      if (Platform.OS === "web" || !(await ScreenCapture.isAvailableAsync())) {
        if (!disposed) setProtection("Thiết bị này không hỗ trợ chặn chụp/quay màn hình");
        return;
      }
      await ScreenCapture.preventScreenCaptureAsync(protectionKey);
      if (Platform.OS === "ios") await ScreenCapture.enableAppSwitcherProtectionAsync();
      if (!disposed) setProtection("Đã bật chặn chụp/quay màn hình");
    }).catch(() => {
      if (!disposed) setProtection("Không bật được chặn chụp/quay màn hình");
    });

    return () => {
      disposed = true;
      subscription.remove();
      if (Platform.OS === "web" && typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
      protectionTask = protectionTask.catch(() => undefined).then(async () => {
        if (Platform.OS === "web") return;
        try {
          await ScreenCapture.allowScreenCaptureAsync(protectionKey);
        } finally {
          if (Platform.OS === "ios") await ScreenCapture.disableAppSwitcherProtectionAsync();
        }
      }).catch(() => undefined);
    };
  }, [active, userid, quizid, attemptid]);

  const complete = () => {
    finished.current = true;
    if (context) void recordMonitoringEvent(context, "EXAM_SUBMIT").catch(() => setStorageError(true));
  };
  return { protection, departures, storageError, hidden: active && hidden, complete };
}
