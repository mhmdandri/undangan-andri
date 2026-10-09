"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  BsCheck2Circle,
  BsSearch,
  BsPeople,
  BsEnvelope,
  BsArrowCounterclockwise,
  BsClock,
  BsQrCode,
  BsCheckLg,
  BsExclamationTriangle,
  BsPlus,
  BsDash,
  BsHeartFill,
} from "react-icons/bs";
import { getPublicApiUrl } from "@/utils/api";

export type GuestReservation = {
  id?: number;
  name: string;
  email: string;
  code: string;
  total_guests: number;
  status?: string;
  is_present?: boolean;
  is_already_checked_in?: boolean;
  attended_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CheckInApiResponse = {
  status: string;
  message?: string;
  error?: string;
  data?: GuestReservation;
};

export default function ReservationCheckIn() {
  const [code, setCode] = useState<string>("");
  const [actualGuest, setActualGuest] = useState<number>(1);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [guestData, setGuestData] = useState<GuestReservation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successData, setSuccessData] = useState<{
    guest: GuestReservation;
    actual_guest: number;
    message: string;
    is_already: boolean;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enable normal scrolling on mobile and desktop while on check-in page
  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlHeight = document.documentElement.style.height;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "auto";
    document.documentElement.style.height = "auto";
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.height = prevHtmlHeight;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.height = prevBodyHeight;
    };
  }, []);

  // Auto redirect / reset back to check-in input after check-in completes (runs in background for 3 seconds)
  useEffect(() => {
    if (!successData) return;

    const timer = setTimeout(() => {
      handleReset();
    }, 5000);

    return () => clearTimeout(timer);
  }, [successData]);

  // Format date helper
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Fetch Guest by 5-digit code
  const handleCheckCode = async (codeToVerify?: string) => {
    inputRef.current?.blur();
    const targetCode = (codeToVerify || code).trim();
    if (!targetCode) {
      setErrorMessage("Silakan masukkan kode reservasi");
      return;
    }

    if (targetCode.length < 4) {
      setErrorMessage("Kode reservasi biasanya terdiri dari 5 digit angka");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");
    setGuestData(null);
    setSuccessData(null);

    try {
      // First try proxy route, fallback to direct API if needed
      let res = await fetch(
        `/api/reservations/check-in/${encodeURIComponent(targetCode)}`,
        {
          cache: "no-store",
        },
      );

      if (!res.ok && res.status === 502) {
        // Try direct call
        const directApiUrl = getPublicApiUrl();
        res = await fetch(
          `${directApiUrl}/api/reservations/check-in/${encodeURIComponent(targetCode)}`,
          {
            cache: "no-store",
          },
        );
      }

      const json: CheckInApiResponse = await res.json().catch(() => ({}));

      if (!res.ok || json.status === "not_found" || json.error) {
        const errorMsg =
          json.error ||
          json.message ||
          "Kode reservasi tidak valid atau tidak ditemukan. Mohon periksa kembali.";
        setErrorMessage(errorMsg);
        return;
      }

      if (json.data) {
        setGuestData(json.data);
        // Default actual guests to total_guests from RSVP or minimum 1
        const initialGuests =
          json.data.total_guests > 0 ? json.data.total_guests : 1;
        setActualGuest(initialGuests);
      } else {
        setErrorMessage("Data reservasi tidak ditemukan");
      }
    } catch (err) {
      console.error("Check-in verification failed", err);
      // Fallback try direct API
      try {
        const directApiUrl = getPublicApiUrl();
        const directRes = await fetch(
          `${directApiUrl}/api/reservations/check-in/${encodeURIComponent(targetCode)}`,
        );
        const directJson: CheckInApiResponse = await directRes.json();
        if (directRes.ok && directJson.data) {
          setGuestData(directJson.data);
          setActualGuest(
            directJson.data.total_guests > 0 ? directJson.data.total_guests : 1,
          );
          return;
        }
      } catch {
        // Ignore fallback failure
      }

      const msg =
        "Terjadi gangguan saat memverifikasi kode. Pastikan server backend aktif.";
      setErrorMessage(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  // Submit Check-In
  const handleSubmitCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const targetCode = (guestData?.code || code).trim();
    if (!targetCode) {
      setErrorMessage("Kode reservasi tidak boleh kosong");
      return;
    }

    if (actualGuest < 1) {
      setErrorMessage("Jumlah tamu minimal 1 orang");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        code: targetCode,
        actual_guest: Number(actualGuest),
      };

      let res = await fetch("/api/reservations/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok && res.status === 502) {
        // Direct fallback
        const directApiUrl = getPublicApiUrl();
        res = await fetch(`${directApiUrl}/api/reservations/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const json: CheckInApiResponse = await res.json().catch(() => ({}));

      if (!res.ok || json.status === "error" || json.error) {
        const errText =
          json.error || json.message || "Gagal melakukan check-in";
        setErrorMessage(errText);
        return;
      }

      const isAlready = json.status === "already_checked_in";
      const returnedGuest = json.data || guestData!;

      setSuccessData({
        guest: returnedGuest,
        actual_guest: actualGuest,
        message:
          json.message ||
          (isAlready
            ? "Tamu ini sudah melakukan check-in kehadiran sebelumnya!"
            : "Check-in kehadiran tamu berhasil dikonfirmasi!"),
        is_already: isAlready,
      });
    } catch (err) {
      console.error("Check-in submit error", err);
      // Fallback direct
      try {
        const directApiUrl = getPublicApiUrl();
        const directRes = await fetch(
          `${directApiUrl}/api/reservations/check-in`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: targetCode,
              actual_guest: Number(actualGuest),
            }),
          },
        );
        const directJson: CheckInApiResponse = await directRes.json();
        if (directRes.ok && directJson.data) {
          const isAlready = directJson.status === "already_checked_in";
          setSuccessData({
            guest: directJson.data,
            actual_guest: actualGuest,
            message: directJson.message || "Check-in berhasil!",
            is_already: isAlready,
          });
          return;
        }
      } catch {
        // Ignore fallback error
      }

      const msg =
        "Gagal memproses check-in. Pastikan server backend terhubung.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to search another guest
  const handleReset = () => {
    setCode("");
    setGuestData(null);
    setSuccessData(null);
    setErrorMessage("");
    setActualGuest(1);
    inputRef.current?.blur();
  };

  const isExpanded = Boolean(guestData && !successData);

  return (
    <div className="fixed inset-0 z-10 w-full overflow-y-auto overscroll-y-contain bg-black text-white font-inter flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      {/* Background Image with Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/1.jpg"
          alt="Andri & Cica Wedding Background"
          fill
          priority
          className="object-cover object-center opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-radial from-black/40 via-black/85 to-black" />
        <div className="absolute inset-0 backdrop-blur-md" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-4 pt-3 pb-1 max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-white/80 font-playfair tracking-wide">
            Andri &amp; Cica Wedding
          </span>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-amber-200/90 font-medium tracking-wider uppercase bg-amber-500/10 border border-amber-400/25 px-2.5 py-1 rounded-full backdrop-blur-sm">
          <span>Reception Desk</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        {/* Dynamic Card Container */}
        <AnimatePresence mode="wait">
          {/* STATE 1: SUCCESS CONFIRMATION PASS */}
          {successData ? (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/8 border border-white/20 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl text-center"
            >
              {/* Decorative Glow */}
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2.5 sm:mb-3 rounded-full bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg shadow-emerald-500/30"
              >
                <BsCheckLg />
              </motion.div>

              <p className="text-[11px] tracking-widest uppercase text-emerald-400 font-semibold mb-0.5">
                {successData.is_already
                  ? "Sudah Terverifikasi"
                  : "Check-in Berhasil!"}
              </p>

              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-white mb-0.5">
                Selamat Datang
              </h2>
              <p className="font-alex-brush text-amber-200 text-2xl sm:text-3xl mb-2 sm:mb-3">
                {successData.guest.name}
              </p>

              <div className="my-2.5 sm:my-4 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 p-3 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70 border-b border-white/10 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <BsQrCode className="text-amber-300" /> Kode Reservasi
                  </span>
                  <span className="font-mono text-white text-xs sm:text-sm font-semibold tracking-wider">
                    {successData.guest.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/70 border-b border-white/10 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <BsPeople className="text-emerald-300" /> Tamu Hadir
                  </span>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                    {successData.actual_guest} Orang
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <BsClock className="text-blue-300" /> Waktu Check-In
                  </span>
                  <span className="text-white/90 text-right text-[11px] sm:text-xs">
                    {formatDateTime(
                      successData.guest.attended_at || new Date().toISOString(),
                    )}
                  </span>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-white/70 italic mb-4">
                &ldquo;{successData.message}&rdquo;
              </p>

              {/* Action Button */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-5 rounded-xl sm:rounded-full bg-linear-to-r from-amber-400 to-amber-300 text-black font-semibold text-xs sm:text-sm shadow-md hover:brightness-105 transition cursor-pointer"
                >
                  <BsArrowCounterclockwise className="text-base" />
                  <span>Check-In Tamu Lainnya</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* STATE 2: SEARCH / INPUT / GUEST CONFIRMATION FORM */
            <motion.div
              key="form-container"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                y: isExpanded ? -24 : 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                y: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.25 },
              }}
              className="w-full flex flex-col"
            >
              {/* Wedding Identity Branding */}
              <motion.div
                animate={{
                  scale: isExpanded ? 0.92 : 1,
                  marginBottom: isExpanded ? 10 : 22,
                }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-0.5 origin-bottom"
              >
                <p className="text-[10px] sm:text-xs tracking-[0.25em] text-white/60 uppercase font-sans">
                  THE WEDDING OF
                </p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-alex-brush text-white drop-shadow-md leading-tight">
                  Andri &amp; Cica
                </h1>
                <p className="text-[10px] sm:text-xs text-amber-200/80 font-playfair tracking-wider uppercase">
                  Check-In &amp; Konfirmasi Tamu
                </p>
              </motion.div>

              {/* Form Card */}
              <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/7 border border-white/16 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
                {/* Glass Highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                {/* STEP 1: INPUT 5-DIGIT CODE */}
                <div className="flex flex-col">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="reservation-code"
                        className="text-[11px] sm:text-xs uppercase font-medium tracking-wider text-white/80 flex items-center gap-1.5"
                      >
                        <BsQrCode className="text-amber-300" />
                        <span>Kode Reservasi Tamu</span>
                      </label>
                      <span className="text-[10px] text-white/50">
                        5 Digit Angka
                      </span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        ref={inputRef}
                        id="reservation-code"
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={code}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 5);
                          setCode(val);
                          setErrorMessage("");
                          if (val.length === 5 && !guestData) {
                            // Auto trigger lookup and dismiss mobile keyboard
                            inputRef.current?.blur();
                            handleCheckCode(val);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            inputRef.current?.blur();
                            handleCheckCode();
                          }
                        }}
                        placeholder="Contoh: 91496"
                        className="w-full h-11 sm:h-12 pl-3 pr-20 rounded-xl sm:rounded-2xl bg-black/40 border border-white/20 text-lg sm:text-xl font-mono text-center tracking-[0.2em] text-amber-200 placeholder:text-white/30 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-300/60 transition shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <div className="absolute right-1.5 flex items-center gap-1">
                        {code && (
                          <button
                            type="button"
                            onClick={() => {
                              setCode("");
                              setGuestData(null);
                              setErrorMessage("");
                              inputRef.current?.blur();
                            }}
                            className="p-1 text-white/50 hover:text-white rounded-lg transition"
                            title="Hapus"
                          >
                            ✕
                          </button>
                        )}
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleCheckCode()}
                          disabled={isVerifying || !code.trim()}
                          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg sm:rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 disabled:hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {isVerifying ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <BsSearch className="text-xs" />
                          )}
                          <span>Cek</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* ERROR ALERT */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
                            <BsExclamationTriangle className="text-xs shrink-0 mt-0.5 text-red-400" />
                            <span className="leading-relaxed">
                              {errorMessage}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* STEP 2: GUEST DATA DETAILS (APPEARS AFTER SUCCESSFUL LOOKUP) */}
                  <AnimatePresence initial={false}>
                    {guestData && (
                      <motion.div
                        key="guest-details"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          transition: {
                            height: {
                              duration: 0.38,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            opacity: { duration: 0.25, delay: 0.08 },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          transition: {
                            height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.15 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2.5 space-y-2.5">
                          {/* Guest Card Header */}
                          <div className="rounded-xl bg-white/6 border border-white/12 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-200/80 font-medium">
                                  Tamu Terdaftar
                                </span>
                                <h3 className="text-base sm:text-lg font-playfair font-bold text-white truncate">
                                  {guestData.name}
                                </h3>
                              </div>

                              {/* RSVP Status Pill */}
                              <span
                                className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
                                  guestData.is_present ||
                                  guestData.status === "hadir"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                                    : "bg-white/10 text-white/70 border-white/15"
                                }`}
                              >
                                <BsCheck2Circle className="text-xs" />
                                {guestData.status === "hadir" ||
                                guestData.is_present
                                  ? "Hadir"
                                  : "RSVP"}
                              </span>
                            </div>

                            {/* Email & Quota Details */}
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/8 text-white/70">
                              <div className="flex items-center gap-1 overflow-hidden truncate">
                                <BsEnvelope className="text-white/50 shrink-0 text-[10px]" />
                                <span className="truncate">
                                  {guestData.email || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <BsPeople className="text-white/50 shrink-0 text-[10px]" />
                                <span>
                                  RSVP:{" "}
                                  <strong className="text-white">
                                    {guestData.total_guests}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            {/* Already Checked-in Notice if Applicable */}
                            {guestData.is_already_checked_in && (
                              <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-400/25 flex items-start gap-1.5 text-[10px] text-amber-200">
                                <BsClock className="text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-white">
                                    Sudah Check-In:{" "}
                                  </span>
                                  <span>
                                    {formatDateTime(guestData.attended_at)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* STEP 3: INPUT ACTUAL GUESTS (JUMLAH TAMU YANG HADIR) */}
                          <div className="rounded-xl bg-black/35 border border-white/12 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor="actual-guest-input"
                                className="text-[11px] uppercase font-medium tracking-wider text-white/90 flex items-center gap-1.5"
                              >
                                <BsPeople className="text-amber-300" />
                                <span>Jumlah Tamu Hadir</span>
                              </label>
                              <span className="text-[10px] text-white/50">
                                (RSVP: {guestData.total_guests})
                              </span>
                            </div>

                            {/* Number Stepper Control */}
                            <div className="flex items-center gap-2">
                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() =>
                                  setActualGuest((prev) =>
                                    Math.max(1, prev - 1),
                                  )
                                }
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white text-base transition active:bg-white/25 cursor-pointer"
                                aria-label="Kurangi tamu"
                              >
                                <BsDash />
                              </motion.button>

                              <div className="flex-1 relative">
                                <input
                                  id="actual-guest-input"
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min={1}
                                  max={10}
                                  value={actualGuest}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setActualGuest(
                                      isNaN(val) ? 1 : Math.max(1, val),
                                    );
                                  }}
                                  className="w-full h-9 sm:h-10 text-center font-bold text-base rounded-lg bg-white/6 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-300/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/50 pointer-events-none">
                                  Orang
                                </span>
                              </div>

                              <motion.button
                                type="button"
                                whileTap={{ scale: 0.92 }}
                                onClick={() =>
                                  setActualGuest((prev) => prev + 1)
                                }
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white text-base transition active:bg-white/25 cursor-pointer"
                                aria-label="Tambah tamu"
                              >
                                <BsPlus />
                              </motion.button>
                            </div>

                            {/* Quick Selection Buttons */}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              {[1, 2, 3].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => setActualGuest(num)}
                                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                                    actualGuest === num
                                      ? "bg-amber-400 text-black font-semibold shadow-sm"
                                      : "bg-white/8 hover:bg-white/14 text-white/80"
                                  }`}
                                >
                                  {num}
                                </button>
                              ))}
                              {guestData.total_guests > 3 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActualGuest(guestData.total_guests)
                                  }
                                  className={`flex-1 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                                    actualGuest === guestData.total_guests
                                      ? "bg-amber-400 text-black font-semibold shadow-sm"
                                      : "bg-white/8 hover:bg-white/14 text-white/80"
                                  }`}
                                >
                                  {guestData.total_guests} (RSVP)
                                </button>
                              )}
                            </div>
                          </div>

                          {/* SUBMIT CHECK-IN BUTTON */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting}
                            onClick={() => handleSubmitCheckIn()}
                            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 text-black font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-400/20 hover:brightness-105 active:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Memproses Check-In...</span>
                              </>
                            ) : (
                              <>
                                <BsCheck2Circle className="text-base" />
                                <span>
                                  {guestData.is_already_checked_in
                                    ? "Perbarui & Konfirmasi Ulang"
                                    : "Konfirmasi Check-In Tamu"}
                                </span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Helpful Instruction Tip if no guest found yet */}
                  <AnimatePresence initial={false}>
                    {!guestData && (
                      <motion.div
                        key="instruction-tip"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          transition: {
                            height: {
                              duration: 0.28,
                              delay: 0.1,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            opacity: { duration: 0.2, delay: 0.15 },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          transition: {
                            height: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
                            opacity: { duration: 0.1 },
                          },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 text-center text-[11px] text-white/50">
                          <p>
                            Masukkan 5 digit kode reservasi tamu yang tertera
                            pada email konfirmasi atau barcode undangan.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 w-full py-3 text-center text-xs text-white/50 flex flex-col items-center gap-0.5">
        <p className="flex items-center gap-1.5 font-playfair tracking-wide text-[11px]">
          <span>Andri &amp; Cica Wedding</span>
          <BsHeartFill className="text-amber-400 text-[9px]" />
          <span>21 November 2026</span>
        </p>
        <p className="text-[9px] text-white/35">
          Sistem Reservasi &amp; Buku Tamu Digital &bull; &copy; mohaproject
        </p>
      </footer>
    </div>
  );
}
