"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, HelpCircle, PackageX, QrCode } from "lucide-react";
import { getReadOnlyContract } from "@/lib/blockchain";
import { getBatchTimelineEvents } from "@/lib/eventLogs";
import { BatchData, BatchStatus, TrackingEventItem } from "@/constants/contract";
import { formatDateOnly, getStatusBadgeConfig } from "@/lib/utils";
import { parseHumanizedError, HumanizedError } from "@/lib/errorHandler";
import TrackingTimeline from "@/components/TrackingTimeline";
import QRCodeModal from "@/components/QRCodeModal";

function TrackingDetailInner({
  paramsPromise,
}: {
  paramsPromise: Promise<{ batchId: string }>;
}) {
  const resolvedParams = use(paramsPromise);
  const batchId = decodeURIComponent(resolvedParams.batchId);

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<BatchData | null>(null);
  const [events, setEvents] = useState<TrackingEventItem[]>([]);
  const [humanizedError, setHumanizedError] = useState<HumanizedError | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const fetchTrackingData = async () => {
    setLoading(true);
    setHumanizedError(null);

    try {
      const contract = getReadOnlyContract();
      const batchData = await contract.getBatch(batchId);

      // Cek apakah batch ditemukan di contract
      if (!batchData || !batchData.exists || !batchData.batchId) {
        setBatch(null);
        setHumanizedError({
          title: "Hasil Panen Tidak Ditemukan",
          description: `Kode Panen "${batchId}" belum pernah didaftarkan atau tidak terdaftar di sistem blockchain.`,
          actionHint:
            "Pastikan kembali kode panen yang Anda masukkan sesuai dengan yang tertera pada kemasan fisik produk.",
        });
        setLoading(false);
        return;
      }

      const formattedBatch: BatchData = {
        batchId: batchData.batchId,
        commodityName: batchData.commodityName,
        weightKg: batchData.weightKg,
        farmLocation: batchData.farmLocation,
        farmerAddress: batchData.farmerAddress,
        farmerName: batchData.farmerName,
        status: Number(batchData.status) as BatchStatus,
        createdAt: batchData.createdAt,
        updatedAt: batchData.updatedAt,
        exists: batchData.exists,
      };

      setBatch(formattedBatch);

      // Ambil event logs dari START_BLOCK
      const eventLogs = await getBatchTimelineEvents(batchId);
      setEvents(eventLogs);
    } catch (err: any) {
      console.error("Gagal membaca data pelacakan:", err);
      const humErr = parseHumanizedError(err, "tracking");
      setHumanizedError(humErr);
      setBatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      fetchTrackingData();
    }
  }, [batchId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-10 h-10 text-[#0e7039] animate-spin mb-4" />
        <p className="text-gray-800 font-bold text-base">Memverifikasi Data Rantai Pasok...</p>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Membaca catatan keaslian langsung dari buku besar blockchain Ethereum Sepolia.
        </p>
      </div>
    );
  }

  // Tampilan Humanis jika hasil panen tidak ditemukan atau terjadi gangguan
  if (humanizedError || !batch) {
    const errorInfo = humanizedError || {
      title: "Hasil Panen Tidak Ditemukan",
      description: `Kode panen "${batchId}" tidak terdaftar di sistem blockchain.`,
      actionHint: "Periksa kembali ejaan kode yang tertera pada kemasan produk.",
    };

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white p-7 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <PackageX className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            {errorInfo.title}
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 mb-5 leading-relaxed">
            {errorInfo.description}
          </p>

          {errorInfo.actionHint && (
            <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 mb-6 text-left flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-snug">
                <strong>Saran:</strong> {errorInfo.actionHint}
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              onClick={fetchTrackingData}
              className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white py-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer shadow-xs"
            >
              Coba Lacak Ulang
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              ← Kembali ke Pencarian
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badgeConfig = getStatusBadgeConfig(batch.status);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10">
      {/* Tombol Navigasi Kembali */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Pencarian
        </Link>
      </div>

      {/* Grid Dua Kartu: Informasi Hasil Panen & Perjalanan Produk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kartu Kiri: Informasi Hasil Panen */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">
            Informasi Hasil Panen
          </h2>

          {/* Baris Kode Panen, Status Badge, & Tombol Lihat QR Code */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <span className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {batch.batchId}
              </span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeConfig.badgeClass}`}
              >
                {badgeConfig.label}
              </span>
            </div>

            <button
              onClick={() => setShowQRModal(true)}
              className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition shadow-2xs cursor-pointer min-h-[42px] sm:min-h-0"
            >
              <QrCode className="w-3.5 h-3.5 text-[#0e7039]" />
              Lihat QR Code
            </button>
          </div>

          {/* Detail Metadata Rantai Pasok */}
          <div className="divide-y divide-gray-100 text-xs sm:text-sm">
            <div className="py-3 sm:py-3.5 flex justify-between items-start sm:items-center gap-3">
              <span className="text-gray-500 flex-shrink-0">Komoditas</span>
              <span className="font-semibold text-gray-800 text-right break-words max-w-[65%]">
                {batch.commodityName}
              </span>
            </div>

            <div className="py-3 sm:py-3.5 flex justify-between items-start sm:items-center gap-3">
              <span className="text-gray-500 flex-shrink-0">Berat</span>
              <span className="font-semibold text-gray-800 text-right break-words max-w-[65%]">
                {batch.weightKg.toString()} kg
              </span>
            </div>

            <div className="py-3 sm:py-3.5 flex justify-between items-start sm:items-center gap-3">
              <span className="text-gray-500 flex-shrink-0">Asal Kebun</span>
              <span className="font-semibold text-gray-800 text-right break-words max-w-[65%]">
                {batch.farmLocation}
              </span>
            </div>

            <div className="py-3 sm:py-3.5 flex justify-between items-start sm:items-center gap-3">
              <span className="text-gray-500 flex-shrink-0">Petani</span>
              <span className="font-semibold text-gray-800 text-right break-words max-w-[65%]">
                {batch.farmerName || "Petani Terdaftar"}
              </span>
            </div>

            <div className="py-3 sm:py-3.5 flex justify-between items-start sm:items-center gap-3">
              <span className="text-gray-500 flex-shrink-0">Tanggal Panen</span>
              <span className="font-semibold text-gray-800 text-right break-words max-w-[65%]">
                {formatDateOnly(batch.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Kartu Kanan: Perjalanan Produk (Timeline) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 lg:p-9 shadow-xs border border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">
            Perjalanan Produk
          </h2>

          <TrackingTimeline
            events={events}
            currentStatus={batch.status}
            fallbackFarmerName={batch.farmerName}
            fallbackCreatedAt={batch.createdAt}
            fallbackUpdatedAt={batch.updatedAt}
          />
        </div>
      </div>

      {/* Modal Lihat / Unduh QR Code */}
      {showQRModal && batch && (
        <QRCodeModal
          batchId={batch.batchId}
          commodityName={batch.commodityName}
          onClose={() => setShowQRModal(false)}
        />
      )}
    </div>
  );
}

export default function TrackingDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 text-[#0e7039] animate-spin mb-4" />
          <p className="text-gray-700 font-medium">Memuat data asal-usul panen...</p>
        </div>
      }
    >
      <TrackingDetailInner paramsPromise={params} />
    </Suspense>
  );
}
