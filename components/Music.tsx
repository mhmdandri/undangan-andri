"use client";

import { useEffect } from "react";

export default function BackgroundMusic() {
  useEffect(() => {
    const audio = new Audio("/music.mp3");
    audio.loop = true;
    audio.playbackRate = 0.85;

    const handleFirstClick = () => {
      audio.play().catch(() => {});
      window.removeEventListener("click", handleFirstClick);
    };

    window.addEventListener("click", handleFirstClick);

    return () => {
      audio.pause();
      window.removeEventListener("click", handleFirstClick);
    };
  }, []);

  return null;
}
