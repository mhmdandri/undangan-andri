"use client";

import { useEffect, useRef } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioRef.current) {
        const audio = new Audio("/music.mp3");
        audio.loop = true;
        audio.playbackRate = 0.85;
        audioRef.current = audio;
      }
      audioRef.current.play().catch(() => {});
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return null;
}
