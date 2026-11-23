import React from "react";
import Link from "next/link";
import { Sprout } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200/60 bg-white/60 py-8 text-center text-xs text-gray-500">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[#0e7039]">
            <Sprout className="w-3.5 h-3.5 fill-[#0e7039]" />
          </div>
          <span className="font-semibold text-gray-800">JejakTani</span>
          <span>• Rantai Pasok Terbuka & Terverifikasi Blockchain</span>
        </div>
        <p>
          Ethereum Sepolia Smart Contract:{" "}
          <span className="font-mono text-gray-700 font-medium">0x90CA...0fa9</span>
        </p>
      </div>
    </footer>
  );
}

