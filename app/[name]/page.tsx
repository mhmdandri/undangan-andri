import HomePage from "@/components/Home";
import BackgroundMusic from "@/components/Music";
import React from "react";

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
    const res = await fetch("https://api.mohaproject.dev/api/comments", {
      cache: "no-store",
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

const capitalizeWords = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default async function Page({ params }: { params: PageProps }) {
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
