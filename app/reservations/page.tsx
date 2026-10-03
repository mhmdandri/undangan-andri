import type { Metadata } from "next";
import ReservationCheckIn from "@/components/ReservationCheckIn";

export const metadata: Metadata = {
  title: "Check-in Reservasi Tamu | The Wedding of Andri & Cica",
  description:
    "Halaman konfirmasi check-in kehadiran tamu resepsi pernikahan Andri & Cica. Masukkan kode 5 digit reservasi untuk memvalidasi kedatangan.",
};

export default function ReservationsPage() {
  return <ReservationCheckIn />;
}
