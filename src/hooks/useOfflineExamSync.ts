import { useEffect } from "react";
import { AppState } from "react-native";
import { syncPendingExams } from "@/services/syncService";

export default function useOfflineExamSync() {
  useEffect(() => {
    let busy = false;
    const flush = async () => {
      if (busy || AppState.currentState !== "active") return;
      busy = true;
      try { await syncPendingExams(); }
      catch { /* The exam screen reports storage errors; never discard pending data. */ }
      finally { busy = false; }
    };
    void flush();
    const interval = setInterval(() => { void flush(); }, 15000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void flush();
    });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
}
