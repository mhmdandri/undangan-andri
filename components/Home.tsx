"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroSection from "@/components/HeroSection";
import VerseSection from "@/components/VerseSection";
import GroomSection from "./GroomSection";
import BrideSection from "./BrideSection";
import JourneySection from "./JourneySection";
import EventSection from "./EventSection";
import Link from "next/link";
import DateSection from "./DateSection";
import CommentSection from "./CommentSection";
import ListCommentSection from "./ListCommentSection";
import RsvpSection from "./RsvpSection";
import GallerySection from "./GallerySection";
import LastSection from "./LastSection";
import LoadingSection from "@/components/LoadingSection"; // <--- baru
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { LuMailOpen } from "react-icons/lu";

import { getPublicApiUrl } from "@/utils/api";

type Wish = {
  name: string;
  message: string;
  created_at: string;
};
type HomePageProps = {
  guestName?: string;
  data?: Wish[];
  code?: string;
};

const HomePage = ({ guestName, data, code }: HomePageProps) => {
  const [comments, setComments] = useState<Wish[]>(data ?? []);
  const refreshComments = useCallback(async () => {
    try {
      const apiUrl = getPublicApiUrl();
      const res = await fetch(`${apiUrl}/api/comments`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json?.data)) {
        setComments(json.data);
      }
    } catch (error) {
      console.error("Failed to refresh comments", error);
    }
  }, []);

  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

  const heroRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const groomRef = useRef<HTMLDivElement>(null);
  const brideRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLDivElement>(null);
  const listCommentRef = useRef<HTMLDivElement>(null);
  const rsvpRef = useRef<HTMLDivElement>(null);
  const galeryRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const handleOpen = () => {
    if (typeof window !== "undefined") {
      const v = document.createElement("video");
      v.preload = "auto";
      v.src = "/media/2.mp4";
    }
    scrollTo(heroRef);
  };
  const handleScrollDown = () => scrollTo(verseRef);
  const handleGroomScrollDown = () => scrollTo(groomRef);
  const handleBrideScrollDown = () => scrollTo(brideRef);
  const handleJourneyScrollDown = () => {
    if (typeof window !== "undefined") {
      const v = document.createElement("video");
      v.preload = "auto";
      v.src = "/media/4.mp4";
    }
    scrollTo(journeyRef);
  };
  const handleEventScrollDown = () => {
    if (typeof window !== "undefined") {
      const v = document.createElement("video");
      v.preload = "auto";
      v.src = "/media/3.mp4";
    }
    scrollTo(eventRef);
  };
  const handleDateScrollDown = () => scrollTo(dateRef);
  const handleCommentScrollDown = () => scrollTo(commentRef);
  const handleListCommentScrollDown = () => scrollTo(listCommentRef);
  const handleRsvpScrollDown = () => scrollTo(rsvpRef);
  const handleGaleryScrollDown = () => scrollTo(galeryRef);
  const handleLastScrollDown = () => scrollTo(lastRef);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const criticalAssets = ["/1.jpg", "/2.JPG", "/3.JPG"];

    // Preload critical assets in the background
    criticalAssets.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });

    // Durasi loading tepat 3 detik
    const totalDuration = 3000;
    const intervalTime = 50;
    const totalSteps = totalDuration / intervalTime;
    let step = 0;

    const timer = setInterval(() => {
      if (!mounted) return;
      step++;
      // Kurva persentase ease-in-out yang lembut
      const t = step / totalSteps;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const currentPct = Math.min(100, Math.round(eased * 100));
      setProgress(currentPct);

      if (step >= totalSteps) {
        clearInterval(timer);
        setProgress(100);
        setTimeout(() => {
          if (!mounted) return;
          setLoading(false);
        }, 150);
      }
    }, intervalTime);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
          >
            <div className="relative h-dvh w-full max-w-sm overflow-hidden bg-black">
              <LoadingSection
                onNext={() => {}}
                onPrev={() => {}}
                loading={loading}
                progress={progress}
                finishDelay={200}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        aria-hidden={loading}
        className={`relative flex h-dvh w-full items-stretch justify-center overflow-hidden bg-black transition-opacity duration-300 ${
          loading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={
            !loading
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 1.05 }
          }
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <Image
            src="/1.jpg"
            alt="utama"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        <div className="absolute inset-0 bg-black/60" aria-hidden />

        <motion.div
          key={loading ? "cover-loading" : "cover-loaded"}
          initial="hidden"
          animate={!loading ? "show" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
                staggerChildren: 0.1,
              },
            },
          }}
          className="relative z-10 flex h-dvh w-full max-w-md flex-col items-center justify-between text-white pb-8 pt-20"
        >
          <motion.section
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="w-full text-center space-y-3"
          >
            <span className="inline-block text-[11px] sm:text-xs tracking-[0.3em] uppercase text-amber-300/90 font-medium">
              THE WEDDING OF
            </span>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className="text-4xl font-semibold font-alex-brush tracking-normal sm:text-5xl text-white drop-shadow-lg"
            >
              Andri &amp; Cica
            </motion.h1>

            {/* Ornamen Garis Pembatas */}
            <div
              className="flex items-center justify-center gap-2.5 text-amber-200/60"
              aria-hidden="true"
            >
              <div className="h-px w-10 sm:w-14 bg-linear-to-r from-transparent to-amber-200/60" />
              <span className="text-[10px] text-amber-300">✦</span>
              <div className="h-px w-10 sm:w-14 bg-linear-to-l from-transparent to-amber-200/60" />
            </div>

            <p className="text-[11px] sm:text-xs tracking-[0.3em] text-white/80 font-medium uppercase">
              SABTU, 21 NOVEMBER 2026
            </p>
          </motion.section>

          <motion.section
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.95, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="flex w-full flex-col items-center text-center space-y-4 mt-28"
          >
            {/* Kartu Penerima Undangan */}
            <div className="bg-black/25 border border-amber-400/30 rounded-2xl px-6 py-4 shadow-2xl max-w-xs w-full space-y-1">
              <p className="text-xs text-white/90 italic drop-shadow-md">
                Kepada Yth. Bapak/Ibu/Saudara/i:
              </p>

              <motion.h2
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                className="text-2xl sm:text-3xl font-semibold leading-snug font-alex-brush text-amber-200 drop-shadow-md"
              >
                {guestName ?? "Tamu Undangan"}
              </motion.h2>

              <p className="text-[10px] text-white/75 tracking-wider uppercase drop-shadow-md">
                Di Tempat
              </p>
            </div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10, scale: 0.96 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              <Link
                href="#"
                onClick={() => {
                  handleOpen();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.25em] text-slate-950 shadow-xl shadow-amber-500/25 transition active:scale-95"
              >
                <LuMailOpen className="w-4 h-4" />
                <span>BUKA UNDANGAN</span>
              </Link>
            </motion.div>
          </motion.section>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="text-xs uppercase tracking-[0.5em] text-white/60"
          >
            mohaproject
          </motion.div>
        </motion.div>
      </main>

      <HeroSection heroRef={heroRef} onScrollDown={handleScrollDown} />
      <VerseSection
        verseRef={verseRef}
        onNext={handleGroomScrollDown}
        onPrev={handleOpen}
      />
      <GroomSection
        verseRef={groomRef}
        onNext={handleBrideScrollDown}
        onPrev={handleScrollDown}
      />
      <BrideSection
        verseRef={brideRef}
        onNext={handleJourneyScrollDown}
        onPrev={handleGroomScrollDown}
      />
      <JourneySection
        verseRef={journeyRef}
        onNext={handleEventScrollDown}
        onPrev={handleBrideScrollDown}
      />
      <EventSection
        verseRef={eventRef}
        onNext={handleDateScrollDown}
        onPrev={handleJourneyScrollDown}
      />
      <DateSection
        verseRef={dateRef}
        onNext={handleCommentScrollDown}
        onPrev={handleEventScrollDown}
      />
      <CommentSection
        verseRef={commentRef}
        guestName={guestName}
        onNext={handleListCommentScrollDown}
        onPrev={handleDateScrollDown}
        onSubmitSuccess={refreshComments}
      />
      <ListCommentSection
        verseRef={listCommentRef}
        onNext={handleRsvpScrollDown}
        onPrev={handleCommentScrollDown}
        data={comments}
      />
      <RsvpSection
        verseRef={rsvpRef}
        onNext={handleGaleryScrollDown}
        onPrev={handleListCommentScrollDown}
        guestCode={code}
        defaultGuestName={guestName}
      />
      <GallerySection
        verseRef={galeryRef}
        onNext={handleLastScrollDown}
        onPrev={handleRsvpScrollDown}
      />
      <LastSection
        verseRef={lastRef}
        onNext={handleOpen}
        onPrev={handleGaleryScrollDown}
      />
    </>
  );
};

export default HomePage;
