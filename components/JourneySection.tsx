"use client";

import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";

type JourneySectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const JourneySection: React.FC<JourneySectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section ref={verseRef} className="relative h-dvh w-full text-white">
      {/* Background */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/media/road.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT (Kiri Atas) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.35 }}
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.14 },
          },
        }}
        className="relative z-10 px-6 max-w-xl pt-10 space-y-4"
      >
        {/* Title */}
        <motion.h1
          className="text-3xl font-semibold tracking-[0.08em] text-white/95 font-alex-brush"
          variants={{
            hidden: { opacity: 0, y: 12, scale: 0.995 },
            show: {
              opacity: 1,
              y: 0,
              scale: [1.02, 0.997, 1],
              transition: { duration: 0.8, ease: [0.2, 0.85, 0.2, 1] },
            },
          }}
        >
          OUR JOURNEY
        </motion.h1>

        {/* Scroll Area */}
        <motion.div
          className="max-h-[70dvh] overflow-y-auto pr-2 custom-scroll space-y-6 text-[15px] leading-relaxed text-white/85"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.12 } },
          }}
        >
          {/* ITEM 1 */}
          <motion.div
            className="space-y-1"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            <motion.p
              className="text-lg font-semibold tracking-wide text-white/95"
              variants={{
                hidden: { x: -8, opacity: 0 },
                show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
              }}
            >
              November 2023
            </motion.p>
            <motion.p
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.5 } },
              }}
            >
              Tanpa diduga, langkah kami mulai berpadu dalam irama yang sama.
              Komunikasi menjadi lebih hangat, kebersamaan terasa lebih dekat.
              Dari sekadar teman, perlahan tumbuh rasa, dan kami pun memulai
              sebuah hubungan.
            </motion.p>
          </motion.div>

          <motion.div
            className="h-px w-full bg-white/20"
            aria-hidden
            variants={{
              hidden: { scaleX: 0, opacity: 0, transformOrigin: "left center" },
              show: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.5, ease: "easeOut" },
              },
            }}
            style={{ transformOrigin: "left center" }}
          />

          {/* ITEM 2 */}
          <motion.div
            className="space-y-1"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            <motion.p
              className="text-lg font-semibold tracking-wide text-white/95"
              variants={{
                hidden: { x: -8, opacity: 0 },
                show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
              }}
            >
              November 2024
            </motion.p>
            <motion.p
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.5 } },
              }}
            >
              Satu tahun berlalu dengan penuh cerita dan komitmen. Pada tanggal
              30 November 2024, ia menyatakan niat suci—melamarku untuk menjadi
              pendamping hidupnya.
            </motion.p>
          </motion.div>

          <motion.div
            className="h-px w-full bg-white/20"
            aria-hidden
            variants={{
              hidden: { scaleX: 0, opacity: 0, transformOrigin: "left center" },
              show: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.5, ease: "easeOut", delay: 0.05 },
              },
            }}
            style={{ transformOrigin: "left center" }}
          />

          {/* ITEM 3 */}
          <motion.div
            className="space-y-1"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            <motion.p
              className="text-lg font-semibold tracking-wide text-white/95"
              variants={{
                hidden: { x: -8, opacity: 0 },
                show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
              }}
            >
              Februari 2025
            </motion.p>
            <motion.p
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.5 } },
              }}
            >
              Langkah kami semakin mantap. Pertemuan dua keluarga menjadi saksi
              niat baik dan restu yang kami harapkan. Lamaran pun resmi
              disampaikan, mempertemukan dua hati dalam ikatan keluarga.
            </motion.p>
          </motion.div>

          <motion.div
            className="h-px w-full bg-white/20"
            aria-hidden
            variants={{
              hidden: { scaleX: 0, opacity: 0, transformOrigin: "left center" },
              show: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.5, ease: "easeOut", delay: 0.08 },
              },
            }}
            style={{ transformOrigin: "left center" }}
          />

          {/* ITEM 4 */}
          <motion.div
            className="space-y-1"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            <motion.p
              className="text-lg font-semibold tracking-wide text-white/95"
              variants={{
                hidden: { x: -8, opacity: 0 },
                show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
              }}
            >
              September 2025
            </motion.p>
            <motion.p
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.5 } },
              }}
            >
              Kini, kami bersiap untuk menapaki babak baru sebagai suami istri.
              Perjalanan ini telah menjadi anugerah yang penuh makna.
            </motion.p>
          </motion.div>
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
