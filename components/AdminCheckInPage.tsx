"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "motion/react";
import {
  LuSearch,
  LuQrCode,
  LuArrowLeft,
  LuRefreshCw,
  LuCircleCheck,
  LuCheck,
  LuUserPlus,
  LuClock,
  LuVolume2,
  LuVolumeX,
  LuX,
  LuExternalLink,
  LuCopy,
} from "react-icons/lu";
import {
  BsCheckLg,
  BsQrCode,
  BsPeople,
  BsClock,
  BsArrowCounterclockwise,
} from "react-icons/bs";
import { getPublicApiUrl } from "@/utils/api";
import { playChime, unlockAudio } from "@/utils/qr";
import { buildInvitationUrl, buildInvitationMessage } from "@/utils/invitation";

export type GuestCheckInItem = {
  id?: number;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  quota_guests?: number;
  total_guests?: number;
  actual_guest?: number;
  is_present?: boolean;
  status?: string;
  source?: string;
  attended_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type CheckInApiResponse = {
  status: string;
  message?: string;
  error?: string;
  data?: GuestCheckInItem;
};

export default function AdminCheckInPage() {
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

  const [guests, setGuests] = useState<GuestCheckInItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(
    initialQuery.trim(),
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Tracking state check-in
  const [checkingInCode, setCheckingInCode] = useState<string | null>(null);
  const [recentlyCheckedInCodes, setRecentlyCheckedInCodes] = useState<
    Set<string>
  >(new Set());
  // Modal Success Check-In (seperti di /reservations)
  const [successModalData, setSuccessModalData] = useState<{
    guest: GuestCheckInItem;
    actual_guest: number;
    message: string;
    is_already: boolean;
    time: string;
  } | null>(null);
  const [modalCountdown, setModalCountdown] = useState<number>(5);

  const handleCloseSuccessModal = useCallback(() => {
    setSuccessModalData(null);
    setModalCountdown(5);
  }, []);

  // Modal Info Tamu / QR Code
  const [detailGuest, setDetailGuest] = useState<GuestCheckInItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer when success modal is displayed (5 seconds auto-close)
  useEffect(() => {
    if (!successModalData) return;

    const interval = setInterval(() => {
      setModalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSuccessModalData(null);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [successModalData]);

  // Normal scroll
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

  // Pre-warm audio
  useEffect(() => {
    const handleGesture = () => unlockAudio();
    window.addEventListener("click", handleGesture, {
      passive: true,
      once: true,
    });
    window.addEventListener("touchstart", handleGesture, {
      passive: true,
      once: true,
    });
    window.addEventListener("keydown", handleGesture, {
      passive: true,
      once: true,
    });

    return () => {
      window.removeEventListener("click", handleGesture);
      window.removeEventListener("touchstart", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, []);

  // Keyboard shortcut '/' to focus search, 'Esc' to clear/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement !== searchInputRef.current &&
        !successModalData &&
        !detailGuest
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape") {
        if (successModalData) {
          handleCloseSuccessModal();
        } else if (detailGuest) {
          setDetailGuest(null);
        } else if (searchQuery) {
          setSearchQuery("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [successModalData, handleCloseSuccessModal, detailGuest, searchQuery]);

  // Server-side search: cari tamu ke backend secara asinkron saat user mengetik
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedSearch("");
      setGuests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let isCancelled = false;

    const timer = setTimeout(async () => {
      setDebouncedSearch(trimmed);

      try {
        const publicApi = getPublicApiUrl();
        const endpoints = Array.from(
          new Set(
            [
              `/api/reservations?q=${encodeURIComponent(trimmed)}`,
              publicApi
                ? `${publicApi}/api/reservations?q=${encodeURIComponent(trimmed)}`
                : null,
            ].filter(Boolean) as string[],
          ),
        );

        let loaded = false;
        for (const url of endpoints) {
          try {
            const res = await fetch(url, {
              cache: "no-store",
              signal: AbortSignal.timeout(6000),
            });

            const raw = await res.text();
            let json: { data?: GuestCheckInItem[] } | null = null;
            try {
              json = JSON.parse(raw);
            } catch {
              json = null;
            }

            if (res.ok && Array.isArray(json?.data) && !isCancelled) {
              const sorted = [...json.data].sort((a, b) =>
                (a.name || "").localeCompare(b.name || "", "id", {
                  sensitivity: "base",
                }),
              );
              setGuests(sorted);
              loaded = true;
              break;
            }
          } catch {
            // Coba endpoint fallback berikutnya
          }
        }

        if (!loaded && !isCancelled) {
          setGuests([]);
        }
      } catch {
        if (!isCancelled) {
          setGuests([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Refresh data tamu yang sedang dicari
  const handleRefresh = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/reservations?q=${encodeURIComponent(trimmed)}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        },
      );
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.data)) {
        const sorted = [...json.data].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "id", {
            sensitivity: "base",
          }),
        );
        setGuests(sorted);
        toast.success("Data pencarian berhasil diperbarui!");
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  // Check-In Handler
  const handleCheckIn = async (guest: GuestCheckInItem, customPax?: number) => {
    if (checkingInCode === guest.code) return;

    setCheckingInCode(guest.code);
    const paxCount =
      customPax !== undefined
        ? customPax
        : guest.total_guests || guest.quota_guests || 1;

    const payload = {
      code: guest.code,
      actual_guest: Number(paxCount) || 1,
    };

    const publicApi = getPublicApiUrl();
    const checkInEndpoints = Array.from(
      new Set(
        [
          publicApi ? `${publicApi}/api/reservations/check-in` : null,
          "/api/reservations/check-in",
        ].filter(Boolean) as string[],
      ),
    );

    let successResponse: CheckInApiResponse | null = null;
    let errorMessage = "";

    for (const endpoint of checkInEndpoints) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });

        const raw = await res.text();
        let json: CheckInApiResponse | null = null;
        try {
          json = JSON.parse(raw);
        } catch {
          json = null;
        }

        if (
          res.ok &&
          (json?.status === "success" ||
            json?.status === "already_checked_in" ||
            json?.data)
        ) {
          successResponse = json;
          break;
        }

        if (json?.error || json?.message) {
          errorMessage = json.error || json.message || "Gagal check-in";
        }
      } catch (err) {
        console.warn(`Endpoint ${endpoint} failed:`, err);
      }
    }

    if (successResponse) {
      const isAlready = successResponse.status === "already_checked_in";
      const nowStr = new Date().toISOString();
      const timeDisplay = new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Play audio chime
      if (soundEnabled) {
        playChime(isAlready ? "warning" : "success");
      }

      // Update local state optimistically
      setGuests((prev) =>
        prev.map((g) => {
          if (g.code === guest.code) {
            return {
              ...g,
              is_present: true,
              status: "hadir",
              attended_at: g.attended_at || nowStr,
              total_guests: paxCount,
            };
          }
          return g;
        }),
      );

      // Add to recently checked in for pulse highlight
      setRecentlyCheckedInCodes((prev) => {
        const updated = new Set(prev);
        updated.add(guest.code);
        return updated;
      });

      setTimeout(() => {
        setRecentlyCheckedInCodes((prev) => {
          const updated = new Set(prev);
          updated.delete(guest.code);
          return updated;
        });
      }, 5000);

      // Set success check-in modal data (tampil seperti di halaman /reservations)
      const returnedGuest: GuestCheckInItem = {
        ...(successResponse.data || guest),
        is_present: true,
        status: "hadir",
        attended_at:
          successResponse.data?.attended_at || guest.attended_at || nowStr,
        total_guests: paxCount,
      };

      setModalCountdown(5);
      setSuccessModalData({
        guest: returnedGuest,
        actual_guest: paxCount,
        message:
          successResponse.message ||
          (isAlready
            ? "Tamu ini sudah melakukan check-in kehadiran sebelumnya!"
            : "Check-in kehadiran tamu berhasil dikonfirmasi!"),
        is_already: isAlready,
        time: timeDisplay,
      });
    } else {
      if (soundEnabled) {
        playChime("error");
      }
      toast.error(
        errorMessage ||
          "Gagal memproses check-in. Pastikan server backend terhubung.",
      );
    }

    setCheckingInCode(null);
  };

  // Copy helper
  const handleCopy = async (text: string, code: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-999999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedCode(code);
      toast.success("Berhasil disalin!");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      toast.error("Gagal menyalin.");
    }
  };

  // Format datetime
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB"
      );
    } catch {
      return dateStr;
    }
  };

  // Format datetime for success modal (similar to /reservations)
  const formatModalDateTime = (dateStr?: string | null) => {
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

  // Status pencarian aktif (seperti di list-guest)
  const isSearching =
    debouncedSearch.length > 0 || searchQuery.trim().length > 0;

  // Filtered Guests: data yang didapat langsung dari server berdasarkan query pencarian
  const filteredGuests = isSearching ? guests : [];

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-slate-100 font-sans pb-28 selection:bg-amber-500/30 selection:text-amber-200">
      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="border-b border-white/10 bg-[#0d1017]/95 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <Link
              href="/guest"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0 border border-white/5"
              title="Kembali ke Halaman Undangan"
            >
              <LuArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-playfair text-base sm:text-lg font-bold bg-linear-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent truncate">
                  Check-in Kehadiran
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Self Check-in
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden xs:block">
                The Wedding of Andri &amp; Cica
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                toast.info(
                  soundEnabled
                    ? "Suara check-in dinonaktifkan."
                    : "Suara check-in diaktifkan!",
                );
              }}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
              }`}
              title={
                soundEnabled ? "Matikan Suara Chime" : "Nyalakan Suara Chime"
              }
            >
              {soundEnabled ? (
                <LuVolume2 className="w-4 h-4" />
              ) : (
                <LuVolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading || !searchQuery.trim()}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition disabled:opacity-50"
              title="Refresh Data Tamu"
            >
              <LuRefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`}
              />
            </button>

            {/* Scanner Link */}
            <Link
              href="/reservations"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
              title="Buka Kamera Scanner QR"
            >
              <LuQrCode className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Scanner QR</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* ========================================================================= */}
        {/* SEARCH BAR */}
        {/* ========================================================================= */}
        <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl">
          {/* Main Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-amber-400">
              <LuSearch className="w-5 h-5" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama tamu, kode tiket (misal 99796), atau no HP... (Tekan '/' untuk fokus)"
              className="w-full pl-11 sm:pl-12 pr-10 py-3 sm:py-3.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                title="Hapus pencarian (Esc)"
              >
                <LuX className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GUEST LIST / TABLE */}
        {/* ========================================================================= */}
        {isLoading ? (
          <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-amber-300 font-medium">
              Memuat data tamu undangan...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Menghubungkan ke database reservasi
            </p>
          </div>
        ) : !isSearching ? (
          /* Tampilan awal: belum mencari, daftar muncul hanya ketika di search (seperti di list-guest) */
          <div className="relative overflow-hidden bg-linear-to-b from-[#121622]/90 to-[#0e111a]/90 border border-amber-500/20 rounded-3xl p-8 sm:p-12 text-center shadow-2xl backdrop-blur-sm">
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="relative z-10 max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-inner">
                <LuSearch className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide font-playfair">
                  Cari Nama Tamu atau Kode Tiket
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Ketik nama tamu, kode reservasi 5-digit pada kolom pencarian
                  di atas untuk melakukan check-in kehadiran.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <LuUserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Pencarian dengan <strong>Nama</strong>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <LuQrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Pencarian dengan <strong>Kode Tiket</strong>
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <LuSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              Tidak Ada Tamu Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
              Tidak ditemukan tamu dengan kata kunci &quot;
              <span className="text-amber-300 font-medium">
                {searchQuery.trim()}
              </span>
              &quot;. Periksa kembali ejaan nama atau gunakan kode tiket
              5-digit.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedSearch("");
                  searchInputRef.current?.focus();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
              >
                Reset Pencarian
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header info hasil pencarian (seperti di list-guest) */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <p>
                Menemukan{" "}
                <strong className="text-white font-mono font-bold">
                  {filteredGuests.length}
                </strong>{" "}
                tamu untuk kata kunci &ldquo;
                <span className="text-amber-300 font-semibold">
                  {debouncedSearch || searchQuery}
                </span>
                &rdquo;
              </p>
            </div>
            {/* ========================================================================= */}
            {/* MOBILE VIEW (CARD LIST for screens < 768px) */}
            {/* ========================================================================= */}
            <div className="md:hidden space-y-3">
              {filteredGuests.map((guest, idx) => {
                const isCheckedIn = Boolean(
                  guest.is_present || guest.status?.toLowerCase() === "hadir",
                );
                const isProcessing = checkingInCode === guest.code;
                const isRecentlyCheckedIn = recentlyCheckedInCodes.has(
                  guest.code,
                );
                const defaultPax =
                  guest.total_guests || guest.quota_guests || 1;

                return (
                  <motion.div
                    key={guest.code || guest.id || idx}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      isRecentlyCheckedIn
                        ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40"
                        : isCheckedIn
                          ? "bg-[#0b1411] border-emerald-500/20"
                          : "bg-[#0e111a] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-white text-base truncate">
                            {guest.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <button
                            type="button"
                            onClick={() => handleCopy(guest.code, guest.code)}
                            className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-xs flex items-center gap-1 active:scale-95 transition"
                            title="Klik untuk salin kode"
                          >
                            <span>#{guest.code}</span>
                            {copiedCode === guest.code ? (
                              <LuCheck className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <LuCopy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                          <span>•</span>
                          <span className="font-medium text-slate-300">
                            {defaultPax} pax
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <LuCircleCheck className="w-3.5 h-3.5" />
                            Hadir
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Belum Hadir
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attended timestamp if present */}
                    {isCheckedIn && guest.attended_at && (
                      <div className="text-[11px] text-emerald-400/80 mb-3 flex items-center gap-1">
                        <LuClock className="w-3 h-3" />
                        <span>
                          Hadir pada {formatDateTime(guest.attended_at)}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      {!isCheckedIn ? (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(guest)}
                          disabled={isProcessing}
                          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <LuCheck className="w-4 h-4" />
                              <span>Check-In</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-white/2 rounded-xl p-2.5 px-3 border border-white/5">
                          <LuCheck className="w-4 h-4" />
                          <span>Tercatat Hadir</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setDetailGuest(guest)}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                        title="Lihat Detail & QR"
                      >
                        <LuQrCode className="w-4 h-4 text-amber-300" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* DESKTOP TABLE VIEW (>= 768px) */}
            {/* ========================================================================= */}
            <div className="hidden md:block bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2 text-slate-400 font-medium">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Nama Tamu Undangan</th>
                      <th className="py-3 px-4">Kode Tiket</th>
                      <th className="py-3 px-4">Pax</th>
                      <th className="py-3 px-4">Status Kehadiran</th>
                      <th className="py-3 px-4 text-right">Aksi Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredGuests.map((guest, idx) => {
                      const isCheckedIn = Boolean(
                        guest.is_present ||
                        guest.status?.toLowerCase() === "hadir",
                      );
                      const isProcessing = checkingInCode === guest.code;
                      const isRecentlyCheckedIn = recentlyCheckedInCodes.has(
                        guest.code,
                      );
                      const defaultPax =
                        guest.total_guests || guest.quota_guests || 1;

                      return (
                        <tr
                          key={guest.code || guest.id || idx}
                          className={`transition ${
                            isRecentlyCheckedIn
                              ? "bg-emerald-950/40"
                              : isCheckedIn
                                ? "bg-emerald-950/15 hover:bg-emerald-950/25"
                                : "hover:bg-white/2"
                          }`}
                        >
                          {/* Index */}
                          <td className="py-3 px-4 text-center text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>

                          {/* Nama Tamu */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isCheckedIn
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-white/5 text-amber-300 border border-white/10"
                                }`}
                              >
                                {guest.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-white block text-sm truncate">
                                  {guest.name}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Kode Tiket */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleCopy(guest.code, guest.code)}
                              className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs tracking-wider inline-flex items-center gap-1.5 hover:bg-amber-500/20 active:scale-95 transition"
                              title="Salin Kode Tiket"
                            >
                              <span>{guest.code}</span>
                              {copiedCode === guest.code ? (
                                <LuCheck className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <LuCopy className="w-3 h-3 text-amber-400/60" />
                              )}
                            </button>
                          </td>

                          {/* Pax */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-200">
                              {defaultPax} Orang
                            </span>
                          </td>

                          {/* Status Kehadiran */}
                          <td className="py-3 px-4">
                            <div className="flex flex-col items-start gap-1">
                              {isCheckedIn ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <LuCircleCheck className="w-3.5 h-3.5" />
                                  Sudah Hadir
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                  Belum Hadir
                                </span>
                              )}

                              {isCheckedIn && guest.attended_at && (
                                <span className="text-[11px] text-emerald-400/80 flex items-center gap-1">
                                  <LuClock className="w-3 h-3" />
                                  {formatDateTime(guest.attended_at)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Aksi Button */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {!isCheckedIn ? (
                                <button
                                  type="button"
                                  onClick={() => handleCheckIn(guest)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                                  title={`Tandai ${guest.name} hadir (${defaultPax} pax)`}
                                >
                                  {isProcessing ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                      <span>Proses...</span>
                                    </>
                                  ) : (
                                    <>
                                      <LuCheck className="w-3.5 h-3.5" />
                                      <span>Hadir</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <LuCheck className="w-3.5 h-3.5" />
                                  Hadir
                                </span>
                              )}

                              {/* Detail / QR modal button */}
                              <button
                                type="button"
                                onClick={() => setDetailGuest(guest)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition"
                                title="Lihat Tiket & Detail"
                              >
                                <LuQrCode className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL SUCCESS CHECK-IN (IDENTIK DENGAN HALAMAN /reservations) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {successModalData && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={handleCloseSuccessModal}
          >
            <motion.div
              key="success-checkin-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/8 border border-white/20 p-5 sm:p-7 backdrop-blur-2xl shadow-2xl text-center max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button X */}
              <button
                type="button"
                onClick={handleCloseSuccessModal}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition z-10 cursor-pointer"
                title="Tutup (Esc)"
              >
                <LuX className="w-5 h-5" />
              </button>

              {/* Decorative Glow */}
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2.5 sm:mb-3 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg ${
                  successModalData.is_already
                    ? "bg-linear-to-tr from-amber-500 to-yellow-400 shadow-amber-500/30"
                    : "bg-linear-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/30"
                }`}
              >
                <BsCheckLg />
              </motion.div>

              <p
                className={`text-[11px] tracking-widest uppercase font-semibold mb-0.5 ${
                  successModalData.is_already
                    ? "text-amber-300"
                    : "text-emerald-400"
                }`}
              >
                {successModalData.is_already
                  ? "Sudah Check-In Sebelumnya"
                  : "Check-in Berhasil!"}
              </p>

              <h2 className="text-xl sm:text-2xl font-playfair font-bold text-white mb-0.5">
                Selamat Datang
              </h2>
              <p className="font-alex-brush text-amber-200 text-2xl sm:text-3xl mb-2 sm:mb-3">
                {successModalData.guest.name}
              </p>

              <div className="my-2.5 sm:my-4 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 p-3 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70 border-b border-white/10 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <BsQrCode className="text-amber-300" /> Kode Reservasi
                  </span>
                  <span className="font-mono text-white text-xs sm:text-sm font-semibold tracking-wider">
                    {successModalData.guest.code}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/70 border-b border-white/10 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <BsPeople className="text-emerald-300" /> Tamu Hadir
                  </span>
                  <span className="text-emerald-400 font-bold text-xs sm:text-sm">
                    {successModalData.actual_guest} Orang
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <BsClock className="text-blue-300" /> Waktu Check-In
                  </span>
                  <span className="text-white/90 text-right text-[11px] sm:text-xs">
                    {formatModalDateTime(
                      successModalData.guest.attended_at ||
                        new Date().toISOString(),
                    )}
                  </span>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-white/70 italic mb-4">
                &ldquo;{successModalData.message}&rdquo;
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCloseSuccessModal}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-5 rounded-xl sm:rounded-full bg-linear-to-r from-amber-400 to-amber-300 text-black font-semibold text-xs sm:text-sm shadow-md hover:brightness-105 transition cursor-pointer"
                >
                  <BsArrowCounterclockwise className="text-base" />
                  <span>Tutup ({modalCountdown}s)</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL DETAIL GUEST / QR TICKET */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {detailGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e111a] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setDetailGuest(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <LuX className="w-5 h-5" />
              </button>

              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-2">
                  <LuQrCode className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Tiket Masuk Tamu
                </h3>
                <p className="text-xs text-amber-300 font-semibold">
                  {detailGuest.name}
                </p>
              </div>

              {/* QR Image */}
              <div className="bg-white p-3.5 rounded-2xl shadow-inner max-w-[210px] mx-auto mb-4 text-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                    buildInvitationUrl(detailGuest.name, detailGuest.code),
                  )}`}
                  alt={`QR Code ${detailGuest.name}`}
                  width={220}
                  height={220}
                  unoptimized
                  className="w-full h-auto aspect-square rounded-lg object-contain mx-auto"
                />
              </div>

              {/* Code Info */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-center mb-4">
                <span className="text-[11px] text-slate-400 block mb-0.5">
                  Kode Reservasi 5-Digit
                </span>
                <span className="font-mono text-xl font-bold text-amber-300 tracking-wider">
                  {detailGuest.code}
                </span>
              </div>

              {/* External Link */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      buildInvitationMessage(
                        detailGuest.name,
                        buildInvitationUrl(detailGuest.name, detailGuest.code),
                      ),
                      detailGuest.code,
                    )
                  }
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-1.5 transition"
                >
                  <LuCopy className="w-3.5 h-3.5" />
                  <span>Salin Undangan</span>
                </button>
                <a
                  href={buildInvitationUrl(detailGuest.name, detailGuest.code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-1.5 transition text-center"
                >
                  <LuExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Undangan</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
