import React from "react";
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
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  const handlePlayPause = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      console.log("RECORDED AUDIO STATUS:", {
        uri,
        isLoaded: status.isLoaded,
        duration: status.duration,
        currentTime: status.currentTime,
        playing: status.playing,
      });

      if (!status.isLoaded) {
        console.log("RECORDED AUDIO NOT LOADED");
        return;
      }

      if (status.playing) {
        player.pause();
        return;
      }

      await player.seekTo(0);
      player.volume = 1;
      player.play();
    } catch (error) {
      console.error("RECORDED AUDIO PLAY ERROR:", error);
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
        Trạng thái: {status.isLoaded ? "Đã tải" : "Đang tải"}
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
