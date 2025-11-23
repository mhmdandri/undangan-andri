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

type Wish = {
  name: string;
  message: string;
  created_at: string;
};
type HomePageProps = {
  guestName?: string;
  data?: Wish[];
};

const HomePage = ({ guestName, data }: HomePageProps) => {
  const [comments, setComments] = useState<Wish[]>(data ?? []);
  const refreshComments = useCallback(async () => {
    try {
      const res = await fetch("https://api.mohaproject.dev/api/comments", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      setComments(json?.data ?? []);
    } catch (error) {
      console.error("Failed to refresh comments", error);
    }
  }, []);

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
  const handleOpen = () => scrollTo(heroRef);
  const handleScrollDown = () => scrollTo(verseRef);
  const handleGroomScrollDown = () => scrollTo(groomRef);
  const handleBrideScrollDown = () => scrollTo(brideRef);
  const handleJourneyScrollDown = () => scrollTo(journeyRef);
  const handleEventScrollDown = () => scrollTo(eventRef);
  const handleDateScrollDown = () => scrollTo(dateRef);
  const handleCommentScrollDown = () => scrollTo(commentRef);
  const handleListCommentScrollDown = () => scrollTo(listCommentRef);
  const handleRsvpScrollDown = () => scrollTo(rsvpRef);
  const handleGaleryScrollDown = () => scrollTo(galeryRef);
  const handleLastScrollDown = () => scrollTo(lastRef);

  useEffect(() => {
    let mounted = true;
    // asset yang mau di load
    const assets: string[] = [
      "/media/vid1.mp4",
      "/media/vid2.mp4",
      "/media/vid1.png",
      "/media/pemeran2.png",
      "/media/prewed.png",
    ];

    const loadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

    const loadVideoMeta = (src: string) =>
      new Promise<void>((resolve) => {
        try {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.src = src;
          const onLoaded = () => {
            cleanup();
            resolve();
          };
          const onErr = () => {
            cleanup();
            resolve();
          };
          function cleanup() {
            v.removeEventListener("loadedmetadata", onLoaded);
            v.removeEventListener("canplaythrough", onLoaded);
            v.removeEventListener("error", onErr);
          }
          v.addEventListener("loadedmetadata", onLoaded);
          v.addEventListener("canplaythrough", onLoaded);
          v.addEventListener("error", onErr);
        } catch {
          resolve();
        }
      });
    const loaderFor = (src: string) =>
      src.match(/\.(mp4|webm|ogg)$/i) ? loadVideoMeta(src) : loadImage(src);
    let completed = 0;
    const total = assets.length;

    (async () => {
      for (const a of assets) {
        await loaderFor(a);
        completed += 1;
        if (!mounted) return;
        const pct = Math.round((completed / total) * 100);
        setProgress(pct);
      }
      if (!mounted) return;
      setTimeout(() => {
        if (!mounted) return;
        setProgress(100);
        setTimeout(() => setLoading(false), 200);
      }, 300);
    })();

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
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/media/vid1.png"
        >
          <source src="/media/vid1.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-black/60" aria-hidden />

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
            className="w-full text-center tracking-[0.35em] text-white/70 space-y-4"
          >
            <p className="text-xs uppercase">THE WEDDING OF</p>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
              className="text-3xl font-semibold font-alex-brush tracking-normal sm:text-4xl"
            >
              John &amp; Jane
            </motion.h1>

            <p className="text-xs tracking-[0.35em] text-white/80">
              SELASA, 30 SEPTEMBER 2025
            </p>
          </motion.section>

          <motion.section
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
            }}
            className="flex w-full flex-col items-center text-center text-white/80 space-y-4"
          >
            <p className="italic text-lg">Kepada</p>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
              }}
              className="text-3xl font-semibold leading-snug font-alex-brush"
            >
              {guestName ?? "Tamu Undangan"}
            </motion.h1>

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
                className="rounded-full bg-white/50 px-7 py-3 text-xs font-medium uppercase tracking-[0.3em] text-black transition hover:bg-white/60"
              >
                OPEN INVITATION
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
