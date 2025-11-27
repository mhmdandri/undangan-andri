// components/Sidebar.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  BsX,
  BsHouse,
  BsHeart,
  BsCalendar,
  BsChatDots,
  BsImages,
  BsFillTelephoneFill,
} from "react-icons/bs";

type LinkItem = {
  id: string;
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  links?: LinkItem[];
  /** optional small logo/thumbnail url; default uses uploaded image path */
  thumbUrl?: string;
};

const defaultLinks: LinkItem[] = [
  { id: "home", label: "Home", href: "#hero", icon: <BsHouse /> },
  { id: "verse", label: "Verse", href: "#verse", icon: <BsHeart /> },
  { id: "journey", label: "Journey", href: "#journey", icon: <BsCalendar /> },
  {
    id: "event",
    label: "Event",
    href: "#event",
    icon: <BsFillTelephoneFill />,
  },
  { id: "gallery", label: "Gallery", href: "#gallery", icon: <BsImages /> },
  { id: "wishes", label: "Wishes", href: "#comments", icon: <BsChatDots /> },
];

const container: Variants = {
  hidden: { x: "-100%" },
  show: {
    x: 0,
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 22,
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
  exit: { x: "-100%", transition: { ease: "easeInOut", duration: 0.28 } },
};

const item = {
  hidden: { opacity: 0, x: -8 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.42 },
  },
};

export default function Sidebar({
  open,
  onClose,
  links = defaultLinks,
  thumbUrl,
}: SidebarProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // default thumbnail path (uploaded file). The environment will transform this path to a URL.
  const defaultThumb = "/media/prewed.png";
  const imgSrc = thumbUrl ?? defaultThumb;

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // simple focus trap: focus first focusable element when open
  useEffect(() => {
    if (open) {
      window.setTimeout(() => {
        const el = dialogRef.current?.querySelector<HTMLElement>(
          "button, a, [tabindex]:not([tabindex='-1'])"
        );
        el?.focus();
      }, 50);
    }
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-90 bg-black"
              aria-hidden
              onClick={onClose}
            />

            {/* sidebar */}
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              ref={dialogRef}
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
              className="fixed left-0 top-0 z-100 h-full w-72 max-w-[86vw] md:w-64 bg-white/6 backdrop-blur-xl border-r border-white/12 text-white shadow-2xl"
            >
              <div className="h-full flex flex-col">
                {/* header */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-white/8 flex items-center justify-center">
                    <Image
                      src={imgSrc}
                      alt="couple thumbnail"
                      width={56}
                      height={56}
                      className="object-cover"
                      priority
                    />
                  </div>

                  <div className="flex-1">
                    <div className="text-sm tracking-[0.28em] uppercase text-white/70">
                      The Wedding Of
                    </div>
                    <div className="text-lg font-alex-brush leading-none text-white/95">
                      John &amp; Jane
                    </div>
                  </div>

                  <motion.button
                    onClick={onClose}
                    aria-label="Close navigation"
                    whileHover={{ scale: 1.06, rotate: 10 }}
                    whileTap={{ scale: 0.96 }}
                    className="ml-2 rounded-full p-2 text-white/90 hover:bg-white/8"
                  >
                    <BsX />
                  </motion.button>
                </div>

                {/* nav items */}
                <nav className="flex-1 overflow-auto px-2 py-6">
                  <motion.ul
                    className="space-y-1 px-2"
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                  >
                    {links.map((l) => (
                      <motion.li key={l.id} variants={item} className="px-1">
                        <a
                          href={l.href ?? "#"}
                          onClick={(e) => {
                            if (l.onClick) {
                              e.preventDefault();
                              l.onClick();
                            } else {
                              // default: scroll to anchor if exists
                              const target = document.querySelector(
                                l.href ?? ""
                              );
                              if (target) {
                                e.preventDefault();
                                target.scrollIntoView({
                                  behavior: "smooth",
                                  block: "start",
                                });
                                onClose();
                              }
                            }
                          }}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm md:text-[15px] hover:bg-white/8 transition"
                        >
                          <span className="text-xl text-white/90">
                            {l.icon}
                          </span>
                          <span className="flex-1 text-left">
                            <span className="block text-white/95">
                              {l.label}
                            </span>
                            {/* <span className="block text-xs text-white/60">
                              Tap to view
                            </span> */}
                          </span>
                          <span className="text-white/40 group-hover:text-white/90">
                            ›
                          </span>
                        </a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </nav>

                {/* footer */}
                <div className="px-5 py-4 border-t border-white/8">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <div>
                      <div className="uppercase tracking-[0.25em] text-xs">
                        Date
                      </div>
                      <div className="font-playfair">30 September 2025</div>
                    </div>

                    <div>
                      <button
                        onClick={() => {
                          // quick action: open save-the-date modal or copy to clipboard
                          navigator.clipboard?.writeText?.(
                            "30 September 2025 — John & Jane"
                          );
                        }}
                        className="rounded-full bg-white/10 px-3 py-2 text-xs hover:bg-white/16 transition"
                        title="Copy date"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
