"use client";

import React, { useEffect } from "react";
import Image from "next/image";

type LoadingSectionProps = {
  verseRef?: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
  loading: boolean;
  progress?: number;
  finishDelay?: number;
};

const LoadingSection: React.FC<LoadingSectionProps> = ({
  verseRef,
  onNext,
  loading,
  progress = 0,
  finishDelay = 300,
}) => {
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => {
        onNext();
      }, finishDelay);
      return () => clearTimeout(t);
    }
  }, [loading, finishDelay, onNext]);

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full text-white overflow-hidden"
      aria-label="Loading screen"
    >
      <Image
        src="/media/prewed.png"
        alt="bride"
        fill
        className="object-cover"
        priority
      />

      <div className="absolute inset-0 bg-black/75" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center max-w-md mx-auto">
        <p className="uppercase tracking-[0.25em] text-sm text-white/60 mb-6">
          The Wedding Of
        </p>

        <div className="w-36 h-36 rounded-md overflow-hidden shadow-lg mb-6 border border-white/8">
          <Image
            src="/media/prewed.png"
            alt="couple thumbnail"
            width={144}
            height={144}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        <h1 className="text-2xl md:text-3xl font-light tracking-widest text-white/95 mb-12 font-alex-brush">
          <span className="block">John &amp; Jane</span>
        </h1>

        <div className="mt-8 mb-16">
          <p className="text-sm text-white/70 mb-2">LOADING…</p>
          <div className="flex items-center justify-center gap-3">
            <div
              aria-hidden
              className="h-1 w-48 bg-white/10 rounded-full overflow-hidden"
            >
              <div
                style={{ width: `${pct}%` }}
                className="h-full bg-white/90 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-white/60 mb-6 font-inter">
          Preparing your invitation - please wait a moment
        </p>
      </div>
    </section>
  );
};

export default LoadingSection;
