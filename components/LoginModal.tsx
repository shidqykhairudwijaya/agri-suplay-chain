"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { X, LogIn, Wallet, ArrowRight, Loader2, Users } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { connectWallet, requestAccountSwitch, isConnecting } = useWallet();

  if (!isOpen) return null;

  const handleMetaMaskLogin = async () => {
    const info = await connectWallet();
    if (info) {
      onClose();
    }
  };

  const handleSwitchAccount = async () => {
    const info = await requestAccountSwitch();
    if (info) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-xl cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Masuk ke JejakTani
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Hubungkan dompet digital MetaMask Anda. Sistem akan otomatis mendeteksi peran dan mengarahkan ke dashboard yang sesuai.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Opsi 1: Masuk dengan Akun Aktif MetaMask */}
          <button
            onClick={handleMetaMaskLogin}
            disabled={isConnecting}
            className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white p-4 rounded-2xl font-semibold text-sm transition shadow-xs flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Masuk Akun Aktif MetaMask</p>
                <p className="text-[11px] text-white/80 font-normal">
                  Gunakan akun yang sedang dipilih di dompet
                </p>
              </div>
            </div>
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>

          {/* Opsi 2: Pilih / Ganti Akun Lain di MetaMask */}
          <button
            onClick={handleSwitchAccount}
            disabled={isConnecting}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-800 p-4 rounded-2xl font-semibold text-sm transition shadow-2xs flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-200/60 text-[#0e7039] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Pilih / Ganti Akun Lain</p>
                <p className="text-[11px] text-gray-500 font-normal">
                  Pilih akun Petani, Kurir, atau Toko di MetaMask
                </p>
              </div>
            </div>
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : (
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-5">
          Pastikan Anda telah memasang ekstensi MetaMask di peramban Anda.
        </p>
      </div>
    </div>
  );
}
