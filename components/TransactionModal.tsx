"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, X, HelpCircle } from "lucide-react";
import { getEtherscanTxUrl } from "@/lib/blockchain";
import { HumanizedError } from "@/lib/errorHandler";

export type TransactionStatus = "idle" | "submitting" | "mining" | "success" | "error";

interface TransactionModalProps {
  status: TransactionStatus;
  txHash?: string;
  errorMessage?: string;
  humanizedError?: HumanizedError | null;
  onClose: () => void;
  title?: string;
  successMessage?: string;
}

export default function TransactionModal({
  status,
  txHash,
  errorMessage,
  humanizedError,
  onClose,
  title = "Transaksi Blockchain",
  successMessage = "Transaksi Anda telah berhasil dicatat pada jaringan Ethereum Sepolia.",
}: TransactionModalProps) {
  if (status === "idle") return null;

  const errorTitle = humanizedError?.title || "Pencatatan Belum Berhasil";
  const errorDesc =
    humanizedError?.description ||
    errorMessage ||
    "Operasi belum dapat diselesaikan saat ini.";
  const errorHint = humanizedError?.actionHint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative text-center max-h-[90vh] overflow-y-auto">
        {/* Tombol Tutup (Hanya saat sukses atau error) */}
        {(status === "success" || status === "error") && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-2 rounded-xl cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <h3 className="text-base font-bold text-gray-800 mb-4">{title}</h3>

        {/* Status: Menunggu di Wallet */}
        {status === "submitting" && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-[#0e7039] mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="font-bold text-gray-900 text-base mb-1">
              Menunggu Persetujuan MetaMask...
            </p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs">
              Silakan konfirmasi transaksi pada jendela pop-up dompet MetaMask Anda.
            </p>
          </div>
        )}

        {/* Status: Menunggu Block Mining */}
        {status === "mining" && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="font-bold text-gray-900 text-base mb-1">
              Sedang Memproses di Blockchain...
            </p>
            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mb-3">
              Transaksi telah disiarkan. Menunggu konfirmasi blok dari validator jaringan Sepolia.
            </p>
            {txHash && (
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 underline font-semibold"
              >
                Lihat Bukti Transaksi di Sepolia Etherscan <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Status: Berhasil */}
        {status === "success" && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-[#0e7039] mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="font-extrabold text-gray-900 text-lg mb-1">
              Pencatatan Berhasil!
            </p>
            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mb-4">
              {successMessage}
            </p>
            {txHash && (
              <a
                href={getEtherscanTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-[#0e7039] hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold mb-4 transition"
              >
                Lihat Bukti Keaslian Digital ↗ <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white py-3 rounded-full font-semibold text-sm transition shadow-sm cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Status: Gagal (Humanized & Informative) */}
        {status === "error" && (
          <div className="py-4 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
              <AlertCircle className="w-8 h-8" />
            </div>

            <p className="font-extrabold text-gray-900 text-lg mb-2">
              {errorTitle}
            </p>

            <p className="text-xs sm:text-sm text-gray-600 max-w-sm mb-4 leading-relaxed">
              {errorDesc}
            </p>

            {errorHint && (
              <div className="w-full bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 mb-5 text-left flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-snug">
                  <strong>Saran:</strong> {errorHint}
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-full font-semibold text-sm transition shadow-sm cursor-pointer"
            >
              Mengerti & Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
