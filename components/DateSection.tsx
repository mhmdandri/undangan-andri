"use client";

import React, { useEffect, useState } from "react";
import FooterNav from "./FooterNav";
import { LuCalendarPlus } from "react-icons/lu";
import { motion } from "motion/react";
import LazyBackgroundVideo from "./LazyBackgroundVideo";

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
    const target = new Date("2026-11-21T07:00:00").getTime();

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
      {/* Background Video */}
      <LazyBackgroundVideo src="/media/3.mp4" />

      {/* Gradient halus HANYA di bagian bawah agar muka pengantin di bagian atas/tengah 100% terlihat jelas */}
      <div className="absolute inset-x-0 bottom-0 h-[460px] bg-linear-to-t from-black/95 via-black/70 to-transparent pointer-events-none" />

      {/* Konten Countdown diposisikan di bagian bawah agar tidak menutupi wajah mempelai wanita */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.35 }}
        variants={{
          hidden: { opacity: 0, y: 16 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.1 },
          },
        }}
        className="absolute inset-x-0 bottom-30 z-10 flex flex-col items-center px-5 text-center max-w-sm sm:max-w-md mx-auto space-y-3"
      >
        {/* Title */}
        <div className="space-y-0.5">
          <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-amber-300 font-medium font-sans drop-shadow-md">
            M E N U J U &nbsp; H A R I &nbsp; B A H A G I A
          </span>

          <motion.h2
            className="text-3xl sm:text-4xl font-semibold tracking-wide font-alex-brush text-white drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
          >
            Andri &amp; Cica
          </motion.h2>

          {/* Ornamen Garis Pembatas */}
          <div
            className="flex items-center justify-center gap-2 text-amber-200/60 pt-0.5"
            aria-hidden="true"
          >
            <div className="h-px w-8 sm:w-12 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[10px] text-amber-300">✦</span>
            <div className="h-px w-8 sm:w-12 bg-linear-to-l from-transparent to-amber-200/60" />
          </div>
        </div>

        {/* COUNTDOWN TILES */}
        <motion.div
          className="w-full flex justify-center gap-2 sm:gap-3"
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
              className="flex-1 py-2.5 sm:py-3 bg-black/50 border border-amber-500/25 rounded-xl backdrop-blur-xs shadow-xl text-center"
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
              <p className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tracking-wide">
                {String(item.value).padStart(2, "0")}
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-300 uppercase tracking-wider mt-0.5 font-medium">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Save the date button (Google Calendar) */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
          className="w-full pt-0.5"
        >
          <a
            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=The+Wedding+of+Andri+%26+Cica&dates=20261121T020000Z/20261121T090000Z&details=Pernikahan+Andri+%26+Cica&location=Jl.+Turi+Jaya+Gang+IV+No+1+Sagara+Makmur+Kec.+Tarumajaya+Kab.+Bekasi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-6 rounded-full bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-xl shadow-amber-500/25 transition active:scale-95"
          >
            <LuCalendarPlus className="w-4 h-4" />
            <span>SIMPAN KE KALENDER</span>
          </a>
        </motion.div>
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
