import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import NetworkBanner from "@/components/NetworkBanner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "JejakTani - Lacak Asal-Usul Hasil Panen Anda",
  description:
    "Pastikan keaslian dan perjalanan produk pertanian dari kebun hingga ke tangan Anda secara transparan berbasis blockchain Ethereum Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-[#f8faf7] text-gray-900 antialiased selection:bg-emerald-100 selection:text-[#0e7039]">
        <WalletProvider>
          <NetworkBanner />
          <Suspense fallback={<div className="h-18 bg-white border-b border-gray-200/80" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 pb-16">{children}</main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
