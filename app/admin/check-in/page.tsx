import { Suspense } from "react";
import type { Metadata } from "next";
import AdminCheckInPage from "@/components/AdminCheckInPage";

export const metadata: Metadata = {
  title: "Check-in Manual Tamu - Meja Penerima Tamu | Andri & Cica",
  description:
    "Halaman check-in penerima tamu pernikahan Andri & Cica. Cari nama tamu dan konfirmasi kehadiran langsung jika tamu tidak membawa barcode atau lupa kode tiket.",
};

export default function AdminCheckInRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-amber-300">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminCheckInPage />
    </Suspense>
  );
}
