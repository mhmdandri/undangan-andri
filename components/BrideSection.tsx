"use client";

import Image from "next/image";
import React from "react";
import { BsInstagram } from "react-icons/bs";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";

type BrideSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const BrideSection: React.FC<BrideSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full bg-black text-white"
    >
      {/* Background image */}
      <Image
        src="/media/pemeran2.png"
        alt="bride"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay Dark */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT*/}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.45 }}
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.12 },
          },
        }}
        className="absolute inset-x-0 bottom-24 z-10 px-6"
      >
        <div className="max-w-md space-y-4">
          <motion.p
            className="text-xs tracking-[0.35em] uppercase text-white/70"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
            }}
          >
            THE BRIDE
          </motion.p>

          <motion.h1
            className="text-4xl md:text-5xl font-light font-alex-brush"
            variants={{
              hidden: { opacity: 0, y: 12, scale: 0.996 },
              show: {
                opacity: 1,
                y: 0,
                scale: [1.02, 0.995, 1],
                transition: { duration: 0.8, ease: [0.2, 0.9, 0.2, 1] },
              },
            }}
          >
            Jane Doe
          </motion.h1>

          <motion.div
            className="flex items-center gap-4"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
          >
            <motion.p
              className="italic text-sm text-white/80"
              variants={{
                hidden: { x: -6, opacity: 0 },
                show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
              }}
            >
              Putra ke 1 dari 2
            </motion.p>

            <motion.div
              className="flex-1 border-t border-white/40 translate-y-px"
              variants={{
                hidden: {
                  scaleX: 0,
                  opacity: 0,
                  transformOrigin: "left center",
                },
                show: {
                  scaleX: 1,
                  opacity: 1,
                  transition: { duration: 0.55, ease: "easeOut" },
                },
              }}
              style={{ transformOrigin: "left center" }}
              aria-hidden
            />
          </motion.div>

          <motion.p
            className="text-sm text-white/80"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            Bapak John Cena dan Ibu Jane Cena
          </motion.p>

          <motion.a
            href="https://instagram.com/ULINNUHA42"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm hover:bg-white/20 transition"
            variants={{
              hidden: { opacity: 0, y: 12, scale: 0.98 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 2.2, ease: [0.2, 0.8, 0.2, 1] },
              },
            }}
            whileHover={{
              scale: 1.06,
              y: -3,
              transition: { type: "spring", stiffness: 300, damping: 22 },
            }}
            whileTap={{
              scale: 0.96,
              transition: { type: "spring", stiffness: 400, damping: 30 },
            }}
          >
            <span>
              <BsInstagram />
            </span>
            <span>janedoe1</span>
          </motion.a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="4/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default BrideSection;
