"use client";
import React from "react";
import { BsArrowDown } from "react-icons/bs";
import { PiFlowerTulipThin } from "react-icons/pi";
import { motion } from "motion/react";

type HeroSectionProps = {
  heroRef: React.RefObject<HTMLDivElement | null>;
  onScrollDown: () => void;
};

const HeroSection: React.FC<HeroSectionProps> = ({ heroRef, onScrollDown }) => {
  return (
    <section
      ref={heroRef}
      className="relative flex h-dvh w-full items-center justify-center bg-black text-white"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      >
        <source src="/media/vid2.mp4" type="video/mp4" />
      </video>

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
          className="mx-auto h-10 w-10 rounded-full border border-white/40 flex items-center justify-center"
        >
          <PiFlowerTulipThin className="text-2xl text-white/80" />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
          className="tracking-[0.35em] text-white/70 text-xs"
        >
          THE WEDDING OF
        </motion.div>

        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.65 } },
          }}
          className="text-4xl font-semibold font-alex-brush"
        >
          John &amp; Jane
        </motion.h2>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
          }}
          className="text-sm tracking-[0.35em] text-white/80"
        >
          SELASA, 30 SEPTEMBER 2025
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
          }}
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/40"
        >
          <motion.button
            onClick={onScrollDown}
            className="hover:bg-transparent hover:text-white cursor-pointer"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <span className="text-2xl">
              <BsArrowDown />
            </span>
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
