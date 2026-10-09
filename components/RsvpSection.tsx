"use client";
import React, { useState } from "react";
import FooterNav from "./FooterNav";
import { toast } from "react-toastify";
import { motion } from "motion/react";
import Modal from "./Modal";
import { LuCopy, LuCopyCheck } from "react-icons/lu";
import LazyBackgroundVideo from "./LazyBackgroundVideo";
import { getPublicApiUrl } from "@/utils/api";
import Image from "next/image";

type RsvpSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
  guestCode?: string;
  defaultGuestName?: string;
};
type RsvpFormData = {
  name: string;
  email: string;
  is_present: boolean;
  total_guests: number;
  code?: string;
};
type RsvpResponse = {
  error?: string;
  message: string;
  data: { code: string; is_present: boolean };
};
const RsvpSection: React.FC<RsvpSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
  guestCode,
  defaultGuestName,
}) => {
  const [attendance, setAttendance] = useState<"hadir" | "tidak" | "">("hadir");
  const [name, setName] = useState(
    defaultGuestName &&
      defaultGuestName.toLowerCase() !== "guest" &&
      defaultGuestName.toLowerCase() !== "tamu undangan"
      ? defaultGuestName
      : "",
  );
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [code, setCode] = useState<string>(guestCode || "");
  const [isPresent, setIsPreset] = useState<boolean>(false);

  React.useEffect(() => {
    if (
      defaultGuestName &&
      !name &&
      defaultGuestName.toLowerCase() !== "guest" &&
      defaultGuestName.toLowerCase() !== "tamu undangan"
    ) {
      setName(defaultGuestName);
    }
  }, [defaultGuestName, name]);

  React.useEffect(() => {
    if (!guestCode) return;
    const fetchGuestDetails = async () => {
      try {
        const apiUrl = getPublicApiUrl();
        const res = await fetch(
          `${apiUrl}/api/reservations/check-in/${encodeURIComponent(guestCode)}`,
        );
        if (!res.ok) return;
        const json = await res.json();
        const g = json?.data;
        if (g) {
          if (g.name) setName(g.name);
          if (g.email) setEmail(g.email);
          if (g.total_guests) setGuests(String(g.total_guests));
          if (g.status === "tidak_datang" || g.status === "tidak") {
            setAttendance("tidak");
          } else {
            setAttendance("hadir");
          }
        }
      } catch {
        // ignore error prefill
      }
    };
    fetchGuestDetails();
  }, [guestCode]);

  const fetchData = async (payload: RsvpFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    if (!name.trim()) {
      setErrorMessage("Nama tidak boleh kosong");
      setIsLoading(false);
      return;
    }
    if (!guestCode && !email.trim()) {
      setErrorMessage("Nama dan email tidak boleh kosong");
      setIsLoading(false);
      return;
    }
    try {
      const apiUrl = getPublicApiUrl();
      const res = await fetch(`${apiUrl}/api/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      let data: RsvpResponse | undefined;
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
        throw new Error(backendError || "Gagal mengirim konfirmasi kehadiran");
      }
      toast.success("Konfirmasi kehadiran berhasil dikirim! Terima kasih.");
      setCode(data?.data.code || "");
      setIsPreset(data?.data.is_present || false);
      setShowModal(true);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Gagal mengirim konfirmasi kehadiran");
      } else {
        setErrorMessage(String(error) || "Gagal mengirim konfirmasi kehadiran");
      }
    } finally {
      setIsLoading(false);
    }
    setName("");
    setEmail("");
    setAttendance("");
    setGuests("");
  };
  const reservationCode = code;
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    if (typeof textArea.select === "function") {
      textArea.select();
    }

    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      toast.error("Gagal menyalin kode reservasi." + err);
      return false;
    }
  };
  const handleCopy = async () => {
    const text = reservationCode;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 5000);
        toast.success("Kode reservasi disalin ke clipboard!");
        return;
      } catch (err) {
        toast.error("Gagal menyalin kode reservasi." + err);
      }
    }
    const ok = fallbackCopyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
      return;
    }
  };

  return (
    <section
      ref={verseRef}
      className="relative h-dvh w-full text-white overflow-hidden"
    >
      {/* Background */}
      <LazyBackgroundVideo src="/media/road.mp4" />
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Konfirmasi Berhasil!"
        >
          <div className="flex flex-col space-y-4">
            {isPresent ? (
              <>
                <div className="text-center">
                  <h3 className="text-base font-semibold text-white">
                    Tiket Check-in Masuk
                  </h3>
                  <p className="text-xs text-white/70 mt-1">
                    Tunjukkan QR Code ini kepada penerima tamu saat tiba di
                    lokasi acara
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-3 rounded-2xl border-2 border-amber-400 shadow-xl max-w-[200px] mx-auto flex flex-col items-center">
                  <Image
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
                      `https://weddingofandricica.me?code=${reservationCode}`,
                    )}`}
                    alt={`QR Code Tiket ${reservationCode}`}
                    width={220}
                    height={220}
                    unoptimized
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>

                <div className="p-3 bg-white/10 border border-white/20 rounded-xl text-center flex flex-col items-center space-y-1">
                  <span className="text-[10px] text-amber-300 font-medium tracking-wider uppercase">
                    KODE RESERVASI
                  </span>
                  <div className="flex gap-3 items-center justify-center">
                    <span className="font-mono text-2xl font-bold text-amber-200 tracking-widest select-all">
                      {reservationCode}
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-1 rounded hover:bg-white/10 text-white/90 transition"
                      title="Salin Kode"
                    >
                      {copied ? (
                        <LuCopyCheck className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <LuCopy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&data=${encodeURIComponent(
                    `https://weddingofandricica.me?code=${reservationCode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`QR_Checkin_${reservationCode}.png`}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs text-center transition shadow-md"
                >
                  Simpan / Unduh Gambar QR Code
                </a>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 text-2xl shadow-inner">
                  ♡
                </div>
                <h3 className="text-base font-semibold text-white">
                  Terima Kasih atas Konfirmasinya
                </h3>
                <p className="text-xs text-white/75 leading-relaxed max-w-xs mx-auto">
                  Doa dan restu Anda tetap sangat berarti bagi kami. Semoga di
                  lain kesempatan kita dapat bersilaturahmi.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45" />

      {/* CONTENT*/}
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
          className="mx-auto w-full max-w-md px-6 py-7 sm:py-8 text-center bg-black/40 border border-white/15 rounded-3xl backdrop-blur-md shadow-2xl"
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
            R S V P
          </motion.span>

          {/* Judul Konfirmasi Kehadiran */}
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
            Konfirmasi Kehadiran
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
            className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm mx-auto mb-4"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            Mohon konfirmasikan kehadiran Anda untuk membantu kami mempersiapkan
            acara dengan sebaik-baiknya. Doa restu Anda sangat berarti bagi
            kami.
          </motion.p>

          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              const is_present = attendance === "hadir";
              const payload: RsvpFormData = {
                name: name?.trim(),
                email: email?.trim(),
                is_present,
                total_guests: Number(guests) || 1,
                ...(guestCode ? { code: guestCode } : {}),
              };
              fetchData(payload);
            }}
            className="space-y-3.5 text-left"
            aria-label="Formulir Konfirmasi Kehadiran"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.06, delayChildren: 0.04 },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.input
                id="rsvp-name"
                name="name"
                type="text"
                placeholder="Nama lengkap Anda..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/15 text-sm text-white placeholder-white/45
                     focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition"
                autoComplete="name"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.input
                id="rsvp-email"
                name="email"
                type="email"
                placeholder="Alamat email aktif..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/15 text-sm text-white placeholder-white/45
                     focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-300/60 transition"
                autoComplete="email"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
            </motion.div>

            <motion.fieldset
              className="mt-1"
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.div
                className="flex gap-2.5"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
              >
                <motion.label
                  className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs sm:text-sm text-center border font-medium transition duration-200 flex items-center justify-center gap-1.5
              ${
                attendance === "hadir"
                  ? "bg-amber-400 text-slate-950 border-amber-300 font-semibold shadow-md shadow-amber-400/20"
                  : "bg-white/6 border-white/15 text-white/90 hover:bg-white/10"
              }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value="hadir"
                    checked={attendance === "hadir"}
                    onChange={() => setAttendance("hadir")}
                    className="sr-only"
                  />
                  <span>✓</span> Hadir
                </motion.label>

                <motion.label
                  className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-xs sm:text-sm text-center border font-medium transition duration-200 flex items-center justify-center gap-1.5
              ${
                attendance === "tidak"
                  ? "bg-white/90 text-slate-950 border-white font-semibold shadow-md"
                  : "bg-white/6 border-white/15 text-white/90 hover:bg-white/10"
              }`}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    show: { opacity: 1, y: 0 },
                  }}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value="tidak"
                    checked={attendance === "tidak"}
                    onChange={() => setAttendance("tidak")}
                    className="sr-only"
                  />
                  <span>✕</span> Tidak Hadir
                </motion.label>
              </motion.div>
            </motion.fieldset>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.input
                id="rsvp-guests"
                name="guests"
                type="number"
                min={0}
                max={3}
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Jumlah tamu (termasuk Anda)"
                className={`w-full h-11 px-4 rounded-xl text-sm placeholder-white/45 focus:outline-none focus:ring-2 transition
                      ${
                        attendance === "hadir"
                          ? "bg-white/6 border border-white/15 text-white focus:ring-amber-300/40 focus:border-amber-300/60"
                          : "bg-white/4 border border-white/10 text-white/50 cursor-not-allowed"
                      }`}
                disabled={attendance !== "hadir"}
                aria-disabled={attendance !== "hadir"}
                required={attendance === "hadir"}
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
              <motion.p
                className="mt-1.5 text-[11px] text-white/60"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              >
                {attendance === "hadir"
                  ? "Masukkan jumlah tamu yang hadir (maksimal 3 orang)."
                  : "Dinonaktifkan karena Anda memilih tidak hadir."}
              </motion.p>
            </motion.div>

            <motion.div
              aria-live="polite"
              className="min-h-5 text-sm text-white/85"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            >
              {errorMessage ? (
                <motion.p
                  className="text-red-300 font-inter bg-red-500/15 border border-red-500/30 py-1.5 px-3 rounded-lg text-xs w-fit mx-auto"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errorMessage}
                </motion.p>
              ) : null}
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold tracking-wider transition bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 hover:brightness-105 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20 cursor-pointer"
                whileHover={
                  isLoading
                    ? undefined
                    : {
                        scale: 1.01,
                        y: -2,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 22,
                        },
                      }
                }
                whileTap={isLoading ? undefined : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-slate-950"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
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
                    Mengirim Konfirmasi...
                  </>
                ) : (
                  "KIRIM KONFIRMASI"
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
        <FooterNav page="10/12" onPrev={onPrev} onNext={onNext} />
      </motion.div>
    </section>
  );
};

export default RsvpSection;
