"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function NetworkBanner() {
  const { account, chainId, isCorrectNetwork, switchNetwork } = useWallet();

  // Hanya tampilkan jika dompet terhubung namun jaringan bukan Sepolia
  if (!account || isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 text-sm font-medium shadow-md flex items-center justify-between flex-wrap gap-2 transition-all">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-white animate-pulse" />
        <span>
          <strong>Jaringan Salah:</strong> Anda terhubung ke Chain ID {chainId || "tidak diketahui"}. Silakan beralih ke <strong>Ethereum Sepolia (Chain ID 11155111)</strong> agar transaksi dapat diproses.
        </span>
      </div>
      <button
        onClick={switchNetwork}
        className="inline-flex items-center gap-1.5 bg-white text-amber-700 hover:bg-amber-50 font-semibold px-4 py-1 rounded-full text-xs shadow transition-all cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Beralih ke Sepolia
      </button>
    </div>
  );
}

