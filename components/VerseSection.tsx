"use client";

import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";

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
      className="relative h-dvh w-full bg-black text-white"
    >
      {/* Background Video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/media/vid3.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

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
        className="absolute inset-x-0 px-6 space-y-6 z-10 bottom-24"
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
          className="text-lg tracking-[0.1rem] uppercase text-white/90 text-left"
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
          className="text-sm leading-5 text-white/90 text-left"
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
          John &amp; Jane
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
