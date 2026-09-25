import AsyncStorage from "@react-native-async-storage/async-storage";

export type MonitoringContext = { userid: number; quizid: number; attemptid: number };
export type MonitoringEventName = "EXAM_OPEN" | "APP_BACKGROUND" | "APP_FOREGROUND" | "EXAM_SUBMIT";
export type MonitoringEvent = MonitoringContext & {
  event: MonitoringEventName;
  timestamp: number;
};

// Serialize read/modify/write operations so rapid transitions cannot lose events.
let pending: Promise<unknown> = Promise.resolve();
const keyFor = (context: MonitoringContext) =>
  `exam-monitoring:${context.userid}:${context.quizid}:${context.attemptid}`;

export function readMonitoringEvents(context: MonitoringContext): Promise<MonitoringEvent[]> {
  const read = pending.then(async () => {
    const raw = await AsyncStorage.getItem(keyFor(context));
    return raw ? JSON.parse(raw) as MonitoringEvent[] : [];
  });
  pending = read.catch(() => undefined);
  return read;
}

export function recordMonitoringEvent(context: MonitoringContext, event: MonitoringEventName) {
  const entry: MonitoringEvent = { ...context, event, timestamp: Math.floor(Date.now() / 1000) };
  const write = pending.then(async () => {
    const raw = await AsyncStorage.getItem(keyFor(context));
    const events: MonitoringEvent[] = raw ? JSON.parse(raw) : [];
    events.push(entry);
    await AsyncStorage.setItem(keyFor(context), JSON.stringify(events));
    return events;
  });
  pending = write.catch(() => undefined);
  return write;
}
