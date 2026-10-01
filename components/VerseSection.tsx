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

      {/* Overlay: hanya di bagian bawah teks, wajah pengantin 100% natural tanpa lapisan gelap */}
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.14 },
          },
        }}
        className="absolute inset-x-0 px-6 space-y-3 z-10 bottom-20"
      >
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 8, scale: 0.995 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.5, ease: "easeOut" },
            },
          }}
          className="text-base tracking-[0.1rem] uppercase text-white/90 text-left font-medium"
        >
          Q.S. AR-RUM : 21
        </motion.p>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] },
            },
          }}
          className="text-xs sm:text-sm leading-relaxed text-white/90 text-justify"
        >
          “Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan
          pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung
          dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa
          kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat
          tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.”
        </motion.p>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
          }}
          className="text-base text-white/80"
        >
          Andri &amp; Cica
        </motion.p>
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
