"use client";
import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";

type EventSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const EventSection: React.FC<EventSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section
      ref={verseRef}
      id="event"
      className="relative h-dvh w-full text-white"
    >
      {/* Background image */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/media/vid2.mp4" type="video/mp4" />
      </video>

      {/* Overlay gelap */}
      <div className="absolute inset-0 bg-black/45" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.35 }}
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.12 },
          },
        }}
        className="relative z-10 px-6 pt-10 max-w-xl space-y-4 text-white/90"
      >
        <motion.div
          className="space-y-2"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
          }}
        >
          <motion.p
            className="text-xs tracking-[0.25em] uppercase text-white/70"
            variants={{
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
            }}
          >
            Selasa
          </motion.p>

          <motion.h1
            className="font-playfair text-4xl md:text-5xl leading-tight tracking-wide"
            variants={{
              hidden: { opacity: 0, y: 12, scale: 0.996 },
              show: {
                opacity: 1,
                y: 0,
                scale: [1.02, 0.997, 1],
                transition: { duration: 0.9, ease: [0.2, 0.85, 0.2, 1] },
              },
            }}
          >
            30 September 2025
          </motion.h1>
        </motion.div>

        <motion.div
          className="h-px bg-white/20"
          aria-hidden
          variants={{
            hidden: { scaleX: 0, opacity: 0, transformOrigin: "left center" },
            show: {
              scaleX: 1,
              opacity: 1,
              transition: { duration: 0.55, ease: "easeOut" },
            },
          }}
          style={{ transformOrigin: "left center" }}
        />
        <motion.div
          className="space-y-2 font-playfair"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
        >
          <motion.p
            className="text-[11px] tracking-[0.18em] uppercase text-white/70"
            variants={{
              hidden: { x: -8, opacity: 0 },
              show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
            }}
          >
            Akad Nikah
          </motion.p>

          <motion.p
            className="text-base font-medium"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
          >
            07.00 WIB
          </motion.p>

          <motion.p
            className="text-base font-semibold"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
          >
            Balai Kota Bikini Bottom
          </motion.p>

          <motion.p
            className="text-sm leading-relaxed text-white/75"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            Jl. Raya Pantai No.123, Desa Laut, Kec. Samudra, Kota Bikini Bottom
          </motion.p>

          <motion.button
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white/90 px-5 py-2 text-xs font-semibold text-black tracking-wide shadow-sm hover:bg-white"
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.98 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.55, ease: "easeOut" },
              },
            }}
            whileHover={{
              scale: 1.02,
              y: -3,
              transition: { type: "spring", stiffness: 280, damping: 20 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            Lihat Lokasi
          </motion.button>
        </motion.div>

        <motion.div
          className="h-px bg-white/20"
          aria-hidden
          variants={{
            hidden: { scaleX: 0, opacity: 0, transformOrigin: "left center" },
            show: {
              scaleX: 1,
              opacity: 1,
              transition: { duration: 0.55, ease: "easeOut", delay: 0.05 },
            },
          }}
          style={{ transformOrigin: "left center" }}
        />
        <motion.div
          className="space-y-2 font-playfair"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0.06 },
            },
          }}
        >
          <motion.p
            className="text-[11px] tracking-[0.18em] uppercase text-white/70"
            variants={{
              hidden: { x: -8, opacity: 0 },
              show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
            }}
          >
            Resepsi Pernikahan
          </motion.p>

          <motion.p
            className="text-base font-medium"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
          >
            13.00 – 15.00 WIB
          </motion.p>

          <motion.p
            className="text-base font-semibold"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
          >
            Balai Kota Bikini Bottom
          </motion.p>

          <motion.p
            className="text-sm leading-relaxed text-white/75"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.5 } },
            }}
          >
            Jl. Raya Pantai No.123, Desa Laut, Kec. Samudra, Kota Bikini Bottom
          </motion.p>

          <motion.button
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white/90 px-5 py-2 text-xs font-semibold text-black tracking-wide shadow-sm hover:bg-white"
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.98 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.55, ease: "easeOut" },
              },
            }}
            whileHover={{
              scale: 1.02,
              y: -3,
              transition: { type: "spring", stiffness: 280, damping: 20 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            Lihat Lokasi
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="6/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default EventSection;
