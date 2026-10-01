"use client";

import React, { useEffect, useRef, useState } from "react";

type LazyBackgroundVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  overlayClassName?: string;
};

const LazyBackgroundVideo: React.FC<LazyBackgroundVideoProps> = ({
  src,
  poster,
  className = "absolute inset-0 h-full w-full object-cover",
  overlayClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isIntersectingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // 1. Preload Observer: Mulai muat video saat berjarak 1200px (1-2 section sebelumnya)
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            preloadObserver.disconnect();
          }
        });
      },
      {
        rootMargin: "1200px 0px 1200px 0px",
        threshold: 0.01,
      },
    );

    // 2. Playback Observer: Play saat terlihat di layar, Pause saat keluar layar (hemat GPU & baterai)
    const playbackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersectingRef.current = entry.isIntersecting;
          const video = videoRef.current;
          if (!video) return;

          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {});
            }
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.1,
      },
    );

    preloadObserver.observe(el);
    playbackObserver.observe(el);

    return () => {
      preloadObserver.disconnect();
      playbackObserver.disconnect();
    };
  }, []);

  // Set src langsung pada elemen video dan trigger load agar browser langsung buffer tanpa delay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    if (video.getAttribute("src") !== src) {
      video.setAttribute("src", src);
      video.load();
    }
  }, [shouldLoad, src]);

  const handleCanPlay = () => {
    setIsReady(true);
    if (isIntersectingRef.current && videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none bg-black"
      aria-hidden="true"
    >
      {/* Background placeholder hangat agar tidak ada layar hitam kosong saat transisi */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ${
          isReady ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-linear-to-b from-[#181a20] via-[#101216] to-[#090a0d] flex items-center justify-center`}
      >
        <div className="w-12 h-12 rounded-full bg-white/6 animate-pulse" />
      </div>

      <video
        ref={videoRef}
        className={`${className} transition-opacity duration-700 ${
          isReady ? "opacity-100" : "opacity-0"
        }`}
        muted
        loop
        playsInline
        preload="auto"
        poster={poster}
        onLoadedData={handleCanPlay}
        onCanPlay={handleCanPlay}
        onPlaying={() => setIsReady(true)}
      />
      {overlayClassName && <div className={overlayClassName} />}
    </div>
  );
};

export default LazyBackgroundVideo;
