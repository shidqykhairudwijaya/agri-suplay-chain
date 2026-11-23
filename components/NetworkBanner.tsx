"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function NetworkBanner() {
  const { account, chainId, isCorrectNetwork, switchNetwork } = useWallet();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Hanya tampilkan jika dompet terhubung namun jaringan bukan Sepolia, setelah komponen mounted di client
  if (!mounted || !account || isCorrectNetwork) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-3 text-sm font-medium shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
      <div className="flex items-start sm:items-center gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-white animate-pulse mt-0.5 sm:mt-0" />
        <span className="text-xs sm:text-sm">
          <strong>Jaringan Salah:</strong> Anda terhubung ke Chain ID {chainId || "tidak diketahui"}. Silakan beralih ke <strong>Ethereum Sepolia (Chain ID 11155111)</strong> agar transaksi dapat diproses.
        </span>
      </div>
      <button
        onClick={switchNetwork}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white text-amber-700 hover:bg-amber-50 font-semibold px-4 py-2 rounded-full text-xs shadow-xs transition-all cursor-pointer min-h-[40px] flex-shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Beralih ke Sepolia
      </button>
    </div>
  );
}

