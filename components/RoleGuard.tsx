"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { formatAddress } from "@/lib/utils";
import { ShieldAlert, LogIn, LogOut, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import LoginModal from "./LoginModal";

interface RoleGuardProps {
  requiredRole: "isFarmer" | "isLogistics" | "isRetailer" | "isAdmin";
  roleName: string;
  children: React.ReactNode;
}

export default function RoleGuard({ requiredRole, roleName, children }: RoleGuardProps) {
  const {
    account,
    userInfo,
    isLoggedIn,
    activeRoleLabel,
    activeDashboardHref,
    requestAccountSwitch,
    logout,
  } = useWallet();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 1. Jika pengguna belum login
  if (!isLoggedIn || !account) {
    return (
      <>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Akses Halaman Dibatasi
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
            Halaman ini khusus untuk <strong>{roleName}</strong>. Silakan hubungkan dompet MetaMask Anda untuk melanjutkan.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white font-semibold py-3 rounded-full shadow-xs transition cursor-pointer text-sm"
            >
              Masuk dengan MetaMask
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Lacak Panen
            </Link>
          </div>
        </div>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  // 2. Pemeriksaan Ketat: Hanya address dengan peran yang sesuai yang dapat membuka dashboard ini
  const hasStrictAccess = Boolean(userInfo && userInfo[requiredRole]);

  if (!hasStrictAccess) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-gray-900 mb-2">
          Akses Ditolak
        </h2>

        <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
          Akun digital ini tidak memiliki hak akses untuk membuka halaman <strong>{roleName}</strong>.
        </p>

        {/* Informasi Akun Aktif Saat Ini */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left mb-6 space-y-1.5">
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
            Akun Terhubung Saat Ini
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono font-bold text-gray-800">
              {formatAddress(account)}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {activeRoleLabel || "Tanpa Peran"}
            </span>
          </div>
          {userInfo?.actorName && (
            <p className="text-xs text-gray-600 font-medium">
              Nama: {userInfo.actorName}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {/* Tombol Cepat Ganti Akun di MetaMask */}
          <button
            onClick={requestAccountSwitch}
            className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white font-semibold py-3 rounded-full shadow-xs transition cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Pilih / Ganti Akun di MetaMask
          </button>

          {/* Tombol pintas ke dashboard peran aktif akun ini jika ada */}
          {activeDashboardHref && (
            <Link
              href={activeDashboardHref}
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-[#0e7039] border border-emerald-200 font-semibold py-3 rounded-full transition cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <span>Buka Panel {activeRoleLabel} Anda</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          {/* Tombol Logout */}
          <button
            onClick={logout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-3 rounded-full transition cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar / Logout
          </button>

          {/* Tombol Kembali ke Lacak Panen */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Lacak Panen
          </Link>
        </div>
      </div>
    );
  }

  // 3. Jika akun memiliki hak akses ketat yang sah, tampilkan konten dashboard
  return <>{children}</>;
}
