import type { Metadata } from "next";
import { Suspense } from "react";
import ReservationCheckIn from "@/components/ReservationCheckIn";

export const metadata: Metadata = {
  title: "Check-in Reservasi Tamu | The Wedding of Andri & Cica",
  description:
    "Halaman konfirmasi check-in kehadiran tamu resepsi pernikahan Andri & Cica. Scan QR code atau masukkan kode 5 digit reservasi untuk memvalidasi kedatangan.",
};

export default function ReservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReservationCheckIn />
    </Suspense>
  );
}
