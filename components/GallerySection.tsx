"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import FooterNav from "./FooterNav";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import LazyBackgroundVideo from "./LazyBackgroundVideo";
import { BsChevronLeft, BsChevronRight, BsX, BsHeart } from "react-icons/bs";

type GallerySectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
};

const galleryImages = [
  "/media/gallery1.JPG",
  "/media/gallery2.JPG",
  "/media/gallery3.JPG",
  "/media/gallery4.JPG",
  "/media/gallery5.JPG",
  "/media/gallery6.JPG",
  "/media/gallery7.JPG",
  "/media/gallery8.JPG",
  "/media/gallery9.JPG",
  "/media/gallery10.jpg",
  "/media/gallery11.jpg",
  "/media/gallery12.jpg",
];

const GallerySection: React.FC<GallerySectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const touchStartX = useRef<number>(0);

  const handleOpenPopup = (idx: number) => {
    setSelectedIndex(idx);
  };

  const handleClosePopup = () => {
    setSelectedIndex(null);
  };

  const handlePrevImage = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) =>
      prev !== null
        ? (prev - 1 + galleryImages.length) % galleryImages.length
        : null,
    );
  }, [selectedIndex]);

  const handleNextImage = useCallback(() => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) =>
      prev !== null ? (prev + 1) % galleryImages.length : null,
    );
  }, [selectedIndex]);

  // Keyboard navigation & sync modal open state
  useEffect(() => {
    if (selectedIndex === null) return;

    window.dispatchEvent(
      new CustomEvent("modal-open-change", { detail: { open: true } }),
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClosePopup();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.dispatchEvent(
        new CustomEvent("modal-open-change", { detail: { open: false } }),
      );
    };
  }, [selectedIndex, handlePrevImage, handleNextImage]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;
    if (diff > 45) {
      handleNextImage();
    } else if (diff < -45) {
      handlePrevImage();
    }
  };

  return (
    <section
      id="gallery"
      ref={verseRef}
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* BACKGROUND VIDEO */}
      <LazyBackgroundVideo src="/media/road.mp4" />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/60" />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col h-full px-5 pt-12 pb-20 max-w-md mx-auto">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-1">
            Our Moments
          </p>
          <h2 className="text-3xl font-light font-alex-brush text-white/95">
            Our Gallery
          </h2>
          <div className="mx-auto mt-2 h-px w-20 bg-white/30" />
        </motion.div>

        {/* INSTAGRAM-STYLE GRID */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="flex-1 overflow-y-auto custom-scroll pr-1 pb-2"
        >
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {galleryImages.map((src, idx) => (
              <motion.button
                key={idx}
                type="button"
                onClick={() => handleOpenPopup(idx)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="group relative aspect-square w-full overflow-hidden rounded-md bg-white/5 border border-white/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label={`Lihat foto ${idx + 1}`}
              >
                <Image
                  src={src}
                  alt={`Gallery photo ${idx + 1}`}
                  fill
                  sizes="(max-width: 450px) 33vw, 150px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Instagram-style hover overlay */}
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <BsHeart className="text-white text-base fill-white drop-shadow-md" />
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-[11px] text-center text-white/50 mt-4 tracking-wider uppercase">
            Ketuk foto untuk memperbesar
          </p>
        </motion.div>
      </div>

      {/* POPUP LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 select-none"
            onClick={handleClosePopup}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* TOP BAR */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 max-w-lg mx-auto pointer-events-none">
              <span className="pointer-events-auto text-xs uppercase tracking-[0.2em] text-white/80 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15">
                {selectedIndex + 1} / {galleryImages.length}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClosePopup();
                }}
                className="pointer-events-auto p-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/15 transition cursor-pointer"
                aria-label="Tutup popup"
              >
                <BsX className="w-6 h-6" />
              </button>
            </div>

            {/* PREV BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 text-white/90 hover:text-white bg-black/40 hover:bg-black/70 rounded-full backdrop-blur-md border border-white/20 transition cursor-pointer"
              aria-label="Foto sebelumnya"
            >
              <BsChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* NEXT BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 text-white/90 hover:text-white bg-black/40 hover:bg-black/70 rounded-full backdrop-blur-md border border-white/20 transition cursor-pointer"
              aria-label="Foto selanjutnya"
            >
              <BsChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* POPUP IMAGE CONTAINER */}
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -10 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[84vw] sm:max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black/40"
            >
              <Image
                src={galleryImages[selectedIndex]}
                alt={`Gallery foto ${selectedIndex + 1}`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 640px) 85vw, 400px"
              />

              {/* Bottom gradient caption */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/35 to-transparent pt-6 pb-3 px-4 text-center">
                <p className="font-alex-brush text-2xl text-white/95 leading-none mb-1">
                  Andri &amp; Cica
                </p>
                {/* <p className="text-[10px] tracking-widest text-white/70 uppercase">
                  Swipe atau gunakan panah untuk melihat foto lainnya
                </p> */}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER NAV */}
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
