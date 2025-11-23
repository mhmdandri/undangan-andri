"use client";
import React, { useState } from "react";
import FooterNav from "./FooterNav";
import { toast } from "react-toastify";
import { motion } from "motion/react";

type CommentSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
  onSubmitSuccess?: () => void;
  guestName?: string;
};
type Comment = {
  id?: number;
  name: string;
  message: string;
  created_at?: string;
};
type CommentResponse = {
  error?: string;
  message: string;
  comment: Comment;
};
const CommentSection: React.FC<CommentSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
  onSubmitSuccess,
  guestName,
}) => {
  const [name, setName] = useState(guestName || "");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fetchData = async () => {
    setErrorMessage("");
    if (!name.trim() || !message.trim()) {
      setErrorMessage("Nama dan pesan tidak boleh kosong");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("https://api.mohaproject.dev/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, message }),
      });
      let data: CommentResponse | undefined;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse JSON:", e);
      }
      if (!res.ok) {
        const backendError =
          data?.message ||
          data?.error ||
          (Array.isArray(data?.error) ? data.error.join(", ") : null) ||
          (data?.error && typeof data.error === "object"
            ? Object.values(data.error as Record<string, unknown>)
                .flat()
                .join(", ")
            : null);
        throw new Error(backendError || "Failed to submit comment");
      }
      toast.success(data?.message || "Comment submitted successfully");
      onSubmitSuccess?.();
      setName(guestName || "");
      setMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Failed to submit comment");
      } else {
        setErrorMessage(String(error) || "Failed to submit comment");
      }
    } finally {
      setIsLoading(false);
    }
  };
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
        <source src="/media/road.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.35 }}
        variants={{
          hidden: { opacity: 0, y: 18 },
          show: {
            opacity: 1,
            y: 0,
            transition: { when: "beforeChildren", staggerChildren: 0.08 },
          },
        }}
        className="relative z-10 flex items-center"
      >
        <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
          <motion.h2
            className="font-playfair text-3xl md:text-4xl font-semibold mb-4 text-white/95"
            variants={{
              hidden: { opacity: 0, y: 10, scale: 0.995 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] },
              },
            }}
          >
            Leave Your Wishes
          </motion.h2>

          <motion.p
            className="text-sm mb-6 text-white/80 leading-relaxed"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
          >
            We would love to hear your thoughts and wishes for our special day.
            Please leave a comment below!
          </motion.p>
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              fetchData();
            }}
            className="space-y-3"
            aria-label="Leave Your Wishes Form"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.06, delayChildren: 0.04 },
              },
            }}
          >
            {/* Nama */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <label htmlFor="wish-name" className="sr-only">
                Your name
              </label>
              <motion.input
                id="wish-name"
                type="text"
                name="name"
                placeholder="Your name..."
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full h-11 px-4 rounded-lg bg-white/6 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                autoComplete="name"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <label htmlFor="wish-message" className="sr-only">
                Your message
              </label>
              <motion.textarea
                id="wish-message"
                rows={5}
                name="message"
                placeholder="Your message..."
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                className="w-full px-4 py-3 rounded-lg bg-white/6 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition resize-none"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              />
            </motion.div>
            <motion.div
              aria-live="polite"
              className="min-h-5 text-sm text-white/80"
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
            >
              {errorMessage ? (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 font-inter bg-red-300/10 py-2 px-4 rounded-md w-fit mx-auto"
                >
                  {errorMessage}
                </motion.p>
              ) : null}
            </motion.div>
            <motion.div
              className="flex items-center justify-center gap-3"
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-3 px-6 py-2 rounded-full text-sm font-semibold tracking-wide transition
                     bg-white/12 hover:bg-white/25 disabled:opacity-60 disabled:cursor-not-allowed"
                whileHover={{ scale: isLoading ? 1 : 1.03 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.55, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
        className="absolute z-10 inset-x-0 bottom-4 w-full px-6"
      >
        <FooterNav page="8/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default CommentSection;
