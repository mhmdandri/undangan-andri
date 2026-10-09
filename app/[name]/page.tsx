import HomePage from "@/components/Home";
import BackgroundMusic from "@/components/Music";
import React from "react";
import type { Metadata } from "next";

import { redirect } from "next/navigation";
import { getReservationByCode } from "@/utils/reservation";

type Wish = {
  name: string;
  message: string;
  created_at: string;
};
type PageProps = {
  name: string;
};
type SearchParams = {
  [key: string]: string | string[] | undefined;
};

import { getServerApiUrl, getPublicApiUrl } from "@/utils/api";

async function getComments(): Promise<Wish[]> {
  const urls = Array.from(
    new Set([
      `${getServerApiUrl()}/api/comments`,
      `${getPublicApiUrl()}/api/comments`,
    ])
  );

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 10 },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          return json.data;
        }
      }
    } catch {
      // Continue to next URL fallback if one fails
    }
  }

  return [];
}

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<PageProps>;
  searchParams?: Promise<SearchParams>;
}): Promise<Metadata> {
  const { name } = await params;
  const query = searchParams ? await searchParams : undefined;
  const rawCode = query?.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  let displayName = "";
  if (code && typeof code === "string" && code.trim()) {
    const reservation = await getReservationByCode(code.trim());
    if (reservation?.name) {
      displayName = capitalizeWords(reservation.name);
    }
  }

  if (!displayName) {
    const decodedName = decodeURIComponent((name || "").replace(/\+/g, " "));
    displayName = capitalizeWords(decodedName || "Tamu Undangan");
  }

  const title = "The Wedding Of Andri & Cica";
  const description = `Kepada Yth. ${displayName}, kami mengundang Anda untuk merayakan hari pernikahan kami pada Sabtu, 21 November 2026.`;

  return {
    title: `${title} - Kepada ${displayName}`,
    description,
    openGraph: {
      type: "website",
      title: `${title} - Kepada ${displayName}`,
      description,
      siteName: "The Wedding Of Andri & Cica",
      locale: "id_ID",
      images: [
        {
          url: "/og-image.jpg",
          width: 800,
          height: 800,
          type: "image/jpeg",
          alt: `The Wedding Of Andri & Cica - ${displayName}`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${title} - Kepada ${displayName}`,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<PageProps>;
  searchParams?: Promise<SearchParams>;
}) {
  const { name } = await params;
  const query = searchParams ? await searchParams : undefined;
  const rawCode = query?.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  if (code && typeof code === "string" && code.trim()) {
    const reservation = await getReservationByCode(code.trim());
    if (reservation?.name) {
      const decodedCurrentName = decodeURIComponent((name || "").replace(/\+/g, " "));
      if (
        decodedCurrentName.toLowerCase() === "guest" ||
        decodedCurrentName.toLowerCase() !== reservation.name.toLowerCase()
      ) {
        redirect(`/${encodeURIComponent(reservation.name)}`);
      }
    }
  }

  const commentData = await getComments();
  const decodedName = decodeURIComponent(name.replace(/\+/g, " "));
  const displayName = capitalizeWords(decodedName || "Guest");

  return (
    <main className="h-dvh flex justify-center max-w-sm mx-auto">
      <BackgroundMusic />
      <div className="max-w-sm">
        <HomePage guestName={displayName} data={commentData} />
      </div>
    </main>
  );
}
