"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import {
  LuSearch,
  LuQrCode,
  LuArrowLeft,
  LuRefreshCw,
  LuCheck,
  LuCopy,
  LuDownload,
  LuExternalLink,
  LuCircleCheck,
  LuClock,
  LuUser,
  LuUsers,
  LuSparkles,
} from "react-icons/lu";
import { getPublicApiUrl } from "@/utils/api";

type Guest = {
  id?: number;
  name: string;
  code: string;
  quota_guests?: number;
  total_guests?: number;
  is_present?: boolean;
  status?: string;
  attended_at?: string | null;
  created_at?: string;
  source?: string;
};

export default function GuestListPage() {
  const searchParams = useSearchParams();

  // Ambil query pencarian awal dari parameter URL jika ada (?code=, ?name=, ?q=)
  const initialQuery = useMemo(() => {
    if (!searchParams) return "";
    return (
      searchParams.get("code") ||
      searchParams.get("name") ||
      searchParams.get("q") ||
      searchParams.get("search") ||
      ""
    );
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(
    initialQuery.trim(),
  );
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "hadir" | "belum">(
    "all",
  );
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Enable normal scrolling on mobile and desktop
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

  // Search debouncer & fetch: tunggu 350ms setelah user berhenti mengetik sebelum fetch dari API
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      const resetTimer = setTimeout(() => {
        setDebouncedQuery("");
        setGuests([]);
        setIsLoading(false);
        setErrorMessage("");
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    let isCancelled = false;

    const timer = setTimeout(async () => {
      setDebouncedQuery(trimmed);

      try {
        const res = await fetch(
          `/api/reservations?q=${encodeURIComponent(trimmed)}`,
          {
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          },
        );

        const rawText = await res.text();
        let json: { data?: Guest[] } | null = null;
        try {
          json = JSON.parse(rawText);
        } catch {
          json = null;
        }

        if (res.ok && Array.isArray(json?.data) && !isCancelled) {
          const sorted = [...json.data].sort((a, b) =>
            a.name.localeCompare(b.name, "id", { sensitivity: "base" }),
          );
          setGuests(sorted);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback ke endpoint publik
      }

      try {
        const fallbackRes = await fetch(
          `${getPublicApiUrl()}/api/reservations`,
          {
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          },
        );
        const rawText = await fallbackRes.text();
        const json = JSON.parse(rawText);
        if (fallbackRes.ok && Array.isArray(json?.data) && !isCancelled) {
          const q = trimmed.toLowerCase();
          const matched = json.data.filter(
            (g: Guest) =>
              (g.name || "").toLowerCase().includes(q) ||
              (g.code || "").toLowerCase().includes(q),
          );
          matched.sort((a: Guest, b: Guest) =>
            a.name.localeCompare(b.name, "id", { sensitivity: "base" }),
          );
          setGuests(matched);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback gagal
      }

      if (!isCancelled) {
        setErrorMessage(
          "Gagal mencari data tamu. Pastikan koneksi server backend stabil.",
        );
        setIsLoading(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleRefresh = () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      const current = searchQuery;
      setSearchQuery("");
      setTimeout(() => setSearchQuery(current), 50);
    }
  };

  // Format tanggal & jam kedatangan
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("id-ID", {
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

  // Status pencarian aktif
  const isSearching =
    debouncedQuery.length > 0 || searchQuery.trim().length > 0;

  // Filter hasil pencarian berdasarkan status kehadiran
  const filteredGuests = useMemo(() => {
    if (!debouncedQuery) {
      return [];
    }

    return guests.filter((g) => {
      const isCheckedIn = Boolean(
        g.is_present || g.status?.toLowerCase() === "hadir",
      );

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "hadir" && isCheckedIn) ||
        (filterStatus === "belum" && !isCheckedIn);

      return matchesStatus;
    });
  }, [guests, debouncedQuery, filterStatus]);

  // Copy reservation code / link
  const handleCopy = async (textToCopy: string, code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedCode(code);
      toast.success("Berhasil disalin ke clipboard!");
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      toast.error("Gagal menyalin teks.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-slate-100 font-sans pb-24 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Sticky Header */}
      <header className="border-b border-white/10 bg-[#0d1017]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/guest"
            id="btn-back-home"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-amber-300 transition group"
          >
            <LuArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Undangan</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              id="btn-refresh-guests"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition"
              title="Perbarui data tamu"
            >
              <LuRefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`}
              />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest">
            <LuSparkles className="w-3.5 h-3.5" />
            <span>Buku Tamu &amp; Kode QR</span>
          </div>

          <h1 className="font-playfair text-2xl sm:text-4xl font-bold text-white tracking-wide">
            Daftar Tamu Undangan
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Cari nama atau kode reservasi Anda di bawah ini untuk melihat status
            kehadiran dan membuka{" "}
            <span className="text-amber-300 font-medium">Kode QR</span> acara
            pernikahan Andri &amp; Cica.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-guest-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim()) {
                    setIsLoading(true);
                  }
                }}
                placeholder="Ketik nama Anda atau kode reservasi (contoh: Andri atau 03109)..."
                className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                    setGuests([]);
                    setIsLoading(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                  title="Hapus pencarian"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === "all"
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterStatus("belum")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === "belum"
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Belum Hadir
              </button>
              <button
                onClick={() => setFilterStatus("hadir")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterStatus === "hadir"
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Sudah Hadir
              </button>
            </div>
          </div>

          {debouncedQuery && (
            <p className="text-xs text-slate-400 px-1">
              Menemukan{" "}
              <strong className="text-white">{filteredGuests.length}</strong>{" "}
              tamu dengan kata kunci &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Guest List Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <LuRefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-sm">Mencari data tamu...</p>
          </div>
        ) : errorMessage ? (
          <div className="py-16 text-center space-y-3 bg-[#0e111a] border border-rose-500/20 rounded-2xl p-6">
            <p className="text-sm text-rose-300">{errorMessage}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : !isSearching ? (
          /* Tampilan awal: belum mencari, daftar sengaja dikosongkan untuk privasi tamu */
          <div className="relative overflow-hidden bg-linear-to-b from-[#121622]/90 to-[#0e111a]/90 border border-amber-500/20 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner">
                <LuSearch className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide font-playfair">
                  Cari Nama atau Kode QR Anda
                </h3>
                {/* <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Daftar tamu disembunyikan demi menjaga privasi. Silakan ketik
                  nama lengkap Anda atau kode reservasi pada kolom pencarian di
                  atas untuk melihat status kehadiran dan tiket QR.
                </p> */}
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <LuUser className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Pencarian dengan <strong>Nama</strong>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <LuQrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Pencarian dengan <strong>Kode QR</strong>
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : filteredGuests.length === 0 ? (
          /* Pencarian dilakukan tapi tidak ditemukan */
          <div className="py-16 text-center space-y-3 bg-[#0e111a] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-1">
              <LuUser className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">
              Tidak ada tamu yang cocok
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Tidak ditemukan data tamu untuk kata kunci &quot;
              <span className="text-amber-300 font-medium">
                {searchQuery.trim()}
              </span>
              &quot;. Pastikan ejaan nama atau kode reservasi Anda sudah benar.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-xl text-xs font-semibold transition mt-2"
            >
              <span>Reset Pencarian</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop & Tablet Table View */}
            <div className="hidden md:block bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/2 text-slate-400 font-medium">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Nama Tamu</th>
                    <th className="py-3.5 px-4">Status Check-in</th>
                    <th className="py-3.5 px-4">Tanggal Datang</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredGuests.map((guest, idx) => {
                    const isCheckedIn = Boolean(
                      guest.is_present ||
                      guest.status?.toLowerCase() === "hadir",
                    );

                    return (
                      <tr
                        key={guest.code || guest.id || idx}
                        className="hover:bg-white/2 transition group"
                      >
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm block">
                              {guest.name}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-white/6 text-slate-400 border border-white/10">
                              {guest.quota_guests || guest.total_guests || 2}{" "}
                              Pax
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono text-amber-400/90 font-medium">
                              Kode: {guest.code}
                            </span>
                            {/* {guest.source && (
                              <span className="text-[10px] text-slate-500 capitalize">
                                • {guest.source}
                              </span>
                            )} */}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <LuCircleCheck className="w-3.5 h-3.5" />
                              Sudah Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                              Belum Hadir
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isCheckedIn && guest.attended_at ? (
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                              <LuClock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{formatDateTime(guest.attended_at)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedGuest(guest)}
                            id={`btn-qr-${guest.code}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-semibold text-xs transition shadow-sm"
                          >
                            <LuQrCode className="w-4 h-4" />
                            <span>Lihat QR</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2.5">
              {filteredGuests.map((guest, idx) => {
                const isCheckedIn = Boolean(
                  guest.is_present || guest.status?.toLowerCase() === "hadir",
                );

                return (
                  <div
                    key={guest.code || guest.id || idx}
                    className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 shadow-lg space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-xs">
                            #{idx + 1}
                          </span>
                          <h3 className="font-semibold text-white text-base leading-snug">
                            {guest.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="font-mono text-amber-400 font-medium">
                            Kode: {guest.code}
                          </span>
                          <span>•</span>
                          <div className="flex items-center gap-1 text-slate-400">
                            <LuUsers className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {guest.quota_guests || guest.total_guests || 2}{" "}
                              Pax
                            </span>
                          </div>
                        </div>
                      </div>

                      {isCheckedIn ? (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          <LuCircleCheck className="w-3 h-3" />
                          Sudah Hadir
                        </span>
                      ) : (
                        <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Belum Hadir
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">
                          Tanggal Datang:
                        </span>
                        {isCheckedIn && guest.attended_at ? (
                          <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px] mt-0.5">
                            <LuClock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{formatDateTime(guest.attended_at)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-xs">
                            -
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedGuest(guest)}
                        id={`btn-mobile-qr-${guest.code}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-semibold text-xs transition"
                      >
                        <LuQrCode className="w-4 h-4" />
                        <span>Lihat QR</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* QR Code Ticket Modal */}
      <AnimatePresence>
        {selectedGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#121622] border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 max-w-sm w-full text-center relative shadow-2xl overflow-y-auto max-h-[92vh]"
            >
              {/* Decorative Accent Glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-500/15 blur-3xl pointer-events-none rounded-full" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedGuest(null)}
                id="btn-close-qr-modal"
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10"
                title="Tutup"
              >
                ✕
              </button>

              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
                Tiket Resepsi Pernikahan
              </span>

              <h2 className="font-playfair text-xl font-bold text-white mt-3 px-6">
                {selectedGuest.name}
              </h2>

              <p className="text-xs text-slate-400 mb-3">
                Jatah Kuota:{" "}
                {selectedGuest.quota_guests || selectedGuest.total_guests || 2}{" "}
                Pax
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-2xl max-w-[220px] mx-auto my-3">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
                    `https://weddingofandricica.me?code=${selectedGuest.code}`,
                  )}`}
                  alt={`QR Code ${selectedGuest.name}`}
                  width={250}
                  height={250}
                  unoptimized
                  className="w-48 h-48 object-contain mx-auto"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3 px-2">
                Tunjukkan QR Code ini kepada penerima tamu saat tiba di lokasi
                resepsi pernikahan Andri &amp; Cica.
              </p>

              {/* Code Box */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 mb-4">
                <span className="text-[10px] text-amber-300/80 block uppercase font-mono tracking-wider">
                  KODE RESERVASI
                </span>
                <span className="text-2xl font-mono font-bold text-amber-300 tracking-widest">
                  {selectedGuest.code}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&data=${encodeURIComponent(
                      `https://weddingofandricica.me?code=${selectedGuest.code}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`QR_${selectedGuest.name}_${selectedGuest.code}.png`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 text-center flex items-center justify-center gap-1.5"
                  >
                    <LuDownload className="w-3.5 h-3.5" />
                    <span>Unduh QR</span>
                  </a>

                  <button
                    onClick={() =>
                      handleCopy(
                        `https://weddingofandricica.me?code=${selectedGuest.code}`,
                        selectedGuest.code,
                      )
                    }
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                    title="Salin Link Undangan"
                  >
                    {copiedCode === selectedGuest.code ? (
                      <LuCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <LuCopy className="w-3.5 h-3.5 text-slate-300" />
                    )}
                    <span>
                      {copiedCode === selectedGuest.code
                        ? "Tersalin"
                        : "Salin Link"}
                    </span>
                  </button>
                </div>

                <Link
                  href={`/${encodeURIComponent(selectedGuest.name)}?code=${selectedGuest.code}`}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <LuExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Halaman Undangan Tamu</span>
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
