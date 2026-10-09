"use client";
import React from "react";
import FooterNav from "./FooterNav";
import { motion } from "motion/react";
import LazyBackgroundVideo from "./LazyBackgroundVideo";
import { LuClock, LuMapPin } from "react-icons/lu";

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
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* Background video */}
      <LazyBackgroundVideo
        src="/media/4.mp4"
        className="absolute inset-0 h-full w-full object-cover object-[1%_center]"
      />

      {/* Gradient halus HANYA di bagian bawah agar muka pengantin di bagian atas/tengah 100% terlihat jelas */}
      <div className="absolute inset-x-0 bottom-0 h-[480px] bg-linear-to-t from-black/95 via-black/75 to-transparent pointer-events-none" />

      {/* Konten Acara ditempatkan di bagian bawah agar tidak menutupi wajah mempelai wanita */}
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
        className="absolute inset-x-0 bottom-20 z-10 px-5 max-w-lg mx-auto space-y-3"
      >
        {/* Header Title */}
        <div className="text-center space-y-0.5">
          <span className="inline-block text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-amber-300 font-medium font-sans drop-shadow-md">
            W E D D I N G &nbsp; E V E N T
          </span>

          <motion.h2
            className="font-playfair text-xl sm:text-2xl font-bold tracking-wide text-white drop-shadow-md"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
          >
            Sabtu, 21 November 2026
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

        {/* 2-Column Grid Jadwal Akad & Resepsi */}
        <motion.div
          className="grid grid-cols-2 gap-2.5"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          {/* Box Akad Nikah */}
          <div className="bg-black/50 border border-white/12 rounded-xl p-3 backdrop-blur-xs shadow-lg space-y-1 text-center">
            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
              Akad Nikah
            </span>
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-200 font-mono font-medium pt-0.5">
              <LuClock className="w-3.5 h-3.5 text-amber-400" />
              <span>09.00 WIB</span>
            </div>
          </div>

          {/* Box Resepsi Pernikahan */}
          <div className="bg-black/50 border border-white/12 rounded-xl p-3 backdrop-blur-xs shadow-lg space-y-1 text-center">
            <span className="inline-block px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300 text-[10px] font-semibold uppercase tracking-wider">
              Resepsi
            </span>
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-200 font-mono font-medium pt-0.5">
              <LuClock className="w-3.5 h-3.5 text-amber-400" />
              <span>11.00 WIB – Selesai</span>
            </div>
          </div>
        </motion.div>

        {/* Location & Maps Button Box */}
        <motion.div
          className="bg-black/50 border border-white/12 rounded-xl p-3 backdrop-blur-xs shadow-lg space-y-2 text-center"
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
          }}
        >
          <div>
            <h3 className="font-playfair text-sm sm:text-base font-bold text-white">
              Turi Jaya Gang IV
            </h3>
            <p className="text-[11px] sm:text-xs leading-relaxed text-slate-300">
              Jl. Turi Jaya Gang IV No 1, Sagara Makmur, Kec. Tarumajaya, Kab. Bekasi
            </p>
          </div>

          <a
            href="https://maps.google.com/?q=Jl.+Turi+Jaya+Gang+IV+No+1+Sagara+Makmur+Kec.+Tarumajaya+Kab.+Bekasi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-wider uppercase shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <LuMapPin className="w-3.5 h-3.5" />
            <span>Petunjuk Lokasi (Google Maps)</span>
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
        <FooterNav page="6/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default EventSection;
