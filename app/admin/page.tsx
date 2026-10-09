import React, { Suspense } from "react";
import type { Metadata } from "next";
import AdminGuestDashboard from "@/components/AdminGuestDashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard - Import Tamu Undangan | Andri & Cica",
  description: "Dashboard import data tamu Excel dan blast undangan WhatsApp.",
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08090d] flex items-center justify-center text-amber-300">
          Memuat Dashboard...
        </div>
      }
    >
      <AdminGuestDashboard />
    </Suspense>
  );
}
