"use client";

import Image from "next/image";
import React from "react";
import { BsInstagram } from "react-icons/bs";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";

type GroomSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const GroomSection: React.FC<GroomSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full bg-black text-white overflow-hidden"
    >
      {/* Background image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/7.png"
          alt="groom"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 450px"
        />
      </motion.div>

      {/* Overlay gelap */}
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
        <div className="max-w-md space-y-3.5">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
            }}
            className="space-y-1"
          >
            <span className="inline-block text-[11px] sm:text-xs tracking-[0.3em] uppercase text-amber-300/90 font-medium">
              THE GROOM
            </span>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold font-playfair tracking-wide text-white drop-shadow-md"
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.995 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: [1.02, 0.995, 1],
                  transition: { duration: 0.8, ease: [0.2, 0.9, 0.2, 1] },
                },
              }}
            >
              Muhamad Andriyansyah, S.Kom
            </motion.h1>

            {/* Ornamen Garis Pembatas */}
            <div className="flex items-center gap-2 text-amber-200/60 pt-1" aria-hidden="true">
              <div className="h-px w-10 sm:w-14 bg-linear-to-r from-transparent to-amber-200/60" />
              <span className="text-[10px] text-amber-300">✦</span>
              <div className="h-px w-10 sm:w-14 bg-linear-to-l from-transparent to-amber-200/60" />
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
          >
            <motion.p
              className="italic text-xs sm:text-sm text-slate-300"
              variants={{
                hidden: { x: -6, opacity: 0 },
                show: { x: 0, opacity: 1, transition: { duration: 0.45 } },
              }}
            >
              Putra ke-3 dari 4 bersaudara
            </motion.p>

            <motion.div
              className="flex-1 h-px bg-linear-to-r from-amber-400/40 to-transparent translate-y-px"
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
            className="text-xs sm:text-sm text-slate-200 font-medium"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            Bapak Nana &amp; Ibu Kanah
          </motion.p>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.98 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
              },
            }}
          >
            <motion.a
              href="https://instagram.com/mhmdandri_"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/25 text-amber-200 hover:text-white px-4 py-2 text-xs font-semibold backdrop-blur-sm transition shadow-sm shadow-amber-500/10"
              whileHover={{
                scale: 1.05,
                y: -2,
                transition: { type: "spring", stiffness: 280, damping: 22 },
              }}
            >
              <BsInstagram className="text-amber-300" />
              <span>@mhmdandri_</span>
            </motion.a>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="3/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default GroomSection;
