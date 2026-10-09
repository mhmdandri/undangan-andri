"use client";
import React from "react";
import { BsArrowDown } from "react-icons/bs";
import { PiFlowerTulipThin } from "react-icons/pi";
import { motion } from "motion/react";
import Image from "next/image";

type HeroSectionProps = {
  heroRef: React.RefObject<HTMLDivElement | null>;
  onScrollDown: () => void;
};

const HeroSection: React.FC<HeroSectionProps> = ({ heroRef, onScrollDown }) => {
  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex h-dvh w-full items-center justify-center bg-black text-white overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/2.JPG"
          alt="hero"
          fill
          className="object-cover object-[54%_center]"
          priority
        />
      </motion.div>

      <div className="absolute inset-0 bg-black/60" aria-hidden />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.7,
              ease: "easeOut",
              when: "beforeChildren",
              staggerChildren: 0.12,
            },
          },
        }}
        className="relative z-10 max-w-md text-center space-y-6"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
          }}
          className="mx-auto h-12 w-12 rounded-full border border-amber-400/40 bg-amber-500/10 flex items-center justify-center shadow-lg shadow-amber-500/10"
        >
          <PiFlowerTulipThin className="text-2xl text-amber-300" />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
          className="space-y-3"
        >
          <span className="inline-block text-[11px] sm:text-xs tracking-[0.3em] uppercase text-amber-300/90 font-medium">
            THE WEDDING OF
          </span>

          <motion.h2
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.65 } },
            }}
            className="text-5xl sm:text-6xl font-semibold font-alex-brush text-white drop-shadow-xl"
          >
            Andri &amp; Cica
          </motion.h2>

          {/* Ornamen Garis Pembatas */}
          <div className="flex items-center justify-center gap-2.5 text-amber-200/60" aria-hidden="true">
            <div className="h-px w-10 sm:w-14 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[10px] text-amber-300">✦</span>
            <div className="h-px w-10 sm:w-14 bg-linear-to-l from-transparent to-amber-200/60" />
          </div>

          <p className="text-xs sm:text-sm tracking-[0.35em] text-white/80 font-medium uppercase">
            SABTU, 21 NOVEMBER 2026
          </p>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
          }}
          className="pt-2"
        >
          <motion.button
            onClick={onScrollDown}
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white transition shadow-lg shadow-amber-500/20 cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            title="Gulir ke bawah"
          >
            <span className="text-xl">
              <BsArrowDown />
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
