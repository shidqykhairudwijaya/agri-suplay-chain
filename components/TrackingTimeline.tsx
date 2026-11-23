import React from "react";
import { Check, ExternalLink } from "lucide-react";
import { TrackingEventItem, BatchStatus } from "@/constants/contract";
import { formatTimestamp } from "@/lib/utils";
import { getEtherscanTxUrl } from "@/lib/blockchain";

interface TrackingTimelineProps {
  events: TrackingEventItem[];
  currentStatus: BatchStatus;
  fallbackFarmerName?: string;
  fallbackCreatedAt?: bigint;
}

export default function TrackingTimeline({
  events,
  currentStatus,
  fallbackFarmerName,
  fallbackCreatedAt,
}: TrackingTimelineProps) {
  // Jika belum ada event log yang berhasil diambil dari block filter (misal RPC rate limit),
  // susun fallback timeline minimal dari data Batch
  const displayEvents = React.useMemo(() => {
    if (events && events.length > 0) return events;

    const fallbackList: TrackingEventItem[] = [];
    if (fallbackCreatedAt) {
      fallbackList.push({
        id: "fallback-harvest",
        statusTitle: "Dipanen Petani",
        status: BatchStatus.Harvested,
        actorTitle: "Petani",
        actorName: fallbackFarmerName || "Petani Terdaftar",
        actorAddress: "",
        timestamp: Number(fallbackCreatedAt),
        txHash: "",
        blockNumber: 0,
      });
    }
    return fallbackList;
  }, [events, fallbackFarmerName, fallbackCreatedAt]);

  if (displayEvents.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        Belum ada catatan aktivitas untuk kode panen ini.
      </div>
    );
  }

  return (
    <div className="relative pl-2">
      {displayEvents.map((item, index) => {
        const isLast = index === displayEvents.length - 1;

        return (
          <div key={item.id || index} className="relative flex items-start gap-4 pb-8 group">
            {/* Garis vertikal hijau penghubung */}
            {!isLast && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-[#0e7039]"
                aria-hidden="true"
              />
            )}

            {/* Lingkaran hijau dengan centang putih */}
            <div className="relative z-10 w-6 h-6 rounded-full bg-[#0e7039] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>

            {/* Konten Timeline */}
            <div className="flex-1">
              <h4 className="text-base font-bold text-gray-900 leading-tight">
                {item.statusTitle}
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Oleh <span className="font-semibold text-gray-800">{item.actorName}</span> •{" "}
                {formatTimestamp(item.timestamp)}
              </p>

              {item.txHash ? (
                <a
                  href={getEtherscanTxUrl(item.txHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#0e7039] hover:underline font-semibold mt-1.5"
                >
                  Lihat Bukti Keaslian Digital ↗
                </a>
              ) : (
                <span className="inline-flex items-center text-[11px] text-gray-400 font-medium mt-1">
                  Terverifikasi di Smart Contract
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

