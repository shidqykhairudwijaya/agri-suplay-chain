"use client";

import React from "react";
import { Check, Clock, Truck, Store, Sprout } from "lucide-react";
import { TrackingEventItem, BatchStatus } from "@/constants/contract";
import { formatTimestamp } from "@/lib/utils";
import { getEtherscanTxUrl } from "@/lib/blockchain";

interface TrackingTimelineProps {
  events: TrackingEventItem[];
  currentStatus: BatchStatus;
  fallbackFarmerName?: string;
  fallbackCreatedAt?: bigint;
  fallbackUpdatedAt?: bigint;
}

interface StageDefinition {
  status: BatchStatus;
  stageNumber: number;
  completedTitle: string;
  pendingTitle: string;
  roleLabel: string;
  pendingDescription: string;
  icon: React.ElementType;
}

const STAGES: StageDefinition[] = [
  {
    status: BatchStatus.Harvested,
    stageNumber: 1,
    completedTitle: "Dipanen & Dicatat Petani",
    pendingTitle: "Pencatatan Panen Petani",
    roleLabel: "Petani",
    pendingDescription: "Menunggu hasil panen dicatat oleh petani terdaftar.",
    icon: Sprout,
  },
  {
    status: BatchStatus.InTransit,
    stageNumber: 2,
    completedTitle: "Pengiriman oleh Logistik",
    pendingTitle: "Pengiriman oleh Logistik",
    roleLabel: "Kurir Logistik",
    pendingDescription: "Menunggu penjemputan dan pengiriman oleh kurir logistik.",
    icon: Truck,
  },
  {
    status: BatchStatus.Delivered,
    stageNumber: 3,
    completedTitle: "Diterima oleh Pembeli",
    pendingTitle: "Penerimaan oleh Pembeli",
    roleLabel: "Pembeli / Retailer",
    pendingDescription: "Menunggu produk tiba di lokasi dan dikonfirmasi oleh pembeli.",
    icon: Store,
  },
];

export default function TrackingTimeline({
  events,
  currentStatus,
  fallbackFarmerName,
  fallbackCreatedAt,
  fallbackUpdatedAt,
}: TrackingTimelineProps) {
  // Hitung berapa tahap yang sudah selesai (0 => 1 tahap, 1 => 2 tahap, 2 => 3 tahap)
  const completedCount = Math.min(Math.max(Number(currentStatus) + 1, 1), STAGES.length);

  return (
    <div>
      {/* Indikator Progres Rantai Pasok Keseluruhan */}
      <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-3 sm:p-3.5 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              completedCount === STAGES.length
                ? "bg-[#0e7039]"
                : "bg-amber-500 animate-pulse"
            }`}
          />
          <span className="text-xs font-semibold text-gray-700">
            Progres:{" "}
            <strong className="text-gray-900">
              Tahap {completedCount} dari {STAGES.length} {completedCount === STAGES.length ? "Lengkap" : "Selesai"}
            </strong>
          </span>
        </div>

        {/* Mini progress bar segments */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {STAGES.map((s) => (
            <div
              key={s.stageNumber}
              className={`w-5 sm:w-7 h-1.5 rounded-full transition-all ${
                currentStatus >= s.status ? "bg-[#0e7039]" : "bg-gray-200"
              }`}
              title={`${s.completedTitle} (${currentStatus >= s.status ? "Selesai" : "Belum"})`}
            />
          ))}
        </div>
      </div>

      {/* Rantai Alur Perjalanan Produk (Seluruh Tahap dari Awal sampai Akhir) */}
      <div className="relative pl-1">
        {STAGES.map((stage, index) => {
          const isReached = currentStatus >= stage.status;
          const isLast = index === STAGES.length - 1;
          const nextIsReached = !isLast && currentStatus >= STAGES[index + 1].status;
          const StageIcon = stage.icon;

          // Cari data event log pada blockchain jika ada
          const matchingEvent = events.find((e) => e.status === stage.status);

          // Tentukan detail informasi untuk tahap yang sudah tercapai
          let actorName = matchingEvent?.actorName;
          let timestamp = matchingEvent?.timestamp || 0;
          let txHash = matchingEvent?.txHash || "";
          let itemTitle = matchingEvent?.statusTitle || stage.completedTitle;

          if (isReached && !matchingEvent) {
            if (stage.status === BatchStatus.Harvested) {
              actorName = fallbackFarmerName || "Petani Terdaftar";
              timestamp = Number(fallbackCreatedAt || 0);
            } else if (stage.status === BatchStatus.InTransit) {
              actorName = "Kurir Logistik";
              timestamp = Number(fallbackUpdatedAt || fallbackCreatedAt || 0);
            } else if (stage.status === BatchStatus.Delivered) {
              actorName = "Pembeli / Retailer";
              timestamp = Number(fallbackUpdatedAt || fallbackCreatedAt || 0);
            }
          }

          return (
            <div
              key={stage.stageNumber}
              className="relative flex items-start gap-4 pb-8 group last:pb-2"
            >
              {/* Garis Vertikal Penghubung Antar Tahap */}
              {!isLast && (
                nextIsReached ? (
                  /* Garis Hijau Solid: Tahap berikutnya sudah tercapai */
                  <span
                    className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-[#0e7039]"
                    aria-hidden="true"
                  />
                ) : (
                  /* Garis Abu-abu Putus-Putus: Tahap berikutnya belum tercapai */
                  <span
                    className="absolute left-[13px] top-8 bottom-0 border-l-2 border-dashed border-gray-300"
                    aria-hidden="true"
                  />
                )
              )}

              {/* Node Icon Lingkaran */}
              {isReached ? (
                /* Lingkaran Hijau dengan Centang Putih (Tahap Sudah Selesai) */
                <div className="relative z-10 w-7 h-7 rounded-full bg-[#0e7039] text-white flex items-center justify-center flex-shrink-0 shadow-xs ring-4 ring-emerald-50 mt-0.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              ) : (
                /* Lingkaran Abu-Abu Muted (Tahap Belum Tercapai) */
                <div className="relative z-10 w-7 h-7 rounded-full bg-gray-100 border-2 border-gray-300 text-gray-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <StageIcon className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Konten Keterangan Tahap */}
              <div className="flex-1 min-w-0">
                {isReached ? (
                  /* Tampilan Tahap Selesai (Aktif & Berwarna Hijau/Hitam) */
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-gray-900 leading-tight">
                        {itemTitle}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0e7039] border border-emerald-200/60">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        Selesai
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Oleh <span className="font-semibold text-gray-800">{actorName}</span>
                      {timestamp > 0 && ` • ${formatTimestamp(timestamp)}`}
                    </p>

                    {txHash ? (
                      <a
                        href={getEtherscanTxUrl(txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0e7039] hover:underline font-semibold mt-1.5"
                      >
                        Lihat Bukti Keaslian Digital ↗
                      </a>
                    ) : (
                      <span className="inline-flex items-center text-[11px] text-gray-400 font-medium mt-1.5">
                        Terverifikasi di Smart Contract
                      </span>
                    )}
                  </div>
                ) : (
                  /* Tampilan Tahap Belum Sampai (Warna Abu-Abu Muted) */
                  <div className="opacity-75">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-base font-semibold text-gray-400 leading-tight">
                        {stage.pendingTitle}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                        Belum Sampai Tahap Ini
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      {stage.pendingDescription}
                    </p>

                    <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5 font-medium">
                      <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span>Menunggu pembaruan status oleh {stage.roleLabel}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
