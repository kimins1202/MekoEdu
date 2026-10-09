import React, { useEffect, useRef, useState } from "react";
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

interface Props {
  question: ParsedQuestion;
  attemptId: number;
  fieldName: string;
  sequencecheck: number;
  setAnswer: (field: string, value: string) => void;
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
}: Props) {
  const maxDuration = question.recordingMaxDuration ?? 180;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const stoppingRef = useRef(false);

  const isRecording = recorderState.isRecording;

  const elapsedSeconds = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  
const stopRecording = async () => {
  if (stoppingRef.current || !recorder.isRecording) return;

  stoppingRef.current = true;
  setBusy(true);

  try {
    console.log("========== RECORDING DEBUG ==========");

    await recorder.stop();

    const sourceUri = recorder.uri;

    if (!sourceUri) {
      throw new Error("Không tìm thấy file ghi âm");
    }

    const source = new File(sourceUri);

    if (!source.exists || !source.size || source.size <= 0) {
      throw new Error("File ghi âm không hợp lệ");
    }

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    // Dùng trực tiếp file do expo-audio tạo ra.
    setAudioUri(sourceUri);
    setUploaded(false);

    console.log("RECORDRTC SAVE SUCCESS:", sourceUri);

    Alert.alert(
      "Thành công",
      "Đã ghi âm. Bạn có thể nghe lại.",
    );
  } catch (error) {

    Alert.alert(
      "Lỗi lưu ghi âm",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    stoppingRef.current = false;
    setBusy(false);
  }
};


  const startRecording = async () => {
    if (busy || isRecording) return;

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

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Bản ghi mới chưa được upload.
      setUploaded(false);
      setAudioUri(null);

      await recorder.prepareToRecordAsync();
      recorder.record();

    } catch (error) {

      Alert.alert(
        "Lỗi ghi âm",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isRecording && elapsedSeconds >= maxDuration && !stoppingRef.current) {
      void stopRecording();
    }
  }, [isRecording, elapsedSeconds, maxDuration]);

  
const handleUploadRecording = async () => {
  if (!audioUri) {
    Alert.alert("Thông báo", "Bạn chưa ghi âm câu trả lời.");
    return;
  }

  if (uploading || busy || isRecording) return;

  setUploading(true);

  try {
    const result = await saveSpeakingRecording({
      attemptId,
      fieldName,
      sequencecheck,
      audioUri,
    });

    setAnswer(fieldName, String(result.itemid));
    setUploaded(true);

    Alert.alert(
      "Đã gửi bản ghi",
      "Moodle đã xác nhận lưu yêu cầu. Hãy kiểm tra trạng thái câu trả lời.",
    );
  } catch (error) {
    console.error("RECORDRTC UPLOAD ERROR:", error);

    Alert.alert(
      "Lỗi tải lên Moodle",
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    setUploading(false);
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

      <Pressable
        disabled={busy || uploading}
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

      {audioUri && !isRecording && (
        <Pressable
          disabled={busy || uploading || uploaded}
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

      {audioUri && !isRecording && (
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
