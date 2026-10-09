import { redirect } from "next/navigation";
import { getReservationByCode } from "@/utils/reservation";
import type { Metadata } from "next";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const rawCode = params?.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  let displayName = "Tamu Undangan";
  if (code && typeof code === "string" && code.trim()) {
    const reservation = await getReservationByCode(code.trim());
    if (reservation?.name) {
      displayName = capitalizeWords(reservation.name);
    }
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

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawCode = params?.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;

  if (code && typeof code === "string" && code.trim()) {
    const reservation = await getReservationByCode(code.trim());
    if (reservation?.name) {
      redirect(`/${encodeURIComponent(reservation.name)}?code=${encodeURIComponent(code.trim())}`);
    }
  }

  redirect("/guest");
}
