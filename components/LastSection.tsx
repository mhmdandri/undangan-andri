"use client";
import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";

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
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      >
        <source src="/media/road.mp4" type="video/mp4" />
      </video>

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
        className="relative z-10 flex items-center min-h-screen"
      >
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          {/* Title */}
          <motion.h2
            className="font-playfair text-4xl md:text-5xl font-semibold tracking-wide text-white/95 mb-4"
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
            Thank You!
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-sm md:text-base text-white/80 leading-relaxed"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            We appreciate your presence and support on our special day. Looking
            forward to celebrating together!
          </motion.p>

          {/* Divider */}
          <motion.div
            className="mt-10 h-px w-28 bg-white/20 mx-auto"
            variants={{
              hidden: { scaleX: 0, opacity: 0 },
              show: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.6, ease: "easeOut" },
              },
            }}
            style={{ transformOrigin: "center" }}
          />

          {/* Names */}
          <motion.div
            className="mt-4 font-alex-brush font-semibold text-3xl"
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
            John & Jane
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
