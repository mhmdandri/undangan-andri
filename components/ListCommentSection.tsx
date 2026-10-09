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

      <div className="relative z-10 flex items-center justify-between px-6 pt-10">
        <div className="flex flex-col">
          <p className="text-3xl font-light tracking-wide">Wishes</p>
          <div className="mt-2 h-px w-24 bg-white/50" />
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
        className="relative z-10 mt-6 px-6 pb-24 max-h-[70dvh] overflow-y-auto space-y-6 pr-4"
      >
        {wishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-white/70">
            <p className="text-sm font-light tracking-wide">Belum ada ucapan dan doa.</p>
            <p className="mt-1.5 text-xs text-white/50">Jadilah yang pertama menuliskan ucapan di form sebelumnya!</p>
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
              className={`max-w-[85%] ${isRight ? "ml-auto" : "mr-auto"} `}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.995 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.5, ease: "easeOut" },
                },
              }}
              whileHover={{ y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div
                className={`group flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl
            bg-black/25 hover:bg-black/5 active:bg-black/5
            border border-white/15 hover:border-white/30 active:border-white/30
            backdrop-blur-[2px] hover:backdrop-blur-none active:backdrop-blur-none
            shadow-lg transition-all duration-300 cursor-pointer select-none
            ${isRight ? "flex-row-reverse text-right" : "text-left"}`}
              >
                <motion.div
                  className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold text-xs tracking-wider border border-white/20 group-hover:border-white/30 shadow-sm transition-colors
              ${
                isRight
                  ? "bg-white/10 group-hover:bg-white/5 text-white"
                  : "bg-white/15 group-hover:bg-white/5 text-white"
              }`}
                  aria-hidden="true"
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    show: {
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.45 },
                    },
                  }}
                >
                  {initials}
                </motion.div>

                <div className="min-w-0">
                  <motion.p
                    className="text-sm font-semibold italic tracking-wide text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                    variants={{
                      hidden: { x: -8, opacity: 0 },
                      show: {
                        x: 0,
                        opacity: 1,
                        transition: { duration: 0.45 },
                      },
                    }}
                  >
                    {wish.name}
                  </motion.p>

                  <motion.p
                    className="mt-1 text-sm leading-relaxed text-white/95 wrap-break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
                    variants={{
                      hidden: { opacity: 0 },
                      show: { opacity: 1, transition: { duration: 0.5 } },
                    }}
                  >
                    {wish.message}
                  </motion.p>

                  <motion.p
                    className="mt-2 text-[11px] text-white/70 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                    variants={{
                      hidden: { opacity: 0, y: 6 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                  >
                    {formatDate(wish.created_at)}
                  </motion.p>
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
