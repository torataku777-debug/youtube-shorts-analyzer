
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShortsTrend JP",
  description: "YouTube Shorts Trend Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex bg-background min-h-screen`}
      >
        <NextTopLoader color="#2563eb" showSpinner={false} />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64 pb-24 md:pb-8 w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
