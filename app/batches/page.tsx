"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  PackageCheck,
  Truck,
  Clock,
  CheckCircle2,
  QrCode,
  ArrowRight,
  MapPin,
  User,
  Scale,
} from "lucide-react";
import { getReadOnlyContract } from "@/lib/blockchain";
import { BatchData, BatchStatus } from "@/constants/contract";
import { formatDateOnly, getStatusBadgeConfig } from "@/lib/utils";
import QRCodeModal from "@/components/QRCodeModal";

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BatchStatus>("all");

  const [selectedBatchForQR, setSelectedBatchForQR] = useState<{
    batchId: string;
    commodityName: string;
  } | null>(null);

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

      // Urutkan dari batch terbaru
      list.sort((a, b) => Number(b.createdAt - a.createdAt));
      setBatches(list);
    } catch (err) {
      console.error("Gagal mengambil data seluruh batch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    const total = batches.length;
    const harvested = batches.filter((b) => b.status === BatchStatus.Harvested).length;
    const inTransit = batches.filter((b) => b.status === BatchStatus.InTransit).length;
    const delivered = batches.filter((b) => b.status === BatchStatus.Delivered).length;
    return { total, harvested, inTransit, delivered };
  }, [batches]);

  // Filter & Search
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Filter status
      if (statusFilter !== "all" && b.status !== statusFilter) {
        return false;
      }
      // Filter pencarian
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.batchId.toLowerCase().includes(q) ||
        b.commodityName.toLowerCase().includes(q) ||
        b.farmLocation.toLowerCase().includes(q) ||
        b.farmerName.toLowerCase().includes(q)
      );
    });
  }, [batches, statusFilter, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-12">
      {/* Page Header */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
          Daftar Hasil Panen Terdaftar
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-2 max-w-3xl leading-relaxed">
          Jelajahi seluruh komoditas pertanian yang tercatat dan terverifikasi secara transparan pada smart contract Ethereum Sepolia.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 lg:mb-10">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs">
          <p className="text-xs sm:text-sm font-semibold text-gray-500">Total Panen</p>
          <p className="text-2xl sm:text-4xl font-extrabold text-gray-900 mt-1">
            {stats.total}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs sm:text-sm font-semibold">
            <Clock className="w-4 h-4" />
            <span>Baru Dipanen</span>
          </div>
          <p className="text-2xl sm:text-4xl font-extrabold text-amber-800 mt-1">
            {stats.harvested}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-blue-700 text-xs sm:text-sm font-semibold">
            <Truck className="w-4 h-4" />
            <span>Sedang Dikirim</span>
          </div>
          <p className="text-2xl sm:text-4xl font-extrabold text-blue-800 mt-1">
            {stats.inTransit}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#0e7039] text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sudah Diterima</span>
          </div>
          <p className="text-2xl sm:text-4xl font-extrabold text-[#0e7039] mt-1">
            {stats.delivered}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Input Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari komoditas, lokasi kebun, nama petani, atau kode panen..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200/80 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === "all"
                ? "bg-[#0e7039] text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Semua ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter(BatchStatus.Harvested)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === BatchStatus.Harvested
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Baru Dipanen ({stats.harvested})
          </button>
          <button
            onClick={() => setStatusFilter(BatchStatus.InTransit)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === BatchStatus.InTransit
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Sedang Dikirim ({stats.inTransit})
          </button>
          <button
            onClick={() => setStatusFilter(BatchStatus.Delivered)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              statusFilter === BatchStatus.Delivered
                ? "bg-[#0e7039] text-white shadow-xs"
                : "bg-emerald-50 text-[#0e7039] hover:bg-emerald-100"
            }`}
          >
            Sudah Diterima ({stats.delivered})
          </button>
        </div>
      </div>

      {/* Grid Cards Hasil Panen */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-[#0e7039] animate-spin mx-auto mb-3" />
          <p className="font-bold text-gray-800 text-base">Memuat seluruh data hasil panen...</p>
          <p className="text-xs text-gray-400 mt-1">Membaca langsung dari smart contract Ethereum Sepolia</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="py-20 bg-white rounded-3xl border border-gray-100 shadow-xs text-center p-8 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center mx-auto mb-3">
            <PackageCheck className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">Tidak Ada Panen Ditemukan</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            {searchQuery
              ? `Tidak ditemukan hasil panen yang cocok dengan kata kunci "${searchQuery}".`
              : "Belum ada komoditas hasil panen yang terdaftar di kategori ini."}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold px-4 py-2 rounded-full transition cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filteredBatches.map((item) => {
            const badge = getStatusBadgeConfig(item.status);

            return (
              <div
                key={item.batchId}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header Card: Batch ID & Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-4 border-b border-gray-100 mb-4">
                    <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                      {item.batchId}
                    </span>
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

                  {/* Main Commodity Info */}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">
                      {item.commodityName}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Dicatat: {formatDateOnly(item.createdAt)}
                    </p>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2.5 text-xs text-gray-600 mb-6 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Berat: <strong className="text-gray-800">{item.weightKg.toString()} kg</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        Asal: <strong className="text-gray-800">{item.farmLocation}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        Petani: <strong className="text-gray-800">{item.farmerName || "Petani Terdaftar"}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/tracking/${encodeURIComponent(item.batchId)}`}
                    className="flex-1 bg-[#0e7039] hover:bg-[#0b5c2e] text-white py-2.5 rounded-xl font-semibold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Lacak Perjalanan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() =>
                      setSelectedBatchForQR({
                        batchId: item.batchId,
                        commodityName: item.commodityName,
                      })
                    }
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 transition cursor-pointer"
                    title="Lihat / Unduh QR Code"
                  >
                    <QrCode className="w-4 h-4 text-[#0e7039]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal QR Code */}
      {selectedBatchForQR && (
        <QRCodeModal
          batchId={selectedBatchForQR.batchId}
          commodityName={selectedBatchForQR.commodityName}
          onClose={() => setSelectedBatchForQR(null)}
        />
      )}
    </div>
  );
}

