"use client";

import React, { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, X, QrCode } from "lucide-react";

interface QRCodeModalProps {
  batchId: string;
  commodityName?: string;
  onClose: () => void;
}

export default function QRCodeModal({ batchId, commodityName, onClose }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // URL pelacakan publik yang ditanam pada QR Code
  const trackingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tracking/${encodeURIComponent(batchId)}`
    : `https://jejaktani.id/tracking/${encodeURIComponent(batchId)}`;

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `JejakTani-QR-${batchId}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0e7039] flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Unduh QR Code Produk
        </h3>
        <p className="text-xs text-gray-500 mb-5">
          Tempelkan kode ini pada kemasan fisik agar konsumen dapat memindai riwayat produk secara instan.
        </p>

        {/* QR Code Container */}
        <div
          ref={qrRef}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm inline-block mb-4"
        >
          <QRCodeCanvas
            value={trackingUrl}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="bg-gray-50 rounded-xl p-2.5 mb-5 text-left">
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
            Kode Panen
          </p>
          <p className="text-sm font-bold text-gray-800">{batchId}</p>
          {commodityName && (
            <p className="text-xs text-gray-600 mt-0.5">{commodityName}</p>
          )}
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-[#0e7039] hover:bg-[#0b5c2e] text-white py-3 rounded-full font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Unduh Gambar (PNG)
        </button>
      </div>
    </div>
  );
}

