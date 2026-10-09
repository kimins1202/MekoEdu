import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { File } from "expo-file-system";

import COLORS from "../../../constants/colors";
import type { ParsedQuestion } from "../../../types/question";
import RecordedAudioPlayer from "./RecordedAudioPlayer";
import { saveSpeakingRecording } from "../../../services/recordRtcSubmissionService";
import { fetchSpeakingQuestion, readSpeaking, responseRecordingUrl, validLocalRecording, writeSpeaking } from "../../../services/speakingStorageService";
import { getMoodleFileUrl } from "../../../utils/moodleFile";

interface Props {
  question: ParsedQuestion;
  attemptId: number;
  fieldName: string;
  sequencecheck: number;
  setAnswer: (field: string, value: string) => void;
  userId: number;
  page: number;
  token?: string;
  disabled?: boolean;
  focused?: boolean;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RecordRTCQuestion({
  question,
  attemptId,
  fieldName,
  sequencecheck,
  setAnswer,
  userId, page, token, disabled = false, focused = true,
}: Props) {
  const maxDuration = question.recordingMaxDuration ?? 180;

  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: "document" });
  const recorderState = useAudioRecorderState(recorder, 250);

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const stoppingRef = useRef(false);
  const mounted = useRef(false);
  const actionLock = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const answerCallback = useRef(setAnswer);
  answerCallback.current = setAnswer;
  const [restoring, setRestoring] = useState(true);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [message, setMessage] = useState("Đang khôi phục...");
  const [unverified, setUnverified] = useState(false);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      // Layout cleanup runs before Expo's passive cleanup releases the shared object.
      // Start stop while it is alive; stopRecording captures the URI before awaiting.
      void stopRecording();
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!focused || actionLock.current || recorder.isRecording) return;
    let cancelled = false;
    setRestoring(true);
    void (async () => {
      try {
        const saved = await readSpeaking(userId, attemptId, fieldName);
        const local = validLocalRecording(saved?.audioUri);
        let remote: string | null = null;
        let online = true;
        try { remote = responseRecordingUrl(await fetchSpeakingQuestion(attemptId, page, fieldName)); }
        catch { online = false; }
        if (cancelled) return;
        const pending = !!saved && !saved.uploaded;
        setLocalUri(local);
        setAudioUri(pending ? local : remote ? getMoodleFileUrl(remote, token) : local);
        setUploaded(!pending && !!remote);
        if (!pending && remote) answerCallback.current(fieldName, saved?.itemid ? String(saved.itemid) : "saved");
        if (pending) answerCallback.current(fieldName, "");
        setUnverified(!pending && !!saved?.uploaded && !remote);
        setMessage(pending
          ? local ? "Đã ghi âm, chưa upload." : "Không thể khôi phục bản ghi mới: file không còn. Hãy ghi âm lại."
          : remote ? "Đã lưu trên Moodle."
          : saved?.uploaded ? "Chưa xác minh được bản ghi trên Moodle; không tự động upload lại."
          : !online ? "Không kết nối được Moodle để khôi phục bản ghi."
          : "Chưa ghi âm.");
      } catch { if (!cancelled) setMessage("Không thể khôi phục bản ghi."); }
      finally { if (!cancelled) setRestoring(false); }
    })();
    return () => { cancelled = true; };
  }, [userId, attemptId, fieldName, page, token, focused, recorder]);

  const isRecording = recorderState.isRecording;

  const elapsedSeconds = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  
const stopRecording = async () => {
  if (!mounted.current || stoppingRef.current) return;

  stoppingRef.current = true;
  actionLock.current = true;
  if (mounted.current) setBusy(true);

  try {
    if (!recorder.isRecording) return;
    // Do not read a native getter after await: unmount may release the recorder.
    const recordingUri = recorder.uri;
    await recorder.stop();

    const sourceUri = recordingUri;

    if (!sourceUri) {
      throw new Error("Không tìm thấy file ghi âm");
    }

    const source = new File(sourceUri);

    if (!source.exists || !source.size || source.size <= 0) {
      throw new Error("File ghi âm không hợp lệ");
    }
    await writeSpeaking(userId, { attemptId, fieldName, audioUri: sourceUri, uploaded: false, updatedAt: Date.now() });

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    if (!mounted.current) return;
    setAudioUri(sourceUri);
    setLocalUri(sourceUri);
    setUploaded(false);
    setUnverified(false);
    setMessage("Đã ghi âm, chưa upload.");
    setAnswer(fieldName, "");

    Alert.alert(
      "Thành công",
      "Đã ghi âm. Bạn có thể nghe lại.",
    );
  } catch (error) {
    if (!mounted.current) return;
    Alert.alert(
      "Lỗi lưu ghi âm",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    stoppingRef.current = false;
    actionLock.current = false;
    if (mounted.current) setBusy(false);
  }
};


  const startRecording = async () => {
    if (disabledRef.current || restoring || actionLock.current || busy || isRecording || !userId) return;

    actionLock.current = true;
    setBusy(true);

    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Thiếu quyền microphone",
          "Vui lòng cấp quyền microphone để ghi âm.",
        );
        return;
      }
      if (!mounted.current || disabledRef.current) return;

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      if (!mounted.current || disabledRef.current) return;
      await recorder.prepareToRecordAsync();
      if (!mounted.current || disabledRef.current) return;
      await writeSpeaking(userId, { attemptId, fieldName, audioUri: null, uploaded: false, updatedAt: Date.now() });
      if (!mounted.current || disabledRef.current) return;
      setAnswer(fieldName, "");
      setUploaded(false);
      setUnverified(false);
      setAudioUri(null);
      setLocalUri(null);
      recorder.record();

    } catch (error) {
      if (!mounted.current) return;
      Alert.alert(
        "Lỗi ghi âm",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      actionLock.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (isRecording && (elapsedSeconds >= maxDuration || disabled || !focused) && !stoppingRef.current) {
      void stopRecording();
    }
  }, [isRecording, elapsedSeconds, maxDuration, disabled, focused]);

  
