import HomePage from "@/components/Home";
import BackgroundMusic from "@/components/Music";
import React from "react";
import type { Metadata } from "next";

type Wish = {
  name: string;
  message: string;
  created_at: string;
};
type PageProps = {
  name: string;
};

async function getComments(): Promise<Wish[]> {
  try {
    const res = await fetch("https://api.mohaproject.tech/api/comments", {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) {
      return [];
    }
    const json = await res.json();
    return json?.data ?? [];
  } catch (err) {
    console.error("Failed to fetch comments", err);
    return [];
  }
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
}: {
  params: Promise<PageProps>;
}): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent((name || "").replace(/\+/g, " "));
  const displayName = capitalizeWords(decodedName || "Tamu Undangan");

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
}: {
  params: Promise<PageProps>;
}) {
  const { name } = await params;
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
