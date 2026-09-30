import type { Metadata, Viewport } from "next";
import { Alex_Brush, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SidebarProvider from "@/components/SidebarProvider";

const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alex-brush",
});
const playFairDisplay = Playfair_Display({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : new URL("https://andricica.mohaproject.tech");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "The Wedding Of Andri & Cica",
  description: "Undangan pernikahan Andri & Cica, 21 November 2026.",
  openGraph: {
    type: "website",
    title: "The Wedding Of Andri & Cica",
    description: "Undangan pernikahan Andri & Cica, 21 November 2026.",
    images: [
      {
        url: "/og-image.jpg",
        alt: "Andri & Cica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Wedding Of Andri & Cica",
    description: "Undangan pernikahan Andri & Cica, 21 November 2026.",
    images: ["/og-image.jpg"],
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${alexBrush.variable} ${playFairDisplay} ${inter.variable} h-dvh antialiased`}
      >
        <ToastContainer
          closeButton={false}
          toastClassName="toastify"
          className="toastify-body"
          progressClassName="toastify-progress"
          position="top-right"
          autoClose={5000}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <SidebarProvider />
        {children}
      </body>
    </html>
  );
}