const handleUploadRecording = async () => {
  if (!validLocalRecording(localUri)) {
    Alert.alert("Thông báo", "Bạn chưa ghi âm câu trả lời.");
    return;
  }

  if (disabledRef.current || restoring || actionLock.current || uploading || busy || isRecording || uploaded || unverified) return;

  actionLock.current = true;
  setUploading(true);

  try {
    const result = await saveSpeakingRecording({
      attemptId,
      fieldName,
      sequencecheck,
      audioUri: localUri!,
      page,
      canSave: () => mounted.current && !disabledRef.current,
    });
    await writeSpeaking(userId, { attemptId, fieldName, audioUri: localUri, uploaded: true, itemid: result.itemid, updatedAt: Date.now() });
    if (!mounted.current) return;

    setAnswer(fieldName, String(result.itemid));
    setUploaded(true);
    setMessage("Đã lưu trên Moodle.");

    Alert.alert(
      "Đã gửi bản ghi",
      "Moodle đã xác nhận lưu yêu cầu. Hãy kiểm tra trạng thái câu trả lời.",
    );
  } catch (error) {
    if (!mounted.current) return;

    Alert.alert(
      "Lỗi tải lên Moodle",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    actionLock.current = false;
    if (mounted.current) setUploading(false);
  }
};


  return (
    <View style={styles.container}>
      <Ionicons
        name={isRecording ? "radio-button-on" : "mic-outline"}
        size={42}
        color={isRecording ? "#DC2626" : COLORS.primary}
      />

      <Text style={styles.title}>Ghi âm câu trả lời Speaking</Text>

      <Text style={styles.timer}>
        {formatTime(Math.min(elapsedSeconds, maxDuration))}
      </Text>

      <Text style={styles.subtitle}>
        Thời gian tối đa: {formatTime(maxDuration)}
      </Text>
      <Text style={styles.subtitle}>{restoring ? "Đang khôi phục..." : uploading ? "Đang upload..." : message}</Text>

      <Pressable
        disabled={disabled || !userId || restoring || busy || uploading}
        style={[
          styles.button,
          isRecording && styles.stopButton,
          busy && styles.disabledButton,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Ionicons
          name={isRecording ? "stop" : "mic"}
          size={20}
          color="#FFFFFF"
        />

        <Text style={styles.buttonText}>
          {busy
            ? "Đang xử lý..."
            : isRecording
              ? "Dừng và lưu ghi âm"
              : audioUri
                ? "Ghi âm lại"
                : "Bắt đầu ghi âm"}
        </Text>
      </Pressable>

      {audioUri && !isRecording && (
        <RecordedAudioPlayer key={audioUri} uri={audioUri} />
      )}

      {localUri && !isRecording && (
        <Pressable
          disabled={disabled || restoring || busy || uploading || uploaded || unverified}
          style={[
            styles.button,
            uploaded && styles.uploadedButton,
            (busy || uploading) && styles.disabledButton,
          ]}
          onPress={handleUploadRecording}
        >
          <Ionicons
            name={uploaded ? "checkmark-circle" : "cloud-upload-outline"}
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            {uploading
              ? "Đang tải lên Moodle..."
              : uploaded
                ? "Đã gửi bản ghi"
                : "Lưu câu trả lời lên Moodle"}
          </Text>
        </Pressable>
      )}

      {localUri && !isRecording && (
        <Text style={styles.success}>Đã lưu bản ghi trên thiết bị</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 20,
    gap: 12,
    backgroundColor: COLORS.backgroundSoft,
    borderRadius: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  timer: {
    fontSize: 36,
    fontWeight: "700",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stopButton: {
    backgroundColor: "#DC2626",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  success: {
    color: "#15803D",
    fontSize: 12,
    textAlign: "center",
  },

  uploadedButton: {
    backgroundColor: "#15803D",
  },
});
