"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { getReadOnlyContract, getSignerContract } from "@/lib/blockchain";
import { BatchData, BatchStatus } from "@/constants/contract";
import { getStatusBadgeConfig } from "@/lib/utils";
import { parseHumanizedError, HumanizedError } from "@/lib/errorHandler";
import RoleGuard from "@/components/RoleGuard";
import QRCodeModal from "@/components/QRCodeModal";
import TransactionModal, { TransactionStatus } from "@/components/TransactionModal";
import { PenSquare, ListFilter, QrCode, Loader2, Clock, CheckCircle2 } from "lucide-react";

export default function FarmerDashboard() {
  const { account, signer, isCorrectNetwork, switchNetwork } = useWallet();

  // Form states
  const [batchId, setBatchId] = useState("");
  const [commodityName, setCommodityName] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [farmLocation, setFarmLocation] = useState("");

  // List of batches
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // QR Modal state
  const [selectedBatchForQR, setSelectedBatchForQR] = useState<{
    batchId: string;
    commodityName: string;
  } | null>(null);

  // Transaction modal state
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [humanizedError, setHumanizedError] = useState<HumanizedError | null>(null);

  // Fetch batches belonging to this farmer
  const fetchMyBatches = useCallback(async () => {
    if (!account) return;
    setLoadingBatches(true);
    try {
      const contract = getReadOnlyContract();
      const allBatchesRaw = await contract.getAllBatches();

      const myBatches: BatchData[] = [];
      for (const item of allBatchesRaw) {
        if (
          item.exists &&
          item.farmerAddress &&
          item.farmerAddress.toLowerCase() === account.toLowerCase()
        ) {
          myBatches.push({
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

      // Urutkan berdasarkan waktu pendaftaran terbaru
      myBatches.sort((a, b) => Number(b.createdAt - a.createdAt));
      setBatches(myBatches);
    } catch (err) {
      console.error("Gagal mengambil data panen petani:", err);
    } finally {
      setLoadingBatches(false);
    }
  }, [account]);

  useEffect(() => {
    fetchMyBatches();
  }, [fetchMyBatches]);

  // Handle registerHarvest submit
  const handleRegisterHarvest = async (e: React.FormEvent) => {
    e.preventDefault();

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
        title: "Pilih Akun Petani di MetaMask",
        description: `Akun Petani Anda (${account}) belum aktif sebagai penandatangan di dompet MetaMask.`,
        actionHint: "Buka ekstensi MetaMask Anda, pilih akun yang memiliki alamat Petani ini, lalu coba simpan kembali.",
      });
      setTxStatus("error");
      return;
    }

    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    const weightNum = parseInt(weightKg, 10);
    if (isNaN(weightNum) || weightNum <= 0) {
      setHumanizedError({
        title: "Bobot Panen Tidak Tepat",
        description: "Jumlah berat hasil panen harus berupa angka positif.",
        actionHint: "Masukkan angka berat yang valid (contoh: 500).",
      });
      setTxStatus("error");
      return;
    }

    try {
      setTxStatus("submitting");
      setHumanizedError(null);
      const contract = getSignerContract(activeSigner);

      const tx = await contract.registerHarvest(
        batchId.trim(),
        commodityName.trim(),
        BigInt(weightNum),
        farmLocation.trim()
      );

      setTxHash(tx.hash);
      setTxStatus("mining");

      await tx.wait();
      setTxStatus("success");

      // Reset form
      setBatchId("");
      setCommodityName("");
      setWeightKg("");
      setFarmLocation("");

      // Refresh data
      await fetchMyBatches();
    } catch (err: any) {
      console.error("Error registerHarvest:", err);
      const humErr = parseHumanizedError(err, "harvest");
      setHumanizedError(humErr);
      setTxStatus("error");
    }
  };

  return (
    <RoleGuard requiredRole="isFarmer" roleName="Petani">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10">
        {/* Header Title */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Panel Petani
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5">
            Catat hasil panen baru dan kelola QR Code untuk kemasan produk Anda.
          </p>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Form Catat Hasil Panen Baru */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2.5 mb-6">
              <PenSquare className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Catat Hasil Panen Baru
              </h2>
            </div>

            <form onSubmit={handleRegisterHarvest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Kode Panen
                </label>
                <input
                  type="text"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="Contoh: PANEN-003"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nama Komoditas
                </label>
                <input
                  type="text"
                  value={commodityName}
                  onChange={(e) => setCommodityName(e.target.value)}
                  placeholder="Contoh: Beras Organik Cianjur"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Berat (kg)
                </label>
                <input
                  type="number"
                  min="1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Contoh: 500"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Lokasi Kebun
                </label>
                <input
                  type="text"
                  value={farmLocation}
                  onChange={(e) => setFarmLocation(e.target.value)}
                  placeholder="Contoh: Cianjur, Jawa Barat"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white py-3 rounded-full font-semibold text-sm transition shadow-sm cursor-pointer"
                >
                  Simpan Catatan Panen
                </button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Daftar Hasil Panen Saya */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2.5 mb-6">
              <ListFilter className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Daftar Hasil Panen Saya
              </h2>
            </div>

            {loadingBatches ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-7 h-7 animate-spin text-[#0e7039] mb-2" />
                <p className="text-xs">Memuat daftar panen...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Belum ada hasil panen terdaftar
                </p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Gunakan formulir di sebelah kiri untuk mulai mencatat hasil panen perdana Anda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {batches.map((item) => {
                  const badge = getStatusBadgeConfig(item.status);

                  return (
                    <div
                      key={item.batchId}
                      className="p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/50 transition flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-base">
                          {item.batchId}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.commodityName} • {item.weightKg.toString()} kg
                        </p>
                        <div className="mt-2 flex items-center gap-2">
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
                      </div>

                      <button
                        onClick={() =>
                          setSelectedBatchForQR({
                            batchId: item.batchId,
                            commodityName: item.commodityName,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-gray-700 text-xs font-semibold transition shadow-2xs cursor-pointer flex-shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5 text-gray-500" />
                        Unduh QR Code
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Unduh QR Code */}
        {selectedBatchForQR && (
          <QRCodeModal
            batchId={selectedBatchForQR.batchId}
            commodityName={selectedBatchForQR.commodityName}
            onClose={() => setSelectedBatchForQR(null)}
          />
        )}

        {/* Modal Status Transaksi dengan Penjelasan Humanis */}
        <TransactionModal
          status={txStatus}
          txHash={txHash}
          humanizedError={humanizedError}
          onClose={() => setTxStatus("idle")}
          title="Pencatatan Hasil Panen"
          successMessage="Hasil panen baru berhasil dicatat di blockchain Ethereum Sepolia!"
        />
      </div>
    </RoleGuard>
  );
}
