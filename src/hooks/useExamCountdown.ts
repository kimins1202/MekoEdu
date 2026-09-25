import { useEffect, useState } from "react";
import { AppState } from "react-native";

export const remainingExamSeconds = (deadline: number | null, now = Date.now()) =>
  deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000));

export default function useExamCountdown(deadline: number | null, enabled: boolean) {
  const [seconds, setSeconds] = useState(() => remainingExamSeconds(deadline));
  useEffect(() => {
    const update = () => setSeconds(remainingExamSeconds(deadline));
    update();
    if (!enabled || deadline === null) return;
    const timer = setInterval(update, 250);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") update();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [deadline, enabled]);
  return seconds;
}
