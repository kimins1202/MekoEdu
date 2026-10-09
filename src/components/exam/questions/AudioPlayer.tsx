import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Pressable, StyleSheet, Text, View } from "react-native";

import COLORS from "../../../constants/colors";

interface Props {
  uri: string;
}

export default function AudioPlayer({ uri }: Props) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const handlePlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const formatTime = (seconds = 0) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);

    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audio câu hỏi</Text>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={handlePlayPause}>
          <Text style={styles.buttonText}>{status.playing ? "⏸" : "▶"}</Text>
        </Pressable>

        <Text style={styles.time}>
          {formatTime(status.currentTime)}
          {" / "}
          {formatTime(status.duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    marginRight: 14,
  },

  buttonText: {
    fontSize: 18,
    color: COLORS.white,
  },

  time: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
