"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
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
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuUserPlus,
  LuUserCheck,
  LuUser,
  LuMail,
  LuPhone,
  LuSparkles,
} from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";
import { getPublicApiUrl } from "@/utils/api";
import { buildInvitationUrl, buildWhatsappShareUrl } from "@/utils/invitation";
import Image from "next/image";

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
  const [activeTab, setActiveTab] = useState<"import" | "database" | "add">(
    "import",
  );

  // State Tambah Tamu Dadakan (Input Langsung Tanpa Excel)
  const [addName, setAddName] = useState<string>("");
  const [addPhone, setAddPhone] = useState<string>("");
  const [addEmail, setAddEmail] = useState<string>("");
  const [addQuota, setAddQuota] = useState<number>(2);
  const [addDirectCheckIn, setAddDirectCheckIn] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newlyCreatedGuest, setNewlyCreatedGuest] =
    useState<ImportedGuest | null>(null);

  // State Import
  const [parsedRows, setParsedRows] = useState<ExcelGuestRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importedResult, setImportedResult] = useState<ImportedGuest[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedQrGuest, setSelectedQrGuest] = useState<ImportedGuest | null>(
    null,
  );

  // State Database Tamu
  // State Database Tamu & Pagination
  const [dbGuests, setDbGuests] = useState<ImportedGuest[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [serverStats, setServerStats] = useState<{
    total?: number;
    hadir?: number;
    preReg?: number;
    selfReg?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Load Database Guests with server-side pagination per 25 list
  const fetchDbGuests = useCallback(
    async (
      page: number = 1,
      query: string = "",
      source: string = "all",
      status: string = "all",
    ) => {
      setIsLoadingDb(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "25");
      if (query.trim()) params.set("q", query.trim());
      if (source && source !== "all") params.set("source", source);
      if (status && status !== "all") params.set("status", status);

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const endpoints = Array.from(
        new Set([
          `/api/reservations${queryString}`,
          `http://localhost:8888/api/reservations${queryString}`,
          `${getPublicApiUrl()}/api/reservations${queryString}`,
        ]),
      );

      let loaded = false;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            signal: AbortSignal.timeout(6000),
          });

          const rawText = await res.text();
          let json: {
            data?: ImportedGuest[];
            pagination?: {
              page?: number;
              limit?: number;
              total_records?: number;
              total_pages?: number;
            };
            total?: number;
            page?: number;
            total_pages?: number;
            stats?: {
              total?: number;
              hadir?: number;
              pre_registered?: number;
              self_registered?: number;
            };
          } | null = null;
          try {
            json = JSON.parse(rawText);
          } catch {
            json = null;
          }

          if (res.ok && Array.isArray(json?.data)) {
            setDbGuests(json.data);
            const resPage = json.pagination?.page ?? json.page ?? page;
            const resTotalPages =
              json.pagination?.total_pages ?? json.total_pages ?? 1;
            const resTotalRecords =
              json.pagination?.total_records ?? json.total ?? json.data.length;

            setCurrentPage(resPage);
            setTotalPages(resTotalPages);
            setTotalRecords(resTotalRecords);

            if (json.stats) {
              setServerStats({
                total: json.stats.total ?? resTotalRecords,
                hadir: json.stats.hadir ?? 0,
                preReg: json.stats.pre_registered ?? 0,
                selfReg: json.stats.self_registered ?? 0,
              });
            }

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
    },
    [],
  );

  useEffect(() => {
    if (activeTab === "database") {
      fetchDbGuests(1, debouncedSearch, filterSource, filterStatus);
    }
  }, [activeTab, debouncedSearch, filterSource, filterStatus, fetchDbGuests]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchDbGuests(newPage, debouncedSearch, filterSource, filterStatus);
      const el = document.getElementById("guest-database-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

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

  // Generate Link WhatsApp dengan template pesan undangan pernikahan
  const generateWaLink = (
    phone: string,
    name: string,
    code: string,
    inviteUrl?: string,
  ) => {
    return buildWhatsappShareUrl(phone, name, code, inviteUrl);
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

  // Reset formulir tambah tamu
  const handleResetAddForm = () => {
    setAddName("");
    setAddPhone("");
    setAddEmail("");
    setAddQuota(2);
    setAddDirectCheckIn(false);
    setNewlyCreatedGuest(null);
  };

  // Submit tambah tamu dadakan ke API (http://localhost:8888/api/reservations)
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = addName.trim();
    if (!trimmedName) {
      toast.warning("Nama tamu wajib diisi.");
      return;
    }

    setIsAdding(true);

    const payload = {
      name: trimmedName,
      phone: addPhone.trim(),
      email: addEmail.trim(),
      quota_guests: Number(addQuota) || 2,
      total_guests: Number(addQuota) || 2,
      is_present: addDirectCheckIn ? true : false,
      source: "pre_registered",
    };

    const targetEndpoints = Array.from(
      new Set([
        "http://localhost:8888/api/reservations",
        "/api/reservations",
        `${getPublicApiUrl()}/api/reservations`,
      ]),
    );

    let createdGuest: ImportedGuest | null = null;
    let lastError = "";

    for (const url of targetEndpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const raw = await res.text();
        let json: {
          data?: ImportedGuest;
          error?: string;
          message?: string;
        } | null = null;
        try {
          json = JSON.parse(raw);
        } catch {
          json = null;
        }

        if (res.ok && json?.data?.code) {
          createdGuest = json.data;
          break;
        }

        if (json?.error) {
          lastError = json.error;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (!createdGuest) {
      setIsAdding(false);
      toast.error(
        lastError ||
          "Gagal menambahkan tamu. Pastikan server Go port 8888 aktif di http://localhost:8888.",
      );
      return;
    }

    // Jika opsi check-in langsung diaktifkan, proses check-in kehadiran sekarang juga
    if (addDirectCheckIn && createdGuest.code) {
      try {
        const checkInEndpoints = Array.from(
          new Set([
            "http://localhost:8888/api/reservations/check-in",
            "/api/reservations/check-in",
            `${getPublicApiUrl()}/api/reservations/check-in`,
          ]),
        );
        for (const ciUrl of checkInEndpoints) {
          try {
            const ciRes = await fetch(ciUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: createdGuest.code,
                actual_guest: Number(addQuota) || 1,
              }),
            });
            if (ciRes.ok) {
              createdGuest.is_present = true;
              createdGuest.status = "hadir";
              break;
            }
          } catch {
            // Abaikan error fallback check-in
          }
        }
      } catch {
        // Abaikan error check-in
      }
    }

    setNewlyCreatedGuest(createdGuest);
    setIsAdding(false);
    toast.success(
      `Tamu "${createdGuest.name}" berhasil ditambahkan! Kode: ${createdGuest.code}`,
    );

    // Refresh database tab data di background
    fetchDbGuests(1, debouncedSearch, filterSource, filterStatus);
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
        ]),
      );

      let successData: { data?: ImportedGuest[]; message?: string } | null =
        null;
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
          let json: {
            data?: ImportedGuest[];
            error?: string;
            detail?: string;
          } | null = null;
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
            lastErrorMessage = json.error || json.detail || "";
            if (res.status === 400) break; // Bad request validation error
          } else if (rawText) {
            lastErrorMessage = rawText;
          }
        } catch (err: unknown) {
          lastErrorMessage = err instanceof Error ? err.message : String(err);
        }
      }

      if (!successData) {
        throw new Error(
          lastErrorMessage ||
            "Gagal import data. Pastikan server Go port 8888 aktif dan route /api/reservations/batch terpasang.",
        );
      }

      const createdGuests: ImportedGuest[] = Array.isArray(successData?.data)
        ? successData.data
        : [];

      setImportedResult(createdGuests);
      setParsedRows([]);
      setFileName("");
      toast.success(
        `Sukses! ${createdGuests.length} tamu berhasil diimport dan dibuatkan link undangan.`,
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

    const exportRows = dataToExport.map((g, idx) => {
      const inviteUrl = buildInvitationUrl(g.name, g.code);
      return {
        No: idx + 1,
        "Nama Tamu": g.name,
        "No WhatsApp": g.phone || "-",
        Email: g.email || "-",
        "Kode Reservasi": g.code,
        "Jatah Kuota": g.quota_guests || g.total_guests || 2,
        "Link Undangan Digital": inviteUrl,
        "Link Gambar QR Code": `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
          inviteUrl,
        )}`,
        Status: g.is_present
          ? "Sudah Hadir"
          : g.status === "konfirmasi_hadir"
            ? "Konfirmasi Hadir"
            : "Belum Hadir",
      };
    });

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

  // Export Seluruh Tamu Database ke Excel (mengambil parameter all=true)
  const handleExportAllDbGuests = async () => {
    setIsLoadingDb(true);
    try {
      const endpoints = [
        "/api/reservations?all=true",
        "http://localhost:8888/api/reservations?all=true",
        `${getPublicApiUrl()}/api/reservations?all=true`,
      ];
      let exported = false;
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, { cache: "no-store" });
          const raw = await res.text();
          let json: { data?: ImportedGuest[] } | null = null;
          try {
            json = JSON.parse(raw);
          } catch {
            json = null;
          }
          if (res.ok && Array.isArray(json?.data) && json.data.length > 0) {
            handleExportResult(json.data);
            toast.success(
              `Berhasil mengekspor seluruh ${json.data.length} tamu!`,
            );
            exported = true;
            break;
          }
        } catch {
          // fallback
        }
      }
      if (!exported) {
        handleExportResult(dbGuests);
      }
    } catch {
      handleExportResult(dbGuests);
    } finally {
      setIsLoadingDb(false);
    }
  };

  // Helper Pagination Pages Range
  const getPaginationRange = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 3) {
      pages.push(1, 2, 3, 4, "...", total);
    } else if (current >= total - 2) {
      pages.push(1, "...", total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
    return pages;
  };

  // Statistik Database
  const stats = useMemo(() => {
    if (serverStats && serverStats.total !== undefined) {
      return {
        total: serverStats.total,
        hadir: serverStats.hadir ?? 0,
        preReg: serverStats.preReg ?? 0,
        selfReg: serverStats.selfReg ?? 0,
      };
    }
    const total = totalRecords || dbGuests.length;
    const hadir = dbGuests.filter(
      (g) => g.is_present || g.status?.toLowerCase() === "hadir",
    ).length;
    const preReg = dbGuests.filter((g) => g.source === "pre_registered").length;
    const selfReg = total - preReg;
    return { total, hadir, preReg, selfReg };
  }, [serverStats, totalRecords, dbGuests]);

  return (
    <div className="min-h-screen w-full bg-[#08090d] text-slate-100 font-sans pb-36 selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden overflow-y-auto">
      {/* Top Navbar */}
      <header className="border-b border-white/10 bg-[#0d1017]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <Link
              href="/reservations"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
              title="Ke Halaman Check-in Scanner"
            >
              <LuArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-playfair text-sm sm:text-lg font-bold bg-linear-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent truncate">
                Admin Guest Manager
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                The Wedding of Andri &amp; Cica
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Link
              href="/admin/check-in"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition shadow-sm"
              title="Ke Halaman Check-in Tamu (Cari Nama & Klik Hadir)"
            >
              <LuUserCheck className="w-3.5 h-3.5" />
              <span>Check-in Tamu</span>
            </Link>
            <Link
              href="/list-guest"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition"
              title="Lihat Halaman Publik Daftar Tamu"
            >
              <LuExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Daftar Tamu</span>
            </Link>
            <Link
              href="/reservations"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
              title="Ke Halaman Scanner Check-in"
            >
              <LuQrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Scanner Check-in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                activeTab === "import"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <LuFileSpreadsheet className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("add");
                setNewlyCreatedGuest(null);
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                activeTab === "add"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <LuUserPlus className="w-4 h-4" />
              <span>Tambah Tamu</span>
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                activeTab === "database"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <LuCircleCheck className="w-4 h-4" />
              <span>Semua Tamu ({totalRecords || dbGuests.length})</span>
            </button>
          </div>

          {activeTab === "import" && (
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 hover:text-amber-200 transition"
            >
              <LuDownload className="w-4 h-4" />
              <span>Unduh Template Excel</span>
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

                {/* Mobile Card View (< md) */}
                <div className="md:hidden space-y-3">
                  {importedResult.map((guest, idx) => {
                    const inviteUrl = buildInvitationUrl(
                      guest.name,
                      guest.code,
                    );
                    return (
                      <div
                        key={guest.code || idx}
                        className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-mono text-xs">
                                #{idx + 1}
                              </span>
                              <h4 className="font-semibold text-white text-base leading-snug">
                                {guest.name}
                              </h4>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Jatah: {guest.quota_guests || 2} Pax
                            </span>
                          </div>

                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-xs tracking-wider shrink-0">
                            {guest.code}
                          </span>
                        </div>

                        {guest.phone && (
                          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                            <span>WA:</span>
                            <span className="text-slate-200">
                              {guest.phone}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedQrGuest(guest)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium transition cursor-pointer"
                          >
                            <LuQrCode className="w-3.5 h-3.5" />
                            <span>Lihat QR</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(inviteUrl, guest.code)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition"
                              title="Salin Link"
                            >
                              {copiedCode === guest.code ? (
                                <LuCheck className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <LuCopy className="w-4 h-4" />
                              )}
                            </button>

                            <a
                              href={inviteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                              title="Buka Undangan"
                            >
                              <LuExternalLink className="w-4 h-4" />
                            </a>

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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                              >
                                <FaWhatsapp className="w-4 h-4" />
                                <span>Kirim WA</span>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block overflow-x-auto">
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
                        const inviteUrl = buildInvitationUrl(
                          guest.name,
                          guest.code,
                        );
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
                                <a
                                  href={inviteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                                  title="Buka Undangan"
                                >
                                  <LuExternalLink className="w-4 h-4" />
                                </a>
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
          <div id="guest-database-section" className="space-y-6">
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
            <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xl">
              <div className="relative flex-1">
                <LuSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, kode reservasi, atau no WA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="flex-1 sm:flex-none bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">Semua Jalur</option>
                  <option value="pre_registered">VIP (Pre-reg)</option>
                  <option value="self_registered">Mandiri (RSVP)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 sm:flex-none bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">Semua Kehadiran</option>
                  <option value="hadir">Sudah Hadir</option>
                  <option value="belum">Belum Hadir</option>
                </select>

                <button
                  onClick={() =>
                    fetchDbGuests(
                      currentPage,
                      debouncedSearch,
                      filterSource,
                      filterStatus,
                    )
                  }
                  disabled={isLoadingDb}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition shrink-0"
                  title="Refresh Data"
                >
                  <LuRefreshCw
                    className={`w-4 h-4 ${isLoadingDb ? "animate-spin text-amber-400" : ""}`}
                  />
                </button>

                <button
                  onClick={handleExportAllDbGuests}
                  disabled={isLoadingDb}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shrink-0 disabled:opacity-50"
                  title="Export Semua Tamu ke Excel"
                >
                  <LuDownload className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* List Tamu Database */}
            {filteredDbGuests.length === 0 ? (
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-10 text-center text-slate-500 shadow-xl">
                {isLoadingDb
                  ? "Memuat data tamu..."
                  : "Tidak ada data tamu yang cocok."}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mobile Card View (< md) */}
                <div className="md:hidden space-y-3">
                  {filteredDbGuests.map((guest, idx) => {
                    const inviteUrl = buildInvitationUrl(
                      guest.name,
                      guest.code,
                    );
                    const isCheckedIn =
                      guest.is_present ||
                      guest.status?.toLowerCase() === "hadir";

                    return (
                      <div
                        key={guest.code || guest.id || idx}
                        className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 shadow-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-mono text-xs">
                                #{(currentPage - 1) * 25 + idx + 1}
                              </span>
                              <h3 className="font-semibold text-white text-base leading-snug">
                                {guest.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] tracking-wider">
                                {guest.code}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {guest.total_guests || guest.quota_guests || 1}{" "}
                                Pax
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {guest.source === "pre_registered" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                VIP (Pre-reg)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                                Mandiri (RSVP)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Check-in & RSVP */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                          <span className="text-slate-400">
                            Status Check-in:
                          </span>
                          <div className="flex flex-col items-end">
                            {isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <LuCircleCheck className="w-3.5 h-3.5" />
                                Sudah Hadir
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                Belum Hadir
                              </span>
                            )}
                            {guest.status === "konfirmasi_hadir" &&
                              !isCheckedIn && (
                                <span className="text-[10px] text-amber-300 font-medium mt-0.5">
                                  (RSVP: Akan Hadir)
                                </span>
                              )}
                            {guest.status === "tidak_datang" && (
                              <span className="text-[10px] text-rose-400 font-medium mt-0.5">
                                (RSVP: Tidak Hadir)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Kontak & Actions Toolbar */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                          <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                            {guest.phone || guest.email || "-"}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleCopy(inviteUrl, guest.code)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition"
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
                                className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition"
                                title="Kirim Pesan WhatsApp"
                              >
                                <FaWhatsapp className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedQrGuest(guest)}
                              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white transition cursor-pointer"
                              title="Lihat & Download QR Code Tiket"
                            >
                              <LuQrCode className="w-4 h-4" />
                            </button>

                            <a
                              href={inviteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                              title="Buka Undangan"
                            >
                              <LuExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
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
                        {filteredDbGuests.map((guest, idx) => {
                          const inviteUrl = buildInvitationUrl(
                            guest.name,
                            guest.code,
                          );
                          const isCheckedIn =
                            guest.is_present ||
                            guest.status?.toLowerCase() === "hadir";

                          return (
                            <tr
                              key={guest.code || guest.id || idx}
                              className="hover:bg-white/2 transition"
                            >
                              <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                                {(currentPage - 1) * 25 + idx + 1}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-white block">
                                  {guest.name}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {guest.total_guests ||
                                    guest.quota_guests ||
                                    1}{" "}
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
                                <div className="flex flex-col items-start gap-1">
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

                                  {guest.status === "konfirmasi_hadir" &&
                                    !isCheckedIn && (
                                      <span className="text-[10px] text-amber-300 font-medium">
                                        RSVP: Akan Hadir
                                      </span>
                                    )}
                                  {guest.status === "tidak_datang" && (
                                    <span className="text-[10px] text-rose-400 font-medium">
                                      RSVP: Tidak Hadir
                                    </span>
                                  )}
                                  {(!guest.status ||
                                    guest.status === "belum_konfirmasi") && (
                                    <span className="text-[10px] text-slate-500">
                                      RSVP: Belum Konfirmasi
                                    </span>
                                  )}
                                </div>
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
                                    href={inviteUrl}
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
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  {/* Left / Info Text */}
                  <div className="text-xs text-slate-400 text-center sm:text-left">
                    Menampilkan{" "}
                    <span className="font-semibold text-white font-mono">
                      {totalRecords === 0 ? 0 : (currentPage - 1) * 25 + 1}
                    </span>{" "}
                    -{" "}
                    <span className="font-semibold text-white font-mono">
                      {Math.min(currentPage * 25, totalRecords)}
                    </span>{" "}
                    dari{" "}
                    <span className="font-semibold text-amber-300 font-mono">
                      {totalRecords}
                    </span>{" "}
                    tamu
                  </div>

                  {/* Buttons Navigation */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                    {/* First Page */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage <= 1 || isLoadingDb}
                      className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Halaman Pertama"
                    >
                      <LuChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Previous Page */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || isLoadingDb}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Halaman Sebelumnya"
                    >
                      <LuChevronLeft className="w-4 h-4" />
                      <span className="hidden xs:inline">Prev</span>
                    </button>

                    {/* Page Numbers */}
                    {getPaginationRange(currentPage, totalPages).map(
                      (p, idx) => {
                        if (p === "...") {
                          return (
                            <span
                              key={`dots-${idx}`}
                              className="px-2 py-1 text-slate-600 font-mono text-xs select-none"
                            >
                              ...
                            </span>
                          );
                        }
                        const pageNum = Number(p);
                        const isActive = pageNum === currentPage;
                        return (
                          <button
                            key={`page-${pageNum}`}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoadingDb}
                            className={`min-w-8 h-8 px-2 rounded-xl text-xs font-mono font-medium transition ${
                              isActive
                                ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

                    {/* Next Page */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoadingDb}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Halaman Selanjutnya (Next Page)"
                    >
                      <LuChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last Page */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage >= totalPages || isLoadingDb}
                      className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Halaman Terakhir"
                    >
                      <LuChevronsRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: TAMBAH TAMU DADAKAN (INPUT LANGSUNG) */}
        {/* ========================================================================= */}
        {activeTab === "add" && (
          <div className="max-w-3xl mx-auto space-y-6">
            {!newlyCreatedGuest ? (
              /* Formulir Input Tamu */
              <div className="bg-linear-to-b from-[#131722] to-[#0e111a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

                <div className="relative z-10 space-y-6">
                  {/* Header Title */}
                  <div className="text-center space-y-2 max-w-lg mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                      <LuSparkles className="w-3.5 h-3.5" />
                      <span>Input Tamu Langsung</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-playfair tracking-wide">
                      Tambah Tamu Tambahan / Dadakan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      Masukkan data tamu undangan tambahan secara instan. Sistem
                      akan otomatis mengenerate kode reservasi 5-digit dan link
                      undangan personal (Format #2).
                    </p>
                  </div>

                  <form onSubmit={handleAddGuest} className="space-y-5 pt-2">
                    {/* Nama Tamu */}
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between">
                        <span>
                          Nama Tamu Undangan{" "}
                          <span className="text-rose-400">*</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Wajib diisi
                        </span>
                      </label>
                      <div className="relative">
                        <LuUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={addName}
                          onChange={(e) => setAddName(e.target.value)}
                          placeholder="Contoh: Budi Santoso atau Keluarga Hendra Pratama"
                          className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>
                    </div>

                    {/* No WA & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* No WhatsApp */}
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between">
                          <span>No WhatsApp</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Opsional
                          </span>
                        </label>
                        <div className="relative">
                          <LuPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            value={addPhone}
                            onChange={(e) => setAddPhone(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Digunakan untuk kirim template pesan undangan via
                          WhatsApp
                        </p>
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between">
                          <span>Email</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            Opsional
                          </span>
                        </label>
                        <div className="relative">
                          <LuMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            value={addEmail}
                            onChange={(e) => setAddEmail(e.target.value)}
                            placeholder="Contoh: budi@gmail.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Alamat email konfirmasi tiket tamu
                        </p>
                      </div>
                    </div>

                    {/* Jatah Kuota Pax */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between">
                        <span>Jatah Kuota Kehadiran (Pax)</span>
                        <span className="text-xs text-amber-300 font-mono font-bold">
                          {addQuota} Orang
                        </span>
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setAddQuota(num)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                              addQuota === num
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                                : "bg-black/40 border-white/10 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {num} Pax
                          </button>
                        ))}
                        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            onClick={() =>
                              setAddQuota((prev) => Math.max(1, prev - 1))
                            }
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center justify-center text-sm font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={addQuota}
                            onChange={(e) =>
                              setAddQuota(
                                Math.max(
                                  1,
                                  Math.min(20, Number(e.target.value) || 1),
                                ),
                              )
                            }
                            className="w-10 text-center bg-transparent text-sm font-bold text-amber-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setAddQuota((prev) => Math.min(20, prev + 1))
                            }
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 flex items-center justify-center text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox Langsung Check-in */}
                    <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-start gap-3 cursor-pointer hover:border-amber-500/30 transition">
                      <input
                        type="checkbox"
                        id="direct-checkin-check"
                        checked={addDirectCheckIn}
                        onChange={(e) => setAddDirectCheckIn(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-white/20 bg-black/60 cursor-pointer"
                      />
                      <label
                        htmlFor="direct-checkin-check"
                        className="cursor-pointer text-xs select-none"
                      >
                        <span className="font-semibold text-white block">
                          Tamu Langsung Hadir di Lokasi (Langsung Check-in
                          Sekarang)
                        </span>
                        <span className="text-slate-400 block mt-0.5">
                          Centang opsi ini jika tamu sudah tiba di lokasi acara
                          dan ingin langsung dicatat kehadirannya tanpa perlu
                          scan QR lagi.
                        </span>
                      </label>
                    </div>

                    {/* Tombol Simpan */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isAdding}
                        className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isAdding ? (
                          <>
                            <LuRefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                            <span>Menyimpan Data Tamu...</span>
                          </>
                        ) : (
                          <>
                            <LuUserPlus className="w-4 h-4" />
                            <span>Simpan &amp; Buat Undangan Tamu</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              /* Success Result Card */
              <div className="bg-linear-to-b from-[#131722] to-[#0e111a] border-2 border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

                <div className="relative z-10 text-center space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <LuCircleCheck className="w-4 h-4" />
                    <span>Tamu Berhasil Ditambahkan</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-white font-playfair tracking-wide">
                    {newlyCreatedGuest.name}
                  </h2>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <span>
                      Jatah:{" "}
                      <strong className="text-white">
                        {newlyCreatedGuest.quota_guests || 2} Pax
                      </strong>
                    </span>
                    <span>•</span>
                    {newlyCreatedGuest.is_present ? (
                      <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <LuCircleCheck className="w-3.5 h-3.5" /> Sudah Hadir
                        (Checked-in)
                      </span>
                    ) : (
                      <span className="text-amber-300 font-medium">
                        Terdaftar (Belum Hadir)
                      </span>
                    )}
                  </div>
                </div>

                {/* Kode Reservasi Box */}
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-center max-w-sm mx-auto space-y-1">
                  <span className="text-[10px] text-amber-300 font-mono tracking-widest uppercase block">
                    KODE RESERVASI TAMU
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl font-mono font-bold text-amber-300 tracking-widest select-all">
                      {newlyCreatedGuest.code}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          newlyCreatedGuest.code,
                          newlyCreatedGuest.code,
                        )
                      }
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-amber-300 transition"
                      title="Salin Kode"
                    >
                      {copiedCode === newlyCreatedGuest.code ? (
                        <LuCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <LuCopy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {(() => {
                  const inviteUrl = buildInvitationUrl(
                    newlyCreatedGuest.name,
                    newlyCreatedGuest.code,
                  );
                  return (
                    <div className="space-y-4 max-w-md mx-auto">
                      {/* Link Undangan Format #2 */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300 block">
                          Link Undangan Personal (Format #2)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={inviteUrl}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono truncate select-all"
                          />
                          <button
                            onClick={() =>
                              handleCopy(
                                inviteUrl,
                                "url-" + newlyCreatedGuest.code,
                              )
                            }
                            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedCode === "url-" + newlyCreatedGuest.code ? (
                              <LuCheck className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <LuCopy className="w-4 h-4" />
                            )}
                            <span>
                              {copiedCode === "url-" + newlyCreatedGuest.code
                                ? "Tersalin"
                                : "Salin Link"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <a
                          href={inviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 text-center"
                        >
                          <LuExternalLink className="w-4 h-4 text-amber-400" />
                          <span>Buka Undangan</span>
                        </a>

                        {newlyCreatedGuest.phone ? (
                          <a
                            href={generateWaLink(
                              newlyCreatedGuest.phone,
                              newlyCreatedGuest.name,
                              newlyCreatedGuest.code,
                              inviteUrl,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 text-center"
                          >
                            <FaWhatsapp className="w-4 h-4" />
                            <span>Kirim WhatsApp</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setSelectedQrGuest(newlyCreatedGuest)}
                          className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LuQrCode className="w-4 h-4" />
                          <span>Lihat QR</span>
                        </button>
                      </div>

                      {/* Button Tambah Tamu Lainnya */}
                      <div className="pt-4 border-t border-white/10 text-center">
                        <button
                          type="button"
                          onClick={handleResetAddForm}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 inline-flex items-center gap-2 cursor-pointer"
                        >
                          <LuPlus className="w-4 h-4" />
                          <span>Tambah Tamu Lainnya</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
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
            className="bg-[#12151f] border border-amber-500/30 rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
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
              Jatah Kuota:{" "}
              {selectedQrGuest.quota_guests ||
                selectedQrGuest.total_guests ||
                2}{" "}
              Pax
            </p>

            {(() => {
              const inviteUrl = buildInvitationUrl(
                selectedQrGuest.name,
                selectedQrGuest.code,
              );

              return (
                <>
                  {/* QR Code Container */}
                  <div className="bg-white p-4 rounded-2xl border-2 border-amber-400 shadow-2xl max-w-[220px] mx-auto my-3">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(
                        inviteUrl,
                      )}`}
                      alt={`QR Code ${selectedQrGuest.name}`}
                      width={250}
                      height={250}
                      unoptimized
                      className="w-48 h-48 object-contain mx-auto"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Tunjukkan QR Code ini kepada penerima tamu saat tiba di
                    lokasi resepsi pernikahan
                  </p>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 mb-4">
                    <span className="text-[10px] text-amber-300/80 block uppercase font-mono tracking-wider">
                      KODE RESERVASI
                    </span>
                    <span className="text-2xl font-mono font-bold text-amber-300 tracking-widest">
                      {selectedQrGuest.code}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=15&data=${encodeURIComponent(
                          inviteUrl,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`QR_${selectedQrGuest.name}_${selectedQrGuest.code}.png`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20 text-center flex items-center justify-center gap-1.5"
                      >
                        <LuDownload className="w-3.5 h-3.5" />
                        <span>Unduh Gambar QR</span>
                      </a>

                      <button
                        onClick={() =>
                          handleCopy(inviteUrl, selectedQrGuest.code)
                        }
                        className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                        title="Salin Link Undangan"
                      >
                        {copiedCode === selectedQrGuest.code ? (
                          <LuCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <LuCopy className="w-3.5 h-3.5 text-slate-300" />
                        )}
                        <span>
                          {copiedCode === selectedQrGuest.code
                            ? "Tersalin"
                            : "Salin Link"}
                        </span>
                      </button>

                      {selectedQrGuest.phone && (
                        <a
                          href={generateWaLink(
                            selectedQrGuest.phone,
                            selectedQrGuest.name,
                            selectedQrGuest.code,
                            inviteUrl,
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

                    <a
                      href={inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
                    >
                      <LuExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Halaman Undangan Tamu</span>
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
