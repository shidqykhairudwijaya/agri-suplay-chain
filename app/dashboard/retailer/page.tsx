"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { getReadOnlyContract, getSignerContract } from "@/lib/blockchain";
import { BatchData, BatchStatus } from "@/constants/contract";
import { getStatusBadgeConfig } from "@/lib/utils";
import { parseHumanizedError, HumanizedError } from "@/lib/errorHandler";
import RoleGuard from "@/components/RoleGuard";
import TransactionModal, { TransactionStatus } from "@/components/TransactionModal";
import { Store, Loader2, CheckCircle2, Clock } from "lucide-react";

export default function RetailerDashboard() {
  const { account, signer, isCorrectNetwork, switchNetwork } = useWallet();

  const [activeTab, setActiveTab] = useState<"inTransit" | "delivered">("inTransit");
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);

  // Transaction modal state
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [humanizedError, setHumanizedError] = useState<HumanizedError | null>(null);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      const allBatchesRaw = await contract.getAllBatches();

      const list: BatchData[] = [];
      for (const item of allBatchesRaw) {
        if (item.exists) {
          list.push({
            batchId: item.batchId,
            commodityName: item.commodityName,
            weightKg: item.weightKg,
            farmLocation: item.farmLocation,
            farmerAddress: item.farmerAddress,
            farmerName: item.farmerName,
            status: Number(item.status) as BatchStatus,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            exists: item.exists,
          });
        }
      }

      list.sort((a, b) => Number(b.updatedAt - a.updatedAt));
      setBatches(list);
    } catch (err) {
      console.error("Gagal mengambil data penerimaan pembeli:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const inTransitBatches = batches.filter((b) => b.status === BatchStatus.InTransit);
  const deliveredBatches = batches.filter((b) => b.status === BatchStatus.Delivered);

  const displayedBatches = activeTab === "inTransit" ? inTransitBatches : deliveredBatches;

  // Handle confirmDelivery
  const handleConfirmDelivery = async (batchId: string) => {
    let activeSigner = signer;
    if (!activeSigner && typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === account?.toLowerCase()) {
          activeSigner = await provider.getSigner();
        }
      } catch {}
    }

    if (!activeSigner) {
      setHumanizedError({
        title: "Pilih Akun Pembeli di MetaMask",
        description: `Akun Pembeli Anda (${account}) belum aktif sebagai penandatangan di dompet MetaMask.`,
        actionHint: "Buka ekstensi MetaMask Anda, pilih akun yang memiliki alamat Pembeli ini, lalu coba konfirmasi kembali.",
      });
      setTxStatus("error");
      return;
    }

    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    try {
      setTxStatus("submitting");
      setHumanizedError(null);
      const contract = getSignerContract(activeSigner);

      const tx = await contract.confirmDelivery(batchId);
      setTxHash(tx.hash);
      setTxStatus("mining");

      await tx.wait();
      setTxStatus("success");

      await fetchBatches();
    } catch (err: any) {
      console.error("Error confirmDelivery:", err);
      const humErr = parseHumanizedError(err, "delivery");
      setHumanizedError(humErr);
      setTxStatus("error");
    }
  };

  return (
    <RoleGuard requiredRole="isRetailer" roleName="Pembeli">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10">
        {/* Header Title */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Panel Penerimaan Barang
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5">
            Konfirmasi penerimaan hasil panen yang telah sampai di lokasi Anda.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("inTransit")}
            className={`pb-3 text-sm font-semibold transition relative cursor-pointer ${
              activeTab === "inTransit"
                ? "text-[#0e7039] border-b-2 border-[#0e7039]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Dalam Perjalanan ({inTransitBatches.length})
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`pb-3 text-sm font-semibold transition relative cursor-pointer ${
              activeTab === "delivered"
                ? "text-[#0e7039] border-b-2 border-[#0e7039]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Riwayat Diterima ({deliveredBatches.length})
          </button>
        </div>

        {/* Batch Cards List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0e7039] mb-2" />
            <p className="text-sm">Memuat data penerimaan...</p>
          </div>
        ) : displayedBatches.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0e7039] flex items-center justify-center mx-auto mb-3">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1">
              {activeTab === "inTransit"
                ? "Tidak ada pengiriman dalam perjalanan ke lokasi Anda"
                : "Belum ada riwayat penerimaan produk"}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {activeTab === "inTransit"
                ? "Produk yang sedang dikirim oleh kurir akan muncul di sini untuk dikonfirmasi."
                : "Produk yang telah Anda konfirmasi penerimaannya akan tercatat permanen di riwayat ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedBatches.map((item) => {
              const badge = getStatusBadgeConfig(item.status);

              return (
                <div
                  key={item.batchId}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
                        {item.batchId}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${badge.badgeClass}`}
                      >
                        {badge.iconType === "check" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-gray-700">
                      {item.commodityName} • {item.weightKg.toString()} kg
                    </p>

                    <p className="text-xs text-gray-500">
                      Asal: {item.farmLocation} • Petani:{" "}
                      <span className="font-semibold text-gray-700">
                        {item.farmerName || "Petani Terdaftar"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                    <Link
                      href={`/tracking/${encodeURIComponent(item.batchId)}`}
                      className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer"
                    >
                      Detail
                    </Link>

                    {item.status === BatchStatus.InTransit && (
                      <button
                        onClick={() => handleConfirmDelivery(item.batchId)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Konfirmasi Diterima
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Status Transaksi dengan Penjelasan Humanis */}
        <TransactionModal
          status={txStatus}
          txHash={txHash}
          humanizedError={humanizedError}
          onClose={() => setTxStatus("idle")}
          title="Konfirmasi Penerimaan"
          successMessage="Penerimaan hasil panen berhasil dikonfirmasi dan status diperbarui menjadi 'Sudah Diterima'!"
        />
      </div>
    </RoleGuard>
  );
}
