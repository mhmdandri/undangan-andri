"use client";

import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";
import Image from "next/image";

type VerseSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const VerseSection: React.FC<VerseSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section
      ref={verseRef}
      id="verse"
      className="relative h-dvh w-full bg-black text-white overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/6.1.png"
          alt="Andri & Cica"
          fill
          className="object-cover object-[center_18%]"
          sizes="(max-width: 768px) 100vw, 450px"
        />
      </motion.div>

      {/* Gradient halus HANYA di bagian bawah untuk teks agar foto pengantin di atas 100% jernih dan terlihat */}
      <div className="absolute inset-x-0 bottom-0 h-96 bg-linear-to-t from-black/95 via-black/60 to-transparent pointer-events-none" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.1 },
          },
        }}
        className="absolute inset-x-0 px-6 z-10 bottom-20 max-w-lg mx-auto space-y-2 text-center"
      >
        {/* Eyebrow & Title */}
        <div className="space-y-1">
          <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-amber-300 font-medium font-sans drop-shadow-md">
            AYAT SUCI AL-QUR&apos;AN
          </span>
          <h2 className="font-playfair text-lg sm:text-xl font-semibold text-white tracking-wide drop-shadow-md">
            Surah Ar-Rum : 21
          </h2>

          {/* Ornamen Garis Pembatas */}
          <div className="flex items-center justify-center gap-2 text-amber-200/60 pt-0.5" aria-hidden="true">
            <div className="h-px w-8 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[9px] text-amber-300">✦</span>
            <div className="h-px w-8 bg-linear-to-l from-transparent to-amber-200/60" />
          </div>
        </div>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
            },
          }}
          className="text-xs sm:text-sm leading-relaxed text-slate-100 text-justify italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-1"
        >
          &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan
          pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung
          dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa
          kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat
          tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.&rdquo;
        </motion.p>

        <div className="pt-0.5 flex items-center justify-between px-1">
          <span className="text-[11px] text-slate-300 font-serif drop-shadow-md">
            Doa &amp; Harapan Kami
          </span>
          <span className="font-alex-brush text-2xl sm:text-3xl text-amber-200 drop-shadow-md">
            Andri &amp; Cica
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav onNext={onNext} onPrev={onPrev} page="2/12" />
      </motion.div>
    </section>
  );
};

export default VerseSection;
