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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      {
        rootMargin: "300px 0px 300px 0px", // Mulai preload saat berjarak 300px
        threshold: 0.05,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        preload={shouldLoad ? "auto" : "none"}
        poster={poster}
      >
        {shouldLoad && <source src={src} type="video/mp4" />}
      </video>
      {overlayClassName && <div className={overlayClassName} />}
    </div>
  );
};

export default LazyBackgroundVideo;
