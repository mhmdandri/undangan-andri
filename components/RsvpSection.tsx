"use client";
import React, { useState } from "react";
import FooterNav from "./FooterNav";
import { toast } from "react-toastify";
import { motion } from "motion/react";
import Modal from "./Modal";
import { LuCopy, LuCopyCheck } from "react-icons/lu";

type RsvpSectionProps = {
  verseRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
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
  data: { code: string };
};
const RsvpSection: React.FC<RsvpSectionProps> = ({
  verseRef,
  onNext,
  onPrev,
}) => {
  const [attendance, setAttendance] = useState<"hadir" | "tidak" | "">("hadir");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guests, setGuests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const fetchData = async (payload: RsvpFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    if (!name.trim() || !email.trim()) {
      setErrorMessage("Nama dan email tidak boleh kosong");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("https://api.mohaproject.dev/api/reservations", {
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
        throw new Error(backendError || "Failed to submit rsvp");
      }
      toast.success("RSVP berhasil dikirim! Terima kasih.");
      setCode(data?.data.code || "");
      setShowModal(true);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Failed to submit rsvp");
      } else {
        setErrorMessage(String(error) || "Failed to submit rsvp");
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
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Reservasi Berhasil!"
        >
          <div className="flex flex-col space-y-4">
            {attendance === "hadir" ? (
              <>
                <div className="flex items-start">
                  <h1>Simpan kode reservasi ini ya!</h1>
                </div>
                <div className="p-4 bg-white/10 border border-white/20 rounded-lg text-center flex flex-col items-center space-y-3">
                  <div className="flex gap-3 items-center justify-center">
                    <span className="font-mono text-xl text-white/95 select-all">
                      {reservationCode}
                    </span>
                    <button onClick={handleCopy} className="self-center">
                      {copied ? (
                        <LuCopyCheck className="w-5 h-5" />
                      ) : (
                        <LuCopy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start">
                <h1>Terima kasih atas konfirmasinya!</h1>
                <p>Semoga bisa ketemu di lain kesempatan ya</p>
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
          className="mx-auto w-full max-w-md px-6 py-8 md:py-24 text-center bg-black/30 rounded-2xl backdrop-blur-sm"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          <motion.h2
            className="font-playfair text-3xl md:text-4xl font-semibold text-white/95 mb-2"
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
            RSVP
          </motion.h2>

          <motion.p
            className="text-sm text-white/80 leading-relaxed"
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
            }}
          >
            Kindly let us know if you will be able to attend our wedding
            celebration. Your presence means a lot to us!
          </motion.p>

          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              const is_present = attendance === "hadir";
              const payload = {
                name: name?.trim(),
                email: email?.trim(),
                is_present,
                total_guests: Number(guests) || 0,
              };
              fetchData(payload);
            }}
            className="space-y-4 text-left"
            aria-label="RSVP Form"
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
                placeholder="Nama lengkap..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-lg bg-white/6 border border-white/16 text-sm text-white placeholder-white/50
                     focus:outline-none focus:ring-2 focus:ring-white/30 transition"
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
                placeholder="Email aktif..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-lg bg-white/6 border border-white/16 text-sm text-white placeholder-white/50
                     focus:outline-none focus:ring-2 focus:ring-white/30 transition"
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
                className="flex gap-3"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
              >
                <motion.label
                  className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm text-center border transition
              ${
                attendance === "hadir"
                  ? "bg-white/90 text-black border-transparent"
                  : "bg-white/6 border-white/16 text-white/95"
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
                  Hadir
                </motion.label>

                <motion.label
                  className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-sm text-center border transition
              ${
                attendance === "tidak"
                  ? "bg-white/90 text-black border-transparent"
                  : "bg-white/6 border-white/16 text-white/95"
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
                  Tidak Hadir
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
                placeholder="Berapa orang yang datang?"
                className={`mt-2 w-full h-11 px-4 rounded-lg text-sm placeholder-white/50 focus:outline-none focus:ring-2 transition
                      ${
                        attendance === "hadir"
                          ? "bg-white/6 border border-white/16 text-white"
                          : "bg-white/4 border border-white/10 text-white/60"
                      }`}
                disabled={attendance !== "hadir"}
                aria-disabled={attendance !== "hadir"}
                required={attendance === "hadir"}
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              />
              <motion.p
                className="mt-1 text-[11px] text-white/60"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              >
                {attendance === "hadir"
                  ? "Masukkan jumlah tamu. Maks 3 orang."
                  : "Non-aktif karena Anda menyatakan tidak hadir."}
              </motion.p>
            </motion.div>

            <motion.div
              aria-live="polite"
              className="min-h-5 text-sm text-white/85"
              variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            >
              {errorMessage ? (
                <motion.p
                  className="text-red-400 font-inter bg-red-300/10 py-2 px-4 rounded-md w-fit mx-auto"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errorMessage}
                </motion.p>
              ) : null}
            </motion.div>

            <motion.div
              className=""
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-full text-sm font-semibold tracking-wide transition
                     bg-white/90 text-black hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                whileHover={
                  isLoading
                    ? undefined
                    : {
                        scale: 1.02,
                        y: -3,
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
                      className="h-4 w-4 animate-spin"
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
                    Mengirim...
                  </>
                ) : (
                  "KIRIM RESERVASI"
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
