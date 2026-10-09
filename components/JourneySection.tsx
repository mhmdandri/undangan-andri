"use client";

import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";
import LazyBackgroundVideo from "./LazyBackgroundVideo";

type JourneySectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const timelineData = [
  {
    period: "November 2023",
    title: "Awal Kisah",
    description:
      "Tanpa diduga, langkah kami mulai berpadu dalam irama yang sama. Komunikasi menjadi lebih hangat, kebersamaan terasa lebih dekat. Dari sekadar teman, perlahan tumbuh rasa, dan kami pun memulai sebuah hubungan.",
  },
  {
    period: "November 2024",
    title: "Niat Suci",
    description:
      "Satu tahun berlalu dengan penuh cerita dan komitmen. Pada tanggal 30 November 2024, ia menyatakan niat suci—melamarku untuk menjadi pendamping hidupnya.",
  },
  {
    period: "Februari 2025",
    title: "Pertemuan Keluarga",
    description:
      "Langkah kami semakin mantap. Pertemuan dua keluarga menjadi saksi niat baik dan restu yang kami harapkan. Lamaran pun resmi disampaikan, mempertemukan dua hati dalam ikatan keluarga.",
  },
  {
    period: "September 2025",
    title: "Menuju Ikatan Suci",
    description:
      "Kini, kami bersiap untuk menapaki babak baru sebagai suami istri. Perjalanan ini telah menjadi anugerah yang penuh makna.",
  },
];

const JourneySection: React.FC<JourneySectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section
      ref={verseRef}
      id="journey"
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* Background */}
      <LazyBackgroundVideo src="/media/2.mp4" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* CONTENT */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.25 }}
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.1 },
          },
        }}
        className="relative z-10 px-5 max-w-lg mx-auto pt-7 sm:pt-9 flex flex-col h-[calc(100dvh-5.5rem)]"
      >
        {/* Header Title */}
        <div className="space-y-1 text-center shrink-0">
          <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-amber-300 font-medium">
            OUR LOVE STORY
          </span>
          <motion.h2
            className="font-playfair text-2xl sm:text-3xl font-bold tracking-wide text-white drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.995 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.7, ease: [0.2, 0.85, 0.2, 1] },
              },
            }}
          >
            Kisah Perjalanan Cinta
          </motion.h2>

          {/* Ornamen Garis Pembatas */}
          <div
            className="flex items-center justify-center gap-2 text-amber-200/60 pt-0.5"
            aria-hidden="true"
          >
            <div className="h-px w-8 sm:w-12 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[10px] text-amber-300">✦</span>
            <div className="h-px w-8 sm:w-12 bg-linear-to-l from-transparent to-amber-200/60" />
          </div>
        </div>

        {/* Continuous Connected Vertical Timeline */}
        <motion.div
          className="flex-1 overflow-y-auto pr-1.5 custom-scroll mt-3.5 space-y-4"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          <div className="relative pl-5 ml-2.5 border-l-2 border-amber-400/40 space-y-3.5">
            {timelineData.map((item, index) => (
              <motion.div
                key={index}
                className="relative bg-black/40 border border-white/10 rounded-xl p-3.5 backdrop-blur-xs shadow-lg space-y-1.5"
                variants={{
                  hidden: { opacity: 0, x: 12 },
                  show: {
                    opacity: 1,
                    x: 0,
                    transition: { duration: 0.5, ease: "easeOut" },
                  },
                }}
              >
                {/* Node dot on the continuous vertical line */}
                <div
                  className="absolute -left-7 top-3.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-black ring-4 ring-amber-400/25 shadow-sm"
                  aria-hidden="true"
                />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300 text-[11px] sm:text-xs tracking-wider uppercase font-mono">
                    {item.period}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">
                    {item.title}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-100 text-justify">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="5/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default JourneySection;
