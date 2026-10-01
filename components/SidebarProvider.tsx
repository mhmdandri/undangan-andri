"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar"; // asumsi Sidebar sudah kamu tambahkan
import { RxHamburgerMenu } from "react-icons/rx";
import { motion, AnimatePresence } from "motion/react";

export default function SidebarProvider() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // state untuk mengontrol visibilitas sidebar
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleModalToggle = (e: Event) => {
      const custom = e as CustomEvent<{ open?: boolean }>;
      setIsModalOpen(Boolean(custom.detail?.open));
    };

    window.addEventListener("modal-open-change", handleModalToggle);
    return () => {
      window.removeEventListener("modal-open-change", handleModalToggle);
    };
  }, []);

  return (
    <>
      {/* Sidebar (drawer) */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          setIsSidebarVisible(true);
        }}
        // pakai file upload lokal sebagai thumbnail (sesuaikan jika perlu)
        thumbUrl="/og-image.jpg"
      />

      {/* Button trigger */}
      <AnimatePresence>
        {isSidebarVisible && !isModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 z-110"
          >
            <button
              onClick={() => {
                setSidebarOpen(true);
                setIsSidebarVisible(false);
              }}
              aria-label="Open navigation"
              className="p-2 text-white/95 cursor-pointer hover:text-white transition"
            >
              <RxHamburgerMenu className="w-6 h-6 drop-shadow-md" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
