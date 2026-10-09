"use client";
import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";
import LazyBackgroundVideo from "./LazyBackgroundVideo";

type LastSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const LastSection: React.FC<LastSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* Background */}
      <LazyBackgroundVideo src="/media/road.mp4" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT (animated) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.35 }}
        variants={{
          hidden: { opacity: 0, y: 28 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.65,
              ease: "easeOut",
              when: "beforeChildren",
              staggerChildren: 0.12,
            },
          },
        }}
        className="relative z-10 flex items-center min-h-screen px-4"
      >
        <div className="mx-auto max-w-md w-full px-6 py-8 text-center bg-black/35 border border-white/12 rounded-3xl backdrop-blur-[2px] shadow-2xl space-y-4">
          {/* Eyebrow */}
          <span className="inline-block text-[11px] sm:text-xs tracking-[0.3em] uppercase text-amber-300/90 font-medium font-sans">
            U N G K A P A N &nbsp; T E R I M A &nbsp; K A S I H
          </span>

          {/* Title */}
          <motion.h2
            className="font-playfair text-3xl sm:text-4xl font-bold tracking-wide text-white drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.97 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.7, ease: [0.18, 0.8, 0.3, 1] },
              },
            }}
          >
            Terima Kasih
          </motion.h2>

          {/* Ornamen Garis Pembatas */}
          <div className="flex items-center justify-center gap-2 text-amber-200/60" aria-hidden="true">
            <div className="h-px w-10 sm:w-14 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[10px] text-amber-300">✦</span>
            <div className="h-px w-10 sm:w-14 bg-linear-to-l from-transparent to-amber-200/60" />
          </div>

          {/* Description */}
          <motion.p
            className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-sm mx-auto"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu kepada kami.
          </motion.p>

          <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed italic">
            Semoga Allah SWT senantiasa melimpahkan berkah dan rahmat-Nya bagi kita semua.
          </p>

          {/* Names */}
          <motion.div
            className="pt-2 font-alex-brush font-semibold text-3xl sm:text-4xl text-amber-200"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.65,
                  ease: [0.16, 0.6, 0.25, 1],
                },
              },
            }}
          >
            Andri &amp; Cica
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute bottom-20 inset-x-0 text-center text-xs text-white/70 tracking-wide z-10"
      >
        © mohaproject
      </motion.p>

      {/* FOOTER NAV */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="12/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default LastSection;
