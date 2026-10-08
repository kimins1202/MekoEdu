import { useEffect, useRef } from "react";
import { useAudioPlayer } from "expo-audio";

interface Props {
  uri: string;
  audioKey: string;
  playedAudioRef: React.MutableRefObject<Set<string>>;
}

export default function AutoAudioPlayer({
  uri,
  audioKey,
  playedAudioRef,
}: Props) {
  const player = useAudioPlayer(uri);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!uri) return;

    // tránh effect chạy lại trong cùng component
    if (startedRef.current) return;

    // audio này đã phát trong attempt hiện tại
    if (playedAudioRef.current.has(audioKey)) {
      return;
    }

    startedRef.current = true;
    playedAudioRef.current.add(audioKey);

    try {
      player.play();
    } catch (error) {
      console.error("AUTO AUDIO PLAY ERROR:", error);

      // Nếu phát lỗi thì cho phép thử lại lần sau
      playedAudioRef.current.delete(audioKey);
      startedRef.current = false;
    }

    return () => {
      // Không seek, không replay.
      // Khi component bị hủy thì dừng player hiện tại.
      try {
        player.pause();
      } catch {}
    };
  }, [audioKey, playedAudioRef, player, uri]);

  // Không render UI => người thi không có nút để tác động
  return null;
}
