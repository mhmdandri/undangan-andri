"use client";

import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { motion } from "motion/react";
import { useState } from "react";

type FooterNavProps = {
  page: string;
  onPrev: () => void;
  onNext: () => void;
};

export default function FooterNav({ page, onPrev, onNext }: FooterNavProps) {
  const [pressed, setPressed] = useState(false);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const [isTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex w-full max-w-xs items-center justify-between">
        {/* Prev */}
        <motion.button
          onClick={onPrev}
          className="cursor-pointer text-3xl hover:text-white/60"
          whileHover={!isTouchDevice ? { scale: 1.12, x: -3 } : undefined}
          whileTap={{ scale: 0.92 }}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          animate={
            // auto-bounce ONLY on touch devices, only if user doesn't prefer reduced motion,
            // and stop when pressed
            isTouchDevice && !prefersReducedMotion && !pressed
              ? { y: [0, -4, 0] }
              : { y: 0 }
          }
          transition={
            isTouchDevice && !prefersReducedMotion
              ? {
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1.2,
                }
              : { duration: 0.2 }
          }
        >
          <BsArrowLeft />
        </motion.button>

        {/* Next */}
        <motion.button
          onClick={onNext}
          className="cursor-pointer text-3xl hover:text-white/60"
          whileHover={!isTouchDevice ? { scale: 1.12, x: 3 } : undefined}
          whileTap={{ scale: 0.92 }}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerCancel={() => setPressed(false)}
          animate={
            isTouchDevice && !prefersReducedMotion && !pressed
              ? { y: [0, -4, 0] }
              : { y: 0 }
          }
          transition={
            isTouchDevice && !prefersReducedMotion
              ? {
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 1.2,
                  delay: 0.2,
                }
              : { duration: 0.2 }
          }
        >
          <BsArrowRight />
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-xs text-white/60 font-inter"
      >
        {page}
      </motion.p>
    </motion.div>
  );
}
