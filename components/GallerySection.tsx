"use client";

import React, { useState, useRef } from "react";
import FooterNav from "./FooterNav";
import Image from "next/image";
import { motion } from "motion/react";

type GallerySectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const images = [
  "/media/pemeran1.png",
  "/media/pemeran2.png",
  "/media/pemeran5.png",
  "/media/pemeran6.png",
  "/media/pemeran7.png",
];

const GallerySection: React.FC<GallerySectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  const [index, setIndex] = useState(0);
  const startX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    if (startX.current - endX > 50) handleNext();
    if (endX - startX.current > 50) handlePrev();
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full text-white overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* BACKGROUND VIDEO */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
      >
        <source src="/media/road.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/45" />

      {/* CAROUSEL*/}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.35 }}
        variants={{
          hidden: { opacity: 0, y: 40 },
          show: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: "easeOut",
              staggerChildren: 0.1,
            },
          },
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Our Gallery"
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6"
      >
        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
          }}
          className="text-3xl md:text-4xl font-light mb-8 text-center"
        >
          Our Gallery
        </motion.h2>
        <div
          className="relative w-full max-w-xl overflow-hidden rounded-xl"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "ArrowRight") handleNext();
          }}
        >
          <div className="aspect-video md:aspect-video w-full relative bg-black/10">
            <motion.div
              className="absolute inset-0 flex will-change-transform"
              animate={{ x: `-${index * 100}%` }}
              variants={{
                hidden: { opacity: 0, scale: 0.96 },
                show: {
                  opacity: 1,
                  scale: 1,
                  transition: { duration: 0.8, ease: "easeOut" },
                },
              }}
              transition={{
                x: { type: "spring", stiffness: 120, damping: 20 },
              }}
            >
              {images.map((src, i) => (
                <motion.div
                  key={i}
                  className="w-full shrink-0 relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: index === i ? 1 : 0.6 }}
                  transition={{ duration: 0.6 }}
                >
                  <Image
                    src={src}
                    alt={`Gallery image ${i + 1}`}
                    fill
                    className="object-cover rounded-xl"
                    sizes="(max-width: 768px) 100vw, 800px"
                    priority={i === 0}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
          <motion.button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            whileHover={{ scale: 1.2, y: -3 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
            className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/20 backdrop-blur-md rounded-full p-2 text-lg hover:bg-white/30"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
          </motion.button>
          <motion.button
            type="button"
            onClick={handleNext}
            aria-label="Previous slide"
            whileHover={{ scale: 1.2, y: -3 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 250, damping: 15 }}
            className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/20 backdrop-blur-md rounded-full p-2 text-lg hover:bg-white/30"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6l6 6-6 6"
              />
            </svg>
          </motion.button>
        </div>

        <div
          className="flex gap-2 mt-4"
          role="tablist"
          aria-label="Slide indicators"
        >
          {images.map((_, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={index === i}
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                show: { opacity: 1, scale: 1 },
              }}
              className={`w-3 h-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/60
          ${
            index === i ? "bg-white scale-110" : "bg-white/40 hover:bg-white/60"
          }`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        <div aria-live="polite" className="sr-only">
          Slide {index + 1} of {images.length}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="11/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default GallerySection;
