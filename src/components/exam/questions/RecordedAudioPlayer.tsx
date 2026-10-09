import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { Ionicons } from "@expo/vector-icons";

import COLORS from "../../../constants/colors";

interface Props {
  uri: string;
}

export default function RecordedAudioPlayer({ uri }: Props) {
  const source = useMemo(() => ({ uri }), [uri]);
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [error, setError] = useState(false);
  const mounted = useRef(false);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    setError(false);
    const timer = setTimeout(() => setError(true), 15000);
    if (status.isLoaded) clearTimeout(timer);
    return () => clearTimeout(timer);
  }, [uri, status.isLoaded]);

  const handlePlayPause = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (!mounted.current) return;

      if (!status.isLoaded) {
        return;
      }

      if (status.playing) {
        player.pause();
        return;
      }

      if (status.didJustFinish || status.currentTime >= status.duration) await player.seekTo(0);
      if (!mounted.current) return;
      player.volume = 1;
      player.play();
    } catch (error) {
      if (mounted.current) setError(true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bản ghi âm của bạn</Text>

      <Pressable style={styles.button} onPress={handlePlayPause}>
        <Ionicons
          name={status.playing ? "pause-circle" : "play-circle"}
          size={28}
          color="#FFFFFF"
        />
        <Text style={styles.buttonText}>
          {status.playing ? "Tạm dừng" : "Nghe lại"}
        </Text>
      </Pressable>

      <Text style={styles.info}>
        Trạng thái: {error ? "Không thể phát bản ghi. Kiểm tra kết nối hoặc mở lại câu hỏi." : status.isLoaded ? "Đã tải" : "Đang tải"}
      </Text>

      <Text style={styles.info}>
        Thời lượng: {status.duration.toFixed(2)} giây
      </Text>

      <Text style={styles.info}>
        Vị trí phát: {status.currentTime.toFixed(2)} giây
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  info: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});
