import HomePage from "@/components/Home";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/guest");
  return (
    <main className="min-h-dvh flex justify-center items-stretch top-0">
      <HomePage />
    </main>
  );
}
