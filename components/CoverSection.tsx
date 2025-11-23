"use client";

import Link from "next/link";
import React from "react";

type CoverSectionProps = {
  onOpen: () => void;
  guestName?: string;
};

const CoverSection: React.FC<CoverSectionProps> = ({ onOpen, guestName }) => {
  return (
    <main className="relative flex min-h-screen w-full items-stretch justify-center overflow-hidden bg-black">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/media/vid1.png"
      >
        <source src="/media/vid1.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60" aria-hidden />

      <div className="relative z-10 flex min-h-screen w-full max-w-md flex-col items-center justify-between py-10 text-white">
        {/* Title */}
        <section className="w-full text-center tracking-[0.35em] text-white/70">
          <p className="text-xs uppercase">THE WEDDING OF</p>
          <h1 className="mt-6 text-4xl font-semibold tracking-normal">
            John &amp; Jane
          </h1>
          <p className="mt-4 text-sm tracking-[0.35em] text-white/80">
            SELASA, 30 SEPTEMBER 2025
          </p>
        </section>

        {/* Kepada Yth */}
        <section className="flex w-full flex-col items-center gap-4 text-center text-white/80">
          <p className="italic text-lg tracking-wide">Kepada</p>
          <p className="text-2xl font-medium leading-snug">
            {guestName ? guestName : "Tamu Undangan"}
          </p>
          <Link
            href="#"
            onClick={onOpen}
            className="rounded-full bg-white/50 px-8 py-3 text-sm font-medium uppercase tracking-[0.3em] text-black transition hover:bg-white/60"
          >
            OPEN INVITATION
          </Link>
        </section>

        {/* Footer kecil */}
        <div className="text-xs uppercase tracking-[0.5em] text-white/60">
          mohaproject
        </div>
      </div>
    </main>
  );
};

export default CoverSection;
