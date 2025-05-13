import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextChan - Modern Imageboard",
  description: "A modern imageboard built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background font-sans antialiased overflow-x-hidden`}
      >
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
