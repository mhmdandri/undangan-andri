"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "motion/react";
import {
  LuSearch,
  LuQrCode,
  LuArrowLeft,
  LuRefreshCw,
  LuCircleCheck,
  LuCheck,
  LuUserCheck,
  LuUserPlus,
  LuClock,
  LuUsers,
  LuVolume2,
  LuVolumeX,
  LuX,
  LuSparkles,
  LuPhone,
  LuExternalLink,
  LuCopy,
  LuSlidersHorizontal,
} from "react-icons/lu";
import { getPublicApiUrl } from "@/utils/api";
import { playChime, unlockAudio } from "@/utils/qr";
import { buildInvitationUrl } from "@/utils/invitation";

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
  const [guests, setGuests] = useState<GuestCheckInItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "belum" | "hadir">(
    "all"
  );
  const [filterSource, setFilterSource] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Tracking state check-in
  const [checkingInCode, setCheckingInCode] = useState<string | null>(null);
  const [recentlyCheckedInCodes, setRecentlyCheckedInCodes] = useState<
    Set<string>
  >(new Set());
  const [lastCheckedInGuest, setLastCheckedInGuest] = useState<{
    guest: GuestCheckInItem;
    time: string;
    pax: number;
    isAlready: boolean;
  } | null>(null);

  // Modal Ubah Pax / Check-in Kustom
  const [paxModalGuest, setPaxModalGuest] = useState<GuestCheckInItem | null>(
    null
  );
  const [customPaxCount, setCustomPaxCount] = useState<number>(2);

  // Modal Info Tamu / QR Code
  const [detailGuest, setDetailGuest] = useState<GuestCheckInItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

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
    window.addEventListener("click", handleGesture, { passive: true, once: true });
    window.addEventListener("touchstart", handleGesture, { passive: true, once: true });
    window.addEventListener("keydown", handleGesture, { passive: true, once: true });

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
        !paxModalGuest &&
        !detailGuest
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape") {
        if (paxModalGuest) {
          setPaxModalGuest(null);
        } else if (detailGuest) {
          setDetailGuest(null);
        } else if (searchQuery) {
          setSearchQuery("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paxModalGuest, detailGuest, searchQuery]);

  // Debounce search 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all guests
  const fetchAllGuests = useCallback(async (isRefresh = false) => {
    const endpoints = Array.from(
      new Set([
        "/api/reservations?all=true",
        "http://localhost:8888/api/reservations?all=true",
        `${getPublicApiUrl()}/api/reservations?all=true`,
        "/api/reservations?limit=1000",
      ])
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

        if (res.ok && Array.isArray(json?.data)) {
          // Sort alphabetically by name
          const sorted = [...json.data].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "", "id", {
              sensitivity: "base",
            })
          );
          setGuests(sorted);
          loaded = true;
          break;
        }
      } catch {
        // Continue to fallback endpoint
      }
    }

    if (!loaded) {
      toast.error(
        "Gagal memuat daftar tamu dari backend. Pastikan server Go aktif."
      );
    } else if (isRefresh) {
      toast.success("Daftar tamu berhasil diperbarui!");
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  // Initial load
  useEffect(() => {
    let isCancelled = false;

    const timer = setTimeout(() => {
      if (!isCancelled) {
        fetchAllGuests();
      }
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [fetchAllGuests]);

  // Check-In Handler
  const handleCheckIn = async (
    guest: GuestCheckInItem,
    customPax?: number
  ) => {
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

    const checkInEndpoints = Array.from(
      new Set([
        "/api/reservations/check-in",
        "http://localhost:8888/api/reservations/check-in",
        `${getPublicApiUrl()}/api/reservations/check-in`,
      ])
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

        if (res.ok && (json?.status === "success" || json?.status === "already_checked_in" || json?.data)) {
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
        })
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

      // Set last checked-in guest banner
      const updatedGuest: GuestCheckInItem = {
        ...guest,
        is_present: true,
        status: "hadir",
        attended_at: nowStr,
        total_guests: paxCount,
      };

      setLastCheckedInGuest({
        guest: updatedGuest,
        time: timeDisplay,
        pax: paxCount,
        isAlready,
      });

      // Toast feedback
      if (isAlready) {
        toast.info(
          `ℹ️ Tamu "${guest.name}" sudah tercatat hadir sebelumnya.`
        );
      } else {
        toast.success(
          `🎉 Berhasil! "${guest.name}" tercatat HADIR (${paxCount} pax)`
        );
      }

      // Close modal if open
      setPaxModalGuest(null);
    } else {
      if (soundEnabled) {
        playChime("error");
      }
      toast.error(
        errorMessage ||
          "Gagal memproses check-in. Pastikan server backend terhubung."
      );
    }

    setCheckingInCode(null);
  };

  // Open Pax Adjust Modal
  const openPaxModal = (guest: GuestCheckInItem) => {
    setPaxModalGuest(guest);
    setCustomPaxCount(guest.total_guests || guest.quota_guests || 2);
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
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return dateStr;
    }
  };

  // Filtered & Searched Guests
  const filteredGuests = useMemo(() => {
    const q = debouncedSearch.toLowerCase();

    return guests.filter((g) => {
      // Search match
      const nameMatch = (g.name || "").toLowerCase().includes(q);
      const codeMatch = (g.code || "").toLowerCase().includes(q);
      const phoneMatch = (g.phone || "").toLowerCase().includes(q);
      const matchesSearch = !q || nameMatch || codeMatch || phoneMatch;

      // Status match
      const isCheckedIn = Boolean(
        g.is_present || g.status?.toLowerCase() === "hadir"
      );
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "hadir" && isCheckedIn) ||
        (filterStatus === "belum" && !isCheckedIn);

      // Source match
      const matchesSource =
        filterSource === "all" ||
        (filterSource === "pre_registered" && g.source === "pre_registered") ||
        (filterSource === "self_registered" && g.source !== "pre_registered");

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [guests, debouncedSearch, filterStatus, filterSource]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = guests.length;
    const hadir = guests.filter(
      (g) => g.is_present || g.status?.toLowerCase() === "hadir"
    ).length;
    const belum = total - hadir;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, belum, percentage };
  }, [guests]);

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-slate-100 font-sans pb-28 selection:bg-amber-500/30 selection:text-amber-200">
      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="border-b border-white/10 bg-[#0d1017]/95 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition shrink-0 border border-white/5"
              title="Kembali ke Admin Dashboard"
            >
              <LuArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-playfair text-base sm:text-lg font-bold bg-linear-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent truncate">
                  Check-in Tamu
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Meja Penerima Tamu
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden xs:block">
                Cari nama tamu &amp; klik Hadir jika tamu tidak bawa barcode
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
                    : "Suara check-in diaktifkan!"
                );
              }}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
              }`}
              title={soundEnabled ? "Matikan Suara Chime" : "Nyalakan Suara Chime"}
            >
              {soundEnabled ? (
                <LuVolume2 className="w-4 h-4" />
              ) : (
                <LuVolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchAllGuests(true);
              }}
              disabled={isRefreshing || isLoading}
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

            {/* Admin Dashboard Link */}
            <Link
              href="/admin"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition"
              title="Ke Admin Database Tamu"
            >
              <LuUserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Database Tamu</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {/* ========================================================================= */}
        {/* BANNER NOTIFIKASI TAMU BARU SAJA HADIR */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {lastCheckedInGuest && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-emerald-950/60 via-emerald-900/40 to-transparent border border-emerald-500/40 shadow-lg shadow-emerald-950/50 flex items-center justify-between gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <LuCircleCheck className="w-5 h-5 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                      Check-in Berhasil
                    </span>
                    <span className="text-[11px] text-slate-400">
                      pukul {lastCheckedInGuest.time}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white truncate">
                    {lastCheckedInGuest.guest.name}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Kode Tiket:{" "}
                    <span className="font-mono font-bold text-amber-300">
                      {lastCheckedInGuest.guest.code}
                    </span>{" "}
                    • Pax:{" "}
                    <span className="font-semibold text-white">
                      {lastCheckedInGuest.pax} Orang
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setLastCheckedInGuest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
                title="Tutup Notifikasi"
              >
                <LuX className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* STATS OVERVIEW CARDS */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total Tamu */}
          <div className="bg-linear-to-b from-[#131722] to-[#0e111a] border border-white/10 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium">
                Total Tamu
              </span>
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                <LuUsers className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">
              {stats.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Data terdaftar di sistem
            </div>
          </div>

          {/* Sudah Hadir */}
          <div className="bg-linear-to-b from-[#0c221a] to-[#0a1813] border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-emerald-300 font-medium">
                Sudah Hadir
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LuCircleCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-300 font-mono">
              {stats.hadir}
            </div>
            <div className="text-[11px] text-emerald-400/70 mt-1">
              Check-in terkonfirmasi
            </div>
          </div>

          {/* Belum Hadir */}
          <div className="bg-linear-to-b from-[#1e1b12] to-[#14120e] border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-amber-300 font-medium">
                Belum Hadir
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <LuClock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">
              {stats.belum}
            </div>
            <div className="text-[11px] text-amber-400/70 mt-1">
              Menunggu kedatangan
            </div>
          </div>

          {/* Persentase Kehadiran */}
          <div className="bg-linear-to-b from-[#131722] to-[#0e111a] border border-white/10 rounded-2xl p-3.5 sm:p-4 relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium">
                Persentase Kehadiran
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <LuSparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-xl sm:text-2xl font-bold text-white font-mono">
                {stats.percentage}%
              </div>
              <span className="text-[11px] text-slate-400">
                {stats.hadir} dari {stats.total}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEARCH BAR & CONTROLS */}
        {/* ========================================================================= */}
        <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl">
          {/* Main Search Input */}
          <div className="relative mb-4">
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
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition"
                title="Hapus pencarian (Esc)"
              >
                <LuX className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters & Status Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-white/5">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                Semua ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus("belum")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  filterStatus === "belum"
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                    : "bg-white/5 text-amber-300/80 hover:bg-white/10"
                }`}
              >
                Belum Hadir ({stats.belum})
              </button>
              <button
                onClick={() => setFilterStatus("hadir")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  filterStatus === "hadir"
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20"
                    : "bg-white/5 text-emerald-400/80 hover:bg-white/10"
                }`}
              >
                Sudah Hadir ({stats.hadir})
              </button>
            </div>

            {/* Source Filter Dropdown & Results Counter */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <LuSlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="pre_registered">VIP (Pre-reg)</option>
                  <option value="self_registered">Mandiri (RSVP)</option>
                </select>
              </div>

              <div className="text-slate-400">
                Menampilkan{" "}
                <span className="font-semibold text-white font-mono">
                  {filteredGuests.length}
                </span>{" "}
                tamu
              </div>
            </div>
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
        ) : filteredGuests.length === 0 ? (
          <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <LuSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">
              Tidak Ada Tamu Ditemukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-5">
              {searchQuery
                ? `Tidak ditemukan tamu dengan kata kunci "${searchQuery}". Periksa kembali ejaan nama atau gunakan kode 5-digit.`
                : "Belum ada tamu yang sesuai dengan filter yang dipilih."}
            </p>
            {searchQuery && (
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition cursor-pointer"
                >
                  Reset Pencarian
                </button>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                >
                  <LuUserPlus className="w-4 h-4" />
                  <span>Tambah Tamu Dadakan</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* ========================================================================= */}
            {/* MOBILE VIEW (CARD LIST for screens < 768px) */}
            {/* ========================================================================= */}
            <div className="md:hidden space-y-3">
              {filteredGuests.map((guest, idx) => {
                const isCheckedIn = Boolean(
                  guest.is_present || guest.status?.toLowerCase() === "hadir"
                );
                const isProcessing = checkingInCode === guest.code;
                const isRecentlyCheckedIn = recentlyCheckedInCodes.has(guest.code);
                const defaultPax = guest.total_guests || guest.quota_guests || 1;

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
                          {guest.source === "pre_registered" ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                              VIP
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                              Mandiri
                            </span>
                          )}
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
                          {guest.phone && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {guest.phone}
                              </span>
                            </>
                          )}
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
                            Belum
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attended timestamp if present */}
                    {isCheckedIn && guest.attended_at && (
                      <div className="text-[11px] text-emerald-400/80 mb-3 flex items-center gap-1">
                        <LuClock className="w-3 h-3" />
                        <span>Hadir pada {formatDateTime(guest.attended_at)}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      {!isCheckedIn ? (
                        <>
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
                                <span>Hadir ({defaultPax} pax)</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openPaxModal(guest)}
                            disabled={isProcessing}
                            className="py-2.5 px-3 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                            title="Ubah jumlah pax tamu sebelum check-in"
                          >
                            Ubah Pax
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-between text-xs text-slate-400 bg-white/2 rounded-xl p-2 px-3 border border-white/5">
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                            <LuCheck className="w-4 h-4" />
                            Tercatat Hadir
                          </span>
                          <button
                            type="button"
                            onClick={() => openPaxModal(guest)}
                            className="text-amber-400 hover:text-amber-300 font-medium text-[11px] underline"
                          >
                            Ubah Pax
                          </button>
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
                      <th className="py-3 px-4">Kategori</th>
                      <th className="py-3 px-4">Pax</th>
                      <th className="py-3 px-4">Status Kehadiran</th>
                      <th className="py-3 px-4 text-right">Aksi Check-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredGuests.map((guest, idx) => {
                      const isCheckedIn = Boolean(
                        guest.is_present || guest.status?.toLowerCase() === "hadir"
                      );
                      const isProcessing = checkingInCode === guest.code;
                      const isRecentlyCheckedIn = recentlyCheckedInCodes.has(guest.code);
                      const defaultPax = guest.total_guests || guest.quota_guests || 1;

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
                                {guest.phone ? (
                                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                    <LuPhone className="w-3 h-3 text-slate-500" />
                                    {guest.phone}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    Penerima Tamu Manual
                                  </span>
                                )}
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

                          {/* Kategori */}
                          <td className="py-3 px-4">
                            {guest.source === "pre_registered" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                VIP (Pre-reg)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                                Mandiri (RSVP)
                              </span>
                            )}
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
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCheckIn(guest)}
                                    disabled={isProcessing}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                                    title={`Tandai ${guest.name} hadir dengan ${defaultPax} pax`}
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

                                  <button
                                    type="button"
                                    onClick={() => openPaxModal(guest)}
                                    disabled={isProcessing}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                                    title="Ubah Pax"
                                  >
                                    <LuUsers className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <LuCheck className="w-3.5 h-3.5" />
                                    Hadir
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openPaxModal(guest)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-300 transition"
                                    title="Ubah Pax Kehadiran"
                                  >
                                    <LuUsers className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
      {/* MODAL ADJUST PAX */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {paxModalGuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0e111a] border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={() => setPaxModalGuest(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <LuX className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
                  <LuUserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Konfirmasi Kehadiran
                </h3>
                <p className="text-xs text-amber-300 font-semibold mt-0.5">
                  {paxModalGuest.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Kode Tiket:{" "}
                  <span className="font-mono font-bold text-white">
                    #{paxModalGuest.code}
                  </span>
                </p>
              </div>

              {/* Pax Counter Stepper */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 mb-5 text-center">
                <span className="text-xs text-slate-400 block mb-2">
                  Jumlah Tamu yang Hadir Fisik
                </span>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomPaxCount((prev) => Math.max(1, prev - 1))
                    }
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    -
                  </button>
                  <div className="text-3xl font-mono font-bold text-amber-300 min-w-16">
                    {customPaxCount}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomPaxCount((prev) => Math.min(10, prev + 1))
                    }
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  Standar kuota: {paxModalGuest.quota_guests || 2} Pax
                </span>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaxModalGuest(null)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleCheckIn(paxModalGuest, customPaxCount)}
                  disabled={checkingInCode === paxModalGuest.code}
                  className="flex-2 py-3 px-4 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-98 transition cursor-pointer disabled:opacity-50"
                >
                  {checkingInCode === paxModalGuest.code
                    ? "Memproses..."
                    : `Simpan & Hadir (${customPaxCount} pax)`}
                </button>
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
                    buildInvitationUrl(detailGuest.name, detailGuest.code)
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
                      buildInvitationUrl(detailGuest.name, detailGuest.code),
                      detailGuest.code
                    )
                  }
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center gap-1.5 transition"
                >
                  <LuCopy className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
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
