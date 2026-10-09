"use client";
import React, { useState } from "react";
import FooterNav from "./FooterNav";
import { toast } from "react-toastify";
import { motion } from "motion/react";
import Image from "next/image";

import { getPublicApiUrl } from "@/utils/api";

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
  const [name, setName] = useState(
    guestName &&
      guestName.toLowerCase() !== "guest" &&
      guestName.toLowerCase() !== "tamu undangan"
      ? guestName
      : ""
  );
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  React.useEffect(() => {
    if (
      guestName &&
      !name &&
      guestName.toLowerCase() !== "guest" &&
      guestName.toLowerCase() !== "tamu undangan"
    ) {
      setName(guestName);
    }
  }, [guestName, name]);

  const fetchData = async () => {
    setErrorMessage("");
    setResponseMessage("");
    if (!name.trim() || !message.trim()) {
      setErrorMessage("Nama dan pesan ucapan tidak boleh kosong");
      return;
    }
    setIsLoading(true);
    try {
      const apiUrl = getPublicApiUrl();
      const res = await fetch(`${apiUrl}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), message: message.trim() }),
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
        throw new Error(backendError || "Gagal mengirim ucapan & doa");
      }
      toast.success(
        data?.message ||
          "Ucapan dan doa restu berhasil dikirim! Terima kasih.",
      );
      setResponseMessage("Ucapan dan doa restu Anda sudah terkirim!");
      onSubmitSuccess?.();
      setMessage("");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Gagal mengirim ucapan & doa");
      } else {
        setErrorMessage(String(error) || "Gagal mengirim ucapan & doa");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section
      ref={verseRef}
      id="comments"
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* Background */}
      <motion.div
        initial={{ opacity: 0, scale: 1.06 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/8.JPG"
          alt="comment"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 450px"
        />
      </motion.div>

      {/* Overlay: Lebih transparan agar foto pengantin tetap terlihat jelas */}
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/15 to-black/45" />

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
        className="relative z-10 flex min-h-dvh items-center"
      >
        <motion.div
          className="mx-auto w-full max-w-md px-6 py-6 sm:py-7 text-center bg-black/20 border border-white/15 rounded-3xl backdrop-blur-[2px] shadow-2xl"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {/* Eyebrow badge */}
          <motion.span
            className="inline-block text-[11px] sm:text-xs tracking-[0.25em] uppercase text-amber-300/90 font-medium font-sans mb-1"
            variants={{
              hidden: { opacity: 0, y: -4 },
              show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
            }}
          >
            W I S H E S &amp; P R A Y E R S
          </motion.span>

          {/* Judul Ucapan & Doa */}
          <motion.h2
            className="font-playfair text-2xl sm:text-3xl md:text-4xl font-normal tracking-wide text-white drop-shadow-md mb-2"
            variants={{
              hidden: { opacity: 0, y: 8, scale: 0.996 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.65 },
              },
            }}
          >
            Kirim Ucapan &amp; Doa
          </motion.h2>

          {/* Ornamen Garis Pembatas */}
          <motion.div
            className="flex items-center justify-center gap-2.5 mb-3 text-amber-200/60"
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
            }}
            aria-hidden="true"
          >
            <div className="h-px w-10 sm:w-14 bg-linear-to-r from-transparent to-amber-200/60" />
            <span className="text-[10px] text-amber-300">✦</span>
            <div className="h-px w-10 sm:w-14 bg-linear-to-l from-transparent to-amber-200/60" />
          </motion.div>

          <motion.p
            className="text-xs sm:text-sm mb-4 text-white/80 leading-relaxed max-w-sm mx-auto"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            Berikan doa restu dan ucapan selamat terbaik Anda untuk mengawali
            perjalanan cinta Andri &amp; Cica.
          </motion.p>

          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              fetchData();
            }}
            className="space-y-3.5 text-left"
            aria-label="Formulir Ucapan dan Doa Restu"
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
                Nama Anda
              </label>
              <motion.input
                id="wish-name"
                type="text"
                name="name"
                placeholder="Nama lengkap Anda..."
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/15 text-sm text-white placeholder-white/45
                     focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition"
                autoComplete="name"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
            </motion.div>

            {/* Pesan */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <label htmlFor="wish-message" className="sr-only">
                Pesan Ucapan &amp; Doa
              </label>
              <motion.textarea
                id="wish-message"
                rows={3}
                name="message"
                placeholder="Tuliskan ucapan dan doa restu terbaik Anda..."
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/15 text-sm text-white placeholder-white/45
                     focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition resize-none"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              />
            </motion.div>

            <motion.div
              aria-live="polite"
              className="min-h-5 text-xs text-white/80 text-center"
              variants={{
                hidden: { opacity: 0, y: 6 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
            >
              {errorMessage || responseMessage ? (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${
                    errorMessage
                      ? "text-red-300 bg-red-400/15 border border-red-400/25"
                      : "text-emerald-300 bg-emerald-400/15 border border-emerald-400/25"
                  } font-inter py-1.5 px-3.5 rounded-lg w-fit mx-auto text-xs`}
                >
                  {errorMessage || responseMessage}
                </motion.p>
              ) : null}
            </motion.div>

            <motion.div
              className="flex items-center justify-center pt-1"
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2.5 h-11 px-8 rounded-xl text-sm font-semibold tracking-wide transition
                     bg-amber-400 hover:bg-amber-300 text-stone-900 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-stone-900"
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
                    <span>Mengirim ucapan...</span>
                  </>
                ) : (
                  <span>Kirim Ucapan &amp; Doa</span>
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
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
