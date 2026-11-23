"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserCheck, Truck, Store } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchCode, setSearchCode] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchCode.trim();
    if (trimmed) {
      router.push(`/tracking/${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-12 sm:pt-20 lg:pt-24">
      {/* Hero Header */}
      <div className="text-center mb-10 lg:mb-14">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-4">
          Lacak Asal-Usul Hasil Panen Anda
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Pastikan keaslian dan perjalanan produk pertanian dari kebun hingga ke tangan Anda secara transparan.
        </p>
      </div>

      {/* Search Bar Container */}
      <div className="max-w-3xl mx-auto mb-16 lg:mb-20">
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-3xl sm:rounded-full p-2 sm:p-2.5 sm:pl-7 shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 transition-all focus-within:ring-2 focus-within:ring-emerald-500/20"
        >
          <input
            type="text"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Masukkan Kode Panen (cth: PANEN-001)"
            className="flex-1 bg-transparent px-3 py-2 sm:px-0 sm:py-0 text-base lg:text-lg text-gray-800 placeholder-gray-400 focus:outline-none min-h-[44px]"
            required
          />
          <button
            type="submit"
            className="bg-[#0e7039] hover:bg-[#0b5c2e] text-white px-8 py-3.5 rounded-2xl sm:rounded-full font-semibold text-sm sm:text-base transition-all shadow-sm hover:shadow cursor-pointer flex-shrink-0 text-center min-h-[46px]"
          >
            Lacak Sekarang
          </button>
        </form>
        <p className="text-center text-xs sm:text-sm text-gray-400 mt-3.5">
          Atau pindai QR Code pada kemasan produk.
        </p>
      </div>

      {/* Alur Perjalanan Panen Section */}
      <div className="mt-12 lg:mt-16">
        <h2 className="text-sm lg:text-base font-semibold text-gray-500 mb-5 tracking-wide">
          Alur Perjalanan Panen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Langkah 1 */}
          <div className="bg-white rounded-2xl p-6 lg:p-7 shadow-xs border border-gray-100 flex items-center gap-5 transition hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                1. Dipanen Petani
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-snug">
                Hasil panen dicatat langsung dari kebun
              </p>
            </div>
          </div>

          {/* Langkah 2 */}
          <div className="bg-white rounded-2xl p-6 lg:p-7 shadow-xs border border-gray-100 flex items-center gap-5 transition hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center flex-shrink-0">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                2. Dikirim Kurir
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-snug">
                Status pengiriman diperbarui secara langsung
              </p>
            </div>
          </div>

          {/* Langkah 3 */}
          <div className="bg-white rounded-2xl p-6 lg:p-7 shadow-xs border border-gray-100 flex items-center gap-5 transition hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center flex-shrink-0">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">
                3. Diterima Pembeli
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-snug">
                Penerimaan dikonfirmasi dengan bukti digital
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

