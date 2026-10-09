import React, { Suspense } from "react";
import type { Metadata } from "next";
import GuestListPage from "@/components/GuestListPage";

export const metadata: Metadata = {
  title: "Daftar Tamu & QR Tiket | The Wedding of Andri & Cica",
  description:
    "Daftar tamu resepsi pernikahan Andri & Cica. Temukan nama Anda untuk melihat status kehadiran dan menampilkan QR Code tiket masuk.",
};

export default function ListGuestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-amber-300">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GuestListPage />
    </Suspense>
  );
}
