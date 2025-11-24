"use client";

import { motion, AnimatePresence } from "framer-motion";
import React from "react";

type WeddingModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

const Modal: React.FC<WeddingModalProps> = ({
  open,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-999 flex items-center justify-center px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* BACKDROP */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-10 w-full max-w-md rounded-2xl p-6 bg-white/10 border border-white/20 backdrop-blur-xl text-center shadow-xl"
          >
            {/* Title */}
            {title && (
              <h2 className="font-alex-brush text-4xl mb-3 text-white/95">
                {title}
              </h2>
            )}

            <div className="text-white/90 text-sm leading-relaxed font-inter">
              {children}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 rounded-full bg-white/80 text-black text-sm font-semibold tracking-wide hover:bg-white transition shadow-sm"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
