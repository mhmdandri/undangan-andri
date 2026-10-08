"use client";

import { useEffect, useRef } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/music.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.playbackRate = 0.85;
    audioRef.current = audio;

    const startMusic = () => {
      audio.currentTime = 2;
      audio.play().then(cleanup).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          return;
        }
        console.error("Failed to start background music", error);
      });
    };

    const cleanup = () => {
      window.removeEventListener("click", startMusic);
      window.removeEventListener("touchstart", startMusic);
      window.removeEventListener("keydown", startMusic);
    };

    window.addEventListener("click", startMusic, { passive: true });
    window.addEventListener("touchstart", startMusic, { passive: true });
    window.addEventListener("keydown", startMusic, { passive: true });

    startMusic();

    return () => {
      cleanup();
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  return null;
}
