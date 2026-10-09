"use client";
import React from "react";
import FooterNav from "./FooterNav";
import { formatDate } from "@/utils/format";
import { motion } from "motion/react";
import LazyBackgroundVideo from "./LazyBackgroundVideo";

type ListCommentSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
  data?: Wish[];
};
type Wish = {
  name: string;
  message: string;
  created_at: string;
};

const ListCommentSection: React.FC<ListCommentSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
  data,
}) => {
  const wishes = data ?? [];
  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* Background */}
      <LazyBackgroundVideo src="/media/5.mp4" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 px-5 pt-8 max-w-lg mx-auto">
        <div className="space-y-1 text-center sm:text-left">
          <span className="inline-block text-[11px] sm:text-xs tracking-[0.3em] uppercase text-amber-300/90 font-medium font-sans">
            W I S H E S &nbsp; &amp; &nbsp; P R A Y E R S
          </span>
          <h2 className="font-playfair text-2xl sm:text-3xl font-bold tracking-wide text-white drop-shadow-md">
            Doa &amp; Ucapan Tamu
          </h2>

          {/* Ornamen Garis Pembatas */}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-200/60 pt-1" aria-hidden="true">
            <div className="h-px w-10 sm:w-14 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[10px] text-amber-300">✦</span>
            <div className="h-px w-10 sm:w-14 bg-linear-to-l from-transparent to-amber-200/60" />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.2 }}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        className="relative z-10 mt-4 px-5 pb-24 max-h-[68dvh] overflow-y-auto space-y-3.5 custom-scroll max-w-lg mx-auto"
      >
        {wishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-white/70 bg-black/30 border border-white/10 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-300">Belum ada ucapan dan doa.</p>
            <p className="mt-1 text-xs text-slate-400">Jadilah yang pertama menuliskan ucapan di form sebelumnya!</p>
          </div>
        ) : (
          wishes.map((wish, idx) => {
            const isRight = idx % 2 !== 0;

            // ambil inisial nama untuk avatar
            const initials = (wish.name || "A")
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <motion.div
                key={idx}
                className={`max-w-[92%] sm:max-w-[85%] ${isRight ? "ml-auto" : "mr-auto"}`}
                variants={{
                  hidden: { opacity: 0, y: 12, scale: 0.995 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.5, ease: "easeOut" },
                  },
                }}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
              >
                <div
                  className={`group flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl
              bg-black/35 hover:bg-black/45
              border border-white/12 hover:border-amber-400/30
              backdrop-blur-[2px]
              shadow-lg transition-all duration-300 select-none
              ${isRight ? "flex-row-reverse text-right" : "text-left"}`}
                >
                  <div
                    className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs tracking-wider bg-linear-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold tracking-wide text-amber-200">
                      {wish.name}
                    </p>

                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-white/90 wrap-break-words">
                      {wish.message}
                    </p>

                    <p className="mt-1.5 text-[10px] text-slate-400 font-mono">
                      {formatDate(wish.created_at)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="9/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default ListCommentSection;
