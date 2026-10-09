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
import { motion } from "motion/react";
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
    let mounted = true;
    const criticalAssets = ["/1.jpg", "/2.JPG", "/3.JPG"];

    const loadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new window.Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

    let loadedCount = 0;
    const total = criticalAssets.length;

    const updateProgress = () => {
      if (!mounted) return;
      loadedCount++;
      const pct = Math.min(90, Math.round((loadedCount / total) * 90));
      setProgress(pct);
    };

    // Load critical assets in parallel with a 1.4s safety ceiling
    const loadPromise = Promise.all(
      criticalAssets.map((src) => loadImage(src).then(updateProgress)),
    );

    const timeoutPromise = new Promise<void>((resolve) =>
      setTimeout(resolve, 1400),
    );

    Promise.race([loadPromise, timeoutPromise]).then(() => {
      if (!mounted) return;
      setProgress(100);
      setTimeout(() => {
        if (!mounted) return;
        setLoading(false);
      }, 250);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      {loading ? (
        <LoadingSection
          onNext={() => {
            heroRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          onPrev={() => {}}
          loading={loading}
          progress={progress}
          finishDelay={300}
        />
      ) : null}
      <main
        aria-hidden={loading}
        className={`relative flex h-dvh w-full items-stretch justify-center overflow-hidden bg-black transition-opacity ${
          loading ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false, amount: 0.25 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
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

        {/* <div className="absolute z-50 top-0 right-0 my-3 mx-7">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white cursor-pointer"
          >
            <RxHamburgerMenu className="w-5 h-5" />
          </button>
        </div> */}

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.8,
                ease: "easeOut",
                when: "beforeChildren",
                staggerChildren: 0.15,
              },
            },
          }}
          className="relative z-10 flex h-dvh w-full max-w-md flex-col items-center justify-between text-white pb-8 pt-20"
        >
          <motion.section
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
            }}
            className="w-full text-center space-y-3"
          >
            <span className="inline-block text-[11px] sm:text-xs tracking-[0.3em] uppercase text-amber-300/90 font-medium">
              THE WEDDING OF
            </span>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
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
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
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
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
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
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
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
              show: { opacity: 1, transition: { duration: 0.7 } },
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
