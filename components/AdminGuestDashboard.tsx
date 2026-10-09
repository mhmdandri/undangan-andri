"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  LuUpload,
  LuFileSpreadsheet,
  LuDownload,
  LuCircleCheck,
  LuCopy,
  LuExternalLink,
  LuRefreshCw,
  LuTrash2,
  LuPlus,
  LuSearch,
  LuQrCode,
  LuArrowLeft,
  LuCheck,
} from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";
import { getPublicApiUrl } from "@/utils/api";

type ExcelGuestRow = {
  id_temp?: string;
  name: string;
  phone: string;
  email: string;
  quota_guests: number;
};

type ImportedGuest = {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  code: string;
  quota_guests?: number;
  total_guests?: number;
  status?: string;
  source?: string;
  is_present?: boolean;
  invite_url?: string;
  created_at?: string;
};

export default function AdminGuestDashboard() {
  const [activeTab, setActiveTab] = useState<"import" | "database">("import");

  // State Import
  const [parsedRows, setParsedRows] = useState<ExcelGuestRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importedResult, setImportedResult] = useState<ImportedGuest[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedQrGuest, setSelectedQrGuest] = useState<ImportedGuest | null>(null);

  // State Database Tamu
  const [dbGuests, setDbGuests] = useState<ImportedGuest[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enable normal scrolling for admin dashboard
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

  // Load Database Guests on mount or tab change
  const fetchDbGuests = async () => {
    setIsLoadingDb(true);
    const endpoints = Array.from(
      new Set([
        "/api/reservations",
        "http://localhost:8888/api/reservations",
        `${getPublicApiUrl()}/api/reservations`,
      ])
    );

    let loaded = false;
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });

        const rawText = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(rawText);
        } catch {
          json = null;
        }

        if (res.ok && Array.isArray(json?.data)) {
          setDbGuests(json.data);
          loaded = true;
          break;
        }
      } catch {
        // Try next endpoint fallback
      }
    }

    if (!loaded) {
      toast.error("Gagal mengambil data reservasi dari server backend.");
    }
    setIsLoadingDb(false);
  };

  useEffect(() => {
    if (activeTab === "database") {
      fetchDbGuests();
    }
  }, [activeTab]);

  // Smart cleaner untuk nomor telepon / WhatsApp dari Excel
  const cleanPhoneValue = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    let str = String(val).trim();
    if (!str) return "";

    // Tangani notasi eksponensial dari Excel, e.g. 8.123456789e+10
    if (/[eE]/.test(str)) {
      const num = Number(str);
      if (!isNaN(num)) {
        str = num.toLocaleString("fullwide", { useGrouping: false });
      }
    }

    // Ambil angka saja
    const digits = str.replace(/\D/g, "");
    if (!digits) return str;

    // Jika diawali 8 dan panjang 9-14 (Excel sering membuang angka 0 di depan)
    if (digits.startsWith("8") && digits.length >= 9 && digits.length <= 14) {
      return "0" + digits;
    }
    // Jika diawali 628
    if (digits.startsWith("628") && digits.length >= 10) {
      return "0" + digits.slice(2);
    }
    // Jika diawali 08
    if (digits.startsWith("0")) {
      return digits;
    }
    return digits;
  };

  // Normalizer Nomor WhatsApp (e.g. 0812... -> 62812...)
  const formatWhatsappNumber = (phoneStr: string): string => {
    let clean = (phoneStr || "").replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    } else if (clean.startsWith("8")) {
      clean = "62" + clean;
    }
    return clean;
  };

  // Generate Link WhatsApp dengan template pesan undangan pernikahan
  const generateWaLink = (
    phone: string,
    name: string,
    code: string,
    inviteUrl: string,
  ) => {
    const cleanPhone = formatWhatsappNumber(phone);
    const text = `Kepada Yth. *${name}*,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada pernikahan kami:

*The Wedding of Andri & Cica*
📅 Sabtu, 21 November 2026

Berikut tautan undangan digital dan tiket check-in reservasi Anda:
🔗 ${inviteUrl || `https://weddingofandricica.me?code=${code}`}

*Kode Reservasi Masuk:* *${code}*
(Tunjukkan QR Code di undangan ini saat tiba di meja penerima tamu).

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir. Terima kasih.

Salam hangat,
*Andri & Cica*`;

    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  // Copy helper
  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(identifier);
    toast.success("Link berhasil disalin ke clipboard!");
    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  // Download Contoh Template Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nama Tamu": "Budi Santoso",
        "No WhatsApp": "081234567890",
        Email: "budi@example.com",
        "Kuota Pax": 2,
      },
      {
        "Nama Tamu": "Siti Rahmawati",
        "No WhatsApp": "089876543210",
        Email: "",
        "Kuota Pax": 1,
      },
      {
        "Nama Tamu": "Keluarga Hendra Pratama",
        "No WhatsApp": "085678901234",
        Email: "",
        "Kuota Pax": 3,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Tamu");

    // Auto set column width
    worksheet["!cols"] = [
      { wch: 30 }, // Nama
      { wch: 20 }, // WA
      { wch: 25 }, // Email
      { wch: 12 }, // Kuota
    ];

    XLSX.writeFile(workbook, "Template_Import_Tamu_Undangan.xlsx");
    toast.info("Template Excel berhasil diunduh!");
  };

  // Parsing File Excel (.xlsx, .xls, .csv)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, {
          type: "array",
          cellText: true,
          cellDates: false,
        });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(
          worksheet,
          { raw: false, defval: "" },
        );

        if (!json || json.length === 0) {
          toast.warning("File Excel kosong atau format tidak sesuai.");
          return;
        }

        const rows: ExcelGuestRow[] = json
          .map((row, index) => {
            let name = "";
            let phone = "";
            let email = "";
            let quota = 2;

            // Pass 1: Identifikasi berdasarkan nama kolom header
            for (const [key, val] of Object.entries(row)) {
              const k = key.toLowerCase().trim();
              const cleanKey = k.replace(/[\s\._\-#]/g, "");
              const v = String(val ?? "").trim();
              if (!v) continue;

              // Kolom Nama
              if (
                cleanKey.includes("nama") ||
                cleanKey.includes("name") ||
                cleanKey.includes("tamu") ||
                cleanKey.includes("guest")
              ) {
                if (!name) name = v;
              }
              // Kolom WhatsApp / HP / Telepon
              else if (
                cleanKey.includes("wa") ||
                cleanKey.includes("whatsapp") ||
                cleanKey.includes("phone") ||
                cleanKey.includes("hp") ||
                cleanKey.includes("telepon") ||
                cleanKey.includes("telpon") ||
                cleanKey.includes("telp") ||
                cleanKey.includes("kontak") ||
                cleanKey.includes("contact") ||
                cleanKey.includes("mobile") ||
                cleanKey.includes("handphone") ||
                cleanKey.includes("call") ||
                cleanKey.includes("cellular") ||
                cleanKey.includes("nohp") ||
                cleanKey.includes("nowa")
              ) {
                if (!phone) phone = cleanPhoneValue(v);
              }
              // Kolom Email
              else if (
                cleanKey.includes("email") ||
                cleanKey.includes("surel") ||
                cleanKey.includes("mail")
              ) {
                if (!email) email = v;
              }
              // Kolom Kuota Pax
              else if (
                cleanKey.includes("kuota") ||
                cleanKey.includes("quota") ||
                cleanKey.includes("pax") ||
                cleanKey.includes("jumlah") ||
                cleanKey.includes("total")
              ) {
                const parsedQ = parseInt(v, 10);
                if (!isNaN(parsedQ) && parsedQ > 0) quota = parsedQ;
              }
            }

            // Pass 2: Jika No WA masih belum ketemu, deteksi otomatis dari isi nilai baris!
            if (!phone) {
              for (const [key, val] of Object.entries(row)) {
                const cleanKey = key.toLowerCase().replace(/[\s\._\-#]/g, "");
                if (
                  cleanKey.includes("nama") ||
                  cleanKey.includes("name") ||
                  cleanKey.includes("email") ||
                  cleanKey.includes("mail")
                ) {
                  continue;
                }

                const v = String(val ?? "").trim();
                const digits = v.replace(/\D/g, "");
                // Ciri khas nomor HP Indonesia (9-14 digit, diawali 8, 08, 628, atau 0)
                if (
                  digits.length >= 9 &&
                  digits.length <= 15 &&
                  (digits.startsWith("08") ||
                    digits.startsWith("8") ||
                    digits.startsWith("628") ||
                    digits.startsWith("0"))
                ) {
                  phone = cleanPhoneValue(v);
                  break;
                }
              }
            }

            // Pass 3: Fallback nama jika kosong
            if (!name) {
              for (const [key, val] of Object.entries(row)) {
                const cleanKey = key.toLowerCase().replace(/[\s\._\-#]/g, "");
                if (
                  cleanKey.includes("wa") ||
                  cleanKey.includes("phone") ||
                  cleanKey.includes("email")
                ) {
                  continue;
                }
                const str = String(val ?? "").trim();
                if (
                  str &&
                  str.length > 1 &&
                  !/^\d+$/.test(str) &&
                  !str.includes("@")
                ) {
                  name = str;
                  break;
                }
              }
            }

            return {
              id_temp: `row_${Date.now()}_${index}`,
              name,
              phone,
              email,
              quota_guests: quota,
            };
          })
          .filter((r) => r.name.length > 0);

        if (rows.length === 0) {
          toast.error("Tidak ditemukan kolom nama tamu dalam file Excel.");
          return;
        }

        setParsedRows(rows);
        const withPhoneCount = rows.filter((r) => r.phone.length > 0).length;
        toast.success(
          `Berhasil membaca ${rows.length} data calon tamu (${withPhoneCount} No WhatsApp terisi)!`,
        );
      } catch (err) {
        console.error("Error parsing excel:", err);
        toast.error("Gagal membaca file Excel. Pastikan format valid.");
      }
    };

    reader.readAsArrayBuffer(file);
    // Reset file input agar bisa upload file sama jika diubah
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Hapus baris preview
  const handleDeleteRow = (idTemp?: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id_temp !== idTemp));
  };

  // Tambah baris manual di preview
  const handleAddManualRow = () => {
    setParsedRows((prev) => [
      ...prev,
      {
        id_temp: `manual_${Date.now()}`,
        name: "",
        phone: "",
        email: "",
        quota_guests: 2,
      },
    ]);
  };

  // Update nilai baris preview
  const handleUpdateRow = (
    idTemp: string | undefined,
    field: keyof ExcelGuestRow,
    value: string | number,
  ) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id_temp === idTemp ? { ...r, [field]: value } : r)),
    );
  };

  // Kirim data ke API backend
  const handleSubmitImport = async () => {
    const validRows = parsedRows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      toast.warning("Tidak ada tamu yang memiliki nama valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        guests: validRows.map((r) => ({
          name: r.name.trim(),
          phone: r.phone.trim(),
          email: r.email.trim(),
          quota_guests: Number(r.quota_guests) || 2,
        })),
      };

      const targetEndpoints = Array.from(
        new Set([
          "/api/reservations/batch",
          "http://localhost:8888/api/reservations/batch",
          `${getPublicApiUrl()}/api/reservations/batch`,
        ])
      );

      let successData: { data?: ImportedGuest[]; message?: string } | null = null;
      let lastErrorMessage = "";

      for (const endpoint of targetEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const rawText = await res.text();
          let json: any = null;
          try {
            json = JSON.parse(rawText);
          } catch {
            json = null;
          }

          if (res.ok && json) {
            successData = json;
            break;
          }

          if (json?.error || json?.detail) {
            lastErrorMessage = json.error || json.detail;
            if (res.status === 400) break; // Bad request validation error
          } else if (rawText) {
            lastErrorMessage = rawText;
          }
        } catch (err: any) {
          lastErrorMessage = err?.message || String(err);
        }
      }

      if (!successData) {
        throw new Error(
          lastErrorMessage ||
            "Gagal import data. Pastikan server Go port 8888 aktif dan route /api/reservations/batch terpasang."
        );
      }

      const createdGuests: ImportedGuest[] = Array.isArray(successData?.data)
        ? successData.data
        : [];

      setImportedResult(createdGuests);
      setParsedRows([]);
      setFileName("");
      toast.success(
        `Sukses! ${createdGuests.length} tamu berhasil diimport dan dibuatkan link undangan.`
      );
    } catch (err: unknown) {
      console.error("Submit import error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Import gagal: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export hasil yang baru saja diimport ke Excel
  const handleExportResult = (dataToExport: ImportedGuest[]) => {
    if (!dataToExport || dataToExport.length === 0) return;

    const exportRows = dataToExport.map((g, idx) => ({
      No: idx + 1,
      "Nama Tamu": g.name,
      "No WhatsApp": g.phone || "-",
      Email: g.email || "-",
      "Kode Reservasi": g.code,
      "Jatah Kuota": g.quota_guests || g.total_guests || 2,
      "Link Undangan Digital":
        g.invite_url || `https://weddingofandricica.me?code=${g.code}`,
      "Link Gambar QR Code": `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
        g.invite_url || `https://weddingofandricica.me?code=${g.code}`
      )}`,
      Status: g.is_present
        ? "Sudah Hadir"
        : g.status === "konfirmasi_hadir"
          ? "Konfirmasi Hadir"
          : "Belum Hadir",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Import");

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 12 },
      { wch: 45 },
      { wch: 55 },
      { wch: 18 },
    ];

    XLSX.writeFile(
      workbook,
      `Daftar_Undangan_Andri_Cica_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    toast.success("File Excel berhasil diekspor!");
  };

  // Filter list database tamu
  const filteredDbGuests = useMemo(() => {
    return dbGuests.filter((g) => {
      const matchesSearch =
        (g.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.phone || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource =
        filterSource === "all" ||
        (filterSource === "pre_registered" && g.source === "pre_registered") ||
        (filterSource === "self_registered" && g.source !== "pre_registered");

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "hadir" &&
          (g.is_present || g.status?.toLowerCase() === "hadir")) ||
        (filterStatus === "belum" &&
          !g.is_present &&
          g.status?.toLowerCase() !== "hadir");

      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [dbGuests, searchQuery, filterSource, filterStatus]);

  // Statistik Database
  const stats = useMemo(() => {
    const total = dbGuests.length;
    const hadir = dbGuests.filter(
      (g) => g.is_present || g.status?.toLowerCase() === "hadir",
    ).length;
    const preReg = dbGuests.filter((g) => g.source === "pre_registered").length;
    const selfReg = total - preReg;
    return { total, hadir, preReg, selfReg };
  }, [dbGuests]);

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-slate-100 font-sans pb-36 selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden overflow-y-auto">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#0d1017]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/reservations"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Ke Halaman Check-in Scanner"
            >
              <LuArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-playfair text-lg sm:text-xl font-bold bg-linear-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                VIP Guest Manager & Excel Importer
              </h1>
              <p className="text-xs text-slate-400">
                The Wedding of Andri & Cica
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/reservations"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
            >
              <LuQrCode className="w-4 h-4" />
              Scanner Check-in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("import")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "import"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <LuFileSpreadsheet className="w-4 h-4" />
              Import Excel & Sebar Link
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "database"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <LuCircleCheck className="w-4 h-4" />
              Semua Tamu ({dbGuests.length})
            </button>
          </div>

          {activeTab === "import" && (
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 hover:text-amber-200 transition"
            >
              <LuDownload className="w-4 h-4" />
              Unduh Template Excel
            </button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: IMPORT EXCEL */}
        {/* ========================================================================= */}
        {activeTab === "import" && (
          <div className="space-y-8">
            {/* Upload Area */}
            <div className="bg-linear-to-b from-[#131722] to-[#0e111a] border border-white/10 rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />

              <div className="max-w-md mx-auto flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
                  <LuUpload className="w-8 h-8 animate-pulse" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">
                  Upload File Daftar Tamu (.xlsx / .csv)
                </h3>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  Pilih file Excel berisi nama tamu dan nomor WhatsApp. Sistem
                  akan otomatis mengenerate kode 5-digit dan link personal siap
                  dishare.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="excel-file-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/25 transition active:scale-95"
                  >
                    <LuFileSpreadsheet className="w-4 h-4" />
                    Pilih File Excel
                  </label>

                  <button
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                  >
                    <LuDownload className="w-4 h-4 text-amber-400" />
                    Download Format Contoh
                  </button>
                </div>

                {fileName && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    <LuCircleCheck className="w-4 h-4" />
                    File terpilih: <strong>{fileName}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* PREVIEW TABLE SEBELUM SUBMIT */}
            {parsedRows.length > 0 && (
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Preview Data ({parsedRows.length} Tamu)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Periksa dan sesuaikan data di bawah sebelum disimpan ke
                      database.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddManualRow}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition"
                    >
                      <LuPlus className="w-3.5 h-3.5" />
                      Tambah Baris
                    </button>

                    <button
                      onClick={handleSubmitImport}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <LuRefreshCw className="w-4 h-4 animate-spin" />
                          Menyimpan ke DB...
                        </>
                      ) : (
                        <>
                          <LuCircleCheck className="w-4 h-4" />
                          Simpan & Generate Link ({parsedRows.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Table Data Preview */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-medium">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Nama Tamu</th>
                        <th className="py-2.5 px-3 min-w-[140px]">
                          No WhatsApp
                        </th>
                        <th className="py-2.5 px-3 min-w-40">
                          Email (Opsional)
                        </th>
                        <th className="py-2.5 px-3 w-24">Kuota Pax</th>
                        <th className="py-2.5 px-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={row.id_temp || idx}
                          className="hover:bg-white/2"
                        >
                          <td className="py-2 px-3 text-slate-500 font-mono text-xs">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.name}
                              placeholder="Nama Tamu..."
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.id_temp,
                                  "name",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.phone}
                              placeholder="081234..."
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.id_temp,
                                  "phone",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.email}
                              placeholder="email@..."
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.id_temp,
                                  "email",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={row.quota_guests}
                              onChange={(e) =>
                                handleUpdateRow(
                                  row.id_temp,
                                  "quota_guests",
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                              className="w-16 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white text-center focus:outline-none focus:border-amber-400"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={() => handleDeleteRow(row.id_temp)}
                              className="p-1 rounded text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Hapus baris"
                            >
                              <LuTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* HASIL SUKSES IMPORT DENGAN TOMBOL SHARE WHATSAPP & COPY */}
            {importedResult.length > 0 && (
              <div className="bg-[#0e111a] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
                      <LuCircleCheck className="w-3.5 h-3.5" />
                      Import Berhasil!
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Daftar Undangan & Link Siap Sebar ({importedResult.length}{" "}
                      Tamu)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Setiap tamu telah memiliki kode 5-digit unik dan link
                      undangan personal. Klik tombol WhatsApp untuk mengirimkan
                      undangan langsung.
                    </p>
                  </div>

                  <button
                    onClick={() => handleExportResult(importedResult)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 text-xs font-medium transition"
                  >
                    <LuDownload className="w-4 h-4" />
                    Download Hasil ke Excel
                  </button>
                </div>

                {/* Table Hasil Import */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-medium">
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3">Nama Tamu</th>
                        <th className="py-2.5 px-3">Kode Tiket</th>
                        <th className="py-2.5 px-3 text-center">QR Code</th>
                        <th className="py-2.5 px-3">No WhatsApp</th>
                        <th className="py-2.5 px-3 min-w-[220px]">
                          Link Undangan
                        </th>
                        <th className="py-2.5 px-3 text-right">Aksi Sebar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {importedResult.map((guest, idx) => {
                        const inviteUrl =
                          guest.invite_url ||
                          `https://weddingofandricica.me?code=${guest.code}`;
                        return (
                          <tr
                            key={guest.code || idx}
                            className="hover:bg-white/2"
                          >
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-white">
                              {guest.name}
                              <span className="block text-[11px] text-slate-400">
                                Jatah: {guest.quota_guests || 2} pax
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-xs tracking-wider">
                                {guest.code}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedQrGuest(guest)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium transition cursor-pointer shadow-sm"
                                title="Lihat dan Unduh QR Code Tiket"
                              >
                                <LuQrCode className="w-3.5 h-3.5" />
                                <span>Lihat QR</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300 text-xs">
                              {guest.phone || "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 max-w-xs">
                                <input
                                  type="text"
                                  readOnly
                                  value={inviteUrl}
                                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 font-mono truncate select-all"
                                />
                                <button
                                  onClick={() =>
                                    handleCopy(inviteUrl, guest.code)
                                  }
                                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition"
                                  title="Salin Link"
                                >
                                  {copiedCode === guest.code ? (
                                    <LuCheck className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <LuCopy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {guest.phone ? (
                                <a
                                  href={generateWaLink(
                                    guest.phone,
                                    guest.name,
                                    guest.code,
                                    inviteUrl,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20"
                                >
                                  <FaWhatsapp className="w-4 h-4" />
                                  Kirim WA
                                </a>
                              ) : (
                                <span className="text-slate-500 text-xs italic">
                                  No WA Kosong
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEMUA TAMU (DATABASE REPOSITORI) */}
        {/* ========================================================================= */}
        {activeTab === "database" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400">Total Tamu di DB</span>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400">
                  Pre-Registered (VIP)
                </span>
                <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {stats.preReg}
                </p>
              </div>
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400">
                  Mandiri / Self RSVP
                </span>
                <p className="text-2xl font-bold font-mono text-blue-300 mt-1">
                  {stats.selfReg}
                </p>
              </div>
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400">
                  Sudah Hadir di Venue
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {stats.hadir}
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <LuSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, kode reservasi, atau no WA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">Semua Jalur</option>
                  <option value="pre_registered">VIP (Pre-registered)</option>
                  <option value="self_registered">Mandiri (Self RSVP)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">Semua Kehadiran</option>
                  <option value="hadir">Sudah Hadir</option>
                  <option value="belum">Belum Hadir</option>
                </select>

                <button
                  onClick={fetchDbGuests}
                  disabled={isLoadingDb}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
                  title="Refresh Data"
                >
                  <LuRefreshCw
                    className={`w-4 h-4 ${isLoadingDb ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  onClick={() => handleExportResult(dbGuests)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                  title="Export Semua Tamu ke Excel"
                >
                  <LuDownload className="w-4 h-4" />
                  Export Excel
                </button>
              </div>
            </div>

            {/* List Table Database */}
            <div className="bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/2 text-slate-400 font-medium">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Nama Tamu</th>
                      <th className="py-3 px-4">Kode Tiket</th>
                      <th className="py-3 px-4">Jalur</th>
                      <th className="py-3 px-4">Kontak</th>
                      <th className="py-3 px-4">Status Check-in</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDbGuests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-slate-500"
                        >
                          {isLoadingDb
                            ? "Memuat data tamu..."
                            : "Tidak ada data tamu yang cocok."}
                        </td>
                      </tr>
                    ) : (
                      filteredDbGuests.map((guest, idx) => {
                        const inviteUrl = `https://weddingofandricica.me?code=${guest.code}`;
                        const isCheckedIn =
                          guest.is_present ||
                          guest.status?.toLowerCase() === "hadir";

                        return (
                          <tr
                            key={guest.code || guest.id || idx}
                            className="hover:bg-white/2 transition"
                          >
                            <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-white block">
                                {guest.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {guest.total_guests || guest.quota_guests || 1}{" "}
                                pax
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-xs tracking-wider">
                                {guest.code}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {guest.source === "pre_registered" ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                  VIP (Pre-reg)
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                                  Mandiri (RSVP)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-xs font-mono text-slate-300">
                                {guest.phone || guest.email || "-"}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isCheckedIn ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                  <LuCircleCheck className="w-3.5 h-3.5" />
                                  Hadir
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                  Belum Hadir
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() =>
                                    handleCopy(inviteUrl, guest.code)
                                  }
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition"
                                  title="Salin Link Undangan"
                                >
                                  {copiedCode === guest.code ? (
                                    <LuCheck className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <LuCopy className="w-4 h-4" />
                                  )}
                                </button>

                                {guest.phone && (
                                  <a
                                    href={generateWaLink(
                                      guest.phone,
                                      guest.name,
                                      guest.code,
                                      inviteUrl,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition"
                                    title="Kirim Pesan WhatsApp"
                                  >
                                    <FaWhatsapp className="w-4 h-4" />
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedQrGuest(guest)}
                                  className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white transition cursor-pointer"
                                  title="Lihat & Download QR Code Tiket"
                                >
                                  <LuQrCode className="w-4 h-4" />
                                </button>

                                <a
                                  href={`https://weddingofandricica.me?code=${guest.code}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                                  title="Buka Undangan"
                                >
                                  <LuExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Preview & Download QR Code Tiket */}
      {selectedQrGuest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setSelectedQrGuest(null)}
        >
          <div
            className="bg-[#12151f] border border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedQrGuest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition"
              title="Tutup"
            >
              ✕
            </button>

            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Tiket Undangan &amp; Check-in
            </span>

            <h3 className="font-playfair text-xl font-bold text-white mt-3">
              {selectedQrGuest.name}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Jatah Kuota: {selectedQrGuest.quota_guests || selectedQrGuest.total_guests || 2} Pax
            </p>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-2xl max-w-[220px] mx-auto my-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
                  selectedQrGuest.invite_url ||
                    `https://weddingofandricica.me?code=${selectedQrGuest.code}`
                )}`}
                alt={`QR Code ${selectedQrGuest.name}`}
                className="w-48 h-48 object-contain mx-auto"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Tunjukkan QR Code ini kepada penerima tamu saat tiba di lokasi resepsi pernikahan
            </p>

            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 mb-4">
              <span className="text-[10px] text-amber-300/80 block uppercase font-mono tracking-wider">
                KODE RESERVASI
              </span>
              <span className="text-2xl font-mono font-bold text-amber-300 tracking-widest">
                {selectedQrGuest.code}
              </span>
            </div>

            <div className="flex gap-2">
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&data=${encodeURIComponent(
                  selectedQrGuest.invite_url ||
                    `https://weddingofandricica.me?code=${selectedQrGuest.code}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                download={`QR_${selectedQrGuest.name}_${selectedQrGuest.code}.png`}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 text-center"
              >
                Unduh Gambar QR
              </a>

              {selectedQrGuest.phone && (
                <a
                  href={generateWaLink(
                    selectedQrGuest.phone,
                    selectedQrGuest.name,
                    selectedQrGuest.code,
                    selectedQrGuest.invite_url ||
                      `https://weddingofandricica.me?code=${selectedQrGuest.code}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                  title="Kirim ke WhatsApp Tamu"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span>WA</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
