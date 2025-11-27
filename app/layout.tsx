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

export const metadata: Metadata = {
  title: "The Wedding Of John Doe & Jane Doe",
  description: "by mohaproject",
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
