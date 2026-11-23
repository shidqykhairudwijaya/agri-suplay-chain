"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { formatAddress } from "@/lib/utils";
import { Sprout, User, ChevronDown, LogOut, ExternalLink, RefreshCw } from "lucide-react";
import { getEtherscanAddressUrl } from "@/lib/blockchain";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const pathname = usePathname();
  const {
    account,
    userInfo,
    activeRoleLabel,
    activeDashboardHref,
    isLoggedIn,
    requestAccountSwitch,
    logout,
  } = useWallet();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Periksa apakah halaman aktif adalah Lacak Panen
  const isTrackingActive = pathname === "/" || pathname.startsWith("/tracking");

  // Hanya tampilkan 1 link panel dashboard yang sesuai dengan peran aktif akun terhubung
  const singleDashboardLink = React.useMemo(() => {
    if (!isLoggedIn || !userInfo || !activeDashboardHref) return null;
    if (userInfo.isAdmin) return { href: "/dashboard/admin", label: "Panel Admin" };
    if (userInfo.isFarmer) return { href: "/dashboard/farmer", label: "Panel Petani" };
    if (userInfo.isLogistics) return { href: "/dashboard/logistics", label: "Panel Pengiriman" };
    if (userInfo.isRetailer) return { href: "/dashboard/retailer", label: "Panel Penerimaan" };
    return null;
  }, [isLoggedIn, userInfo, activeDashboardHref]);

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Petani":
        return "bg-emerald-100 text-[#0e7039] border-emerald-200";
      case "Logistik":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Pembeli":
        return "bg-teal-100 text-teal-700 border-teal-200";
      case "Admin":
        return "bg-slate-100 text-slate-700 border-slate-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-colors">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-[#0e7039] transition-transform group-hover:scale-105">
              <Sprout className="w-5 h-5 fill-[#0e7039]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Jejak<span className="text-[#0e7039]">Tani</span>
            </span>
          </Link>

          {/* Center Nav Items */}
          <nav className="flex items-center gap-8">
            <Link
              href="/"
              className="flex flex-col items-center text-sm font-semibold text-gray-800 hover:text-[#0e7039] transition relative py-1"
            >
              <span>Lacak Panen</span>
              {isTrackingActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#0e7039] absolute -bottom-1"></span>
              )}
            </Link>

            {/* Hanya 1 link panel yang sesuai dengan peran aktif */}
            {singleDashboardLink && (
              <Link
                href={singleDashboardLink.href}
                className="flex flex-col items-center text-sm font-semibold text-gray-800 hover:text-[#0e7039] transition relative py-1"
              >
                <span>{singleDashboardLink.label}</span>
                {pathname.startsWith("/dashboard") && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0e7039] absolute -bottom-1"></span>
                )}
              </Link>
            )}
          </nav>

          {/* Right Side: Masuk Akun / User Pill */}
          <div className="relative">
            {!isLoggedIn || !account ? (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-[#0e7039] hover:bg-[#0b5c2e] text-white font-medium text-sm px-6 py-2.5 rounded-full shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
              >
                Masuk Akun
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5 flex items-center gap-2.5 shadow-xs transition-all cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0e7039]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium text-gray-800 max-w-[140px] truncate">
                    {userInfo?.actorName || formatAddress(account)}
                  </span>
                  {activeRoleLabel && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeClass(
                        activeRoleLabel
                      )}`}
                    >
                      {activeRoleLabel}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Dropdown Menu Akun */}
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-3 bg-gray-50 rounded-xl mb-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                            Akun Digital
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeClass(
                              activeRoleLabel
                            )}`}
                          >
                            {activeRoleLabel}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-gray-900 font-semibold break-all">
                          {account}
                        </p>
                        <a
                          href={getEtherscanAddressUrl(account)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#0e7039] hover:underline mt-1.5 font-medium"
                        >
                          Lihat di Etherscan <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Tombol Ganti Akun di MetaMask */}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          requestAccountSwitch();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#0e7039]" />
                        Ganti Akun di MetaMask
                      </button>

                      {/* Tombol Keluar / Logout */}
                      <button
                        onClick={() => {
                          logout();
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-red-600 bg-red-50/50 hover:bg-red-50 rounded-xl font-semibold transition cursor-pointer mt-1"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar / Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal Masuk Akun */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
