"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import FooterNav from "./FooterNav";
import { BsArrowRight } from "react-icons/bs";
import { motion } from "motion/react";

type DateSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const DateSection: React.FC<DateSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date("2026-03-30T07:00:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        <source src="/media/vid2.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.12 },
          },
        }}
        className="relative z-10 flex flex-col items-center pt-32 px-6 text-center max-w-2xl mx-auto"
      >
        {/* Foto kecil */}
        <motion.div
          className="relative w-28 h-28 mb-6 rounded-md overflow-hidden shadow-lg"
          variants={{
            hidden: { opacity: 0, scale: 0.9 },
            show: {
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 220, damping: 20 },
            },
          }}
        >
          <Image
            src="/media/pemeran2.png"
            fill
            sizes="112px"
            className="object-cover"
            alt="couple thumbnail"
            priority
          />
        </motion.div>

        <motion.div
          className="space-y-2"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
          }}
        >
          <motion.h1
            className="text-2xl md:text-4xl font-light tracking-[0.12em] text-white/90"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] },
              },
            }}
          >
            THE WEDDING OF
          </motion.h1>

          <motion.h1
            className="text-3xl md:text-4xl font-light tracking-wide font-alex text-white/95 font-alex-brush"
            variants={{
              hidden: { opacity: 0, y: 12, scale: 0.996 },
              show: {
                opacity: 1,
                y: 0,
                scale: [1.02, 0.995, 1],
                transition: { duration: 0.9, ease: [0.2, 0.85, 0.2, 1] },
              },
            }}
          >
            John &amp; Jane
          </motion.h1>
        </motion.div>

        {/* COUNTDOWN */}
        <motion.div
          className="w-full flex justify-center gap-3 md:gap-6 mt-4 font-inter"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
          }}
        >
          {[
            { label: "Hari", value: timeLeft.days },
            { label: "Jam", value: timeLeft.hours },
            { label: "Menit", value: timeLeft.minutes },
            { label: "Detik", value: timeLeft.seconds },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="w-20 md:w-24 py-4 bg-white/15 backdrop-blur-md rounded-xl shadow-sm"
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.45, ease: "easeOut" },
                },
              }}
            >
              <p className="text-2xl md:text-3xl font-semibold tracking-wide">
                {String(item.value).padStart(2, "0")}
              </p>
              <p className="text-xs text-white/80 mt-1 tracking-wide">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Save the date button */}
        <motion.button
          className="font-inter flex items-center gap-2 mt-8 border border-white px-8 py-3 rounded-full text-sm tracking-wide hover:bg-white hover:text-black transition font-semibold shadow-sm"
          variants={{
            hidden: { opacity: 0, y: 12, scale: 0.98 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 2.2 },
            },
          }}
          whileHover={{
            scale: 1.03,
            y: -3,
            transition: { type: "spring", stiffness: 300, damping: 20 },
          }}
          whileTap={{ scale: 0.97 }}
        >
          <p>SAVE THE DATE</p>
          <BsArrowRight className="w-5 h-5 self-center" />
        </motion.button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="7/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default DateSection;
