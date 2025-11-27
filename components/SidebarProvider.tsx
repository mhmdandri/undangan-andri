"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar"; // asumsi Sidebar sudah kamu tambahkan
import { RxHamburgerMenu } from "react-icons/rx";
import { motion } from "framer-motion";

export default function SidebarProvider() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true); // state untuk mengontrol visibilitas sidebar
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
        thumbUrl="/media/prewed.png"
      />

      {/* Button trigger */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="absolute top-4 right-4 z-110" /* pastikan z lebih besar dari backdrop (Sidebar backdrop z-[90]) */
      >
        {isSidebarVisible && (
          <button
            onClick={() => {
              setSidebarOpen(true);
              setIsSidebarVisible(false);
            }}
            aria-label="Open navigation"
            className="p-2 text-white/95"
          >
            <RxHamburgerMenu className="w-6 h-6" />
          </button>
        )}
      </motion.div>
    </>
  );
}
