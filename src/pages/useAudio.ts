import { useEffect, useRef } from "react";

const stopTone = (audio: HTMLAudioElement) => {
  if (!audio.paused) {
    audio.pause();
    audio.currentTime = 0;
  }
};

export const useAudio = (src: string, loop = true) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio(src));

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = loop;
    return () => {
      stopTone(audio);
    };
  }, [src, loop]);

  const play = () => {
    audioRef.current.play().catch((err) => {
      console.error("Audio play failed:", err);
    });
  };

  const stop = () => {
    stopTone(audioRef.current);
  };

  return { audio: audioRef.current, play, stop };
};
