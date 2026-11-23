"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { useWallet } from "@/context/WalletContext";
import { getReadOnlyContract, getSignerContract } from "@/lib/blockchain";
import {
  FARMER_ROLE,
  LOGISTICS_ROLE,
  RETAILER_ROLE,
  UserRoleInfo,
} from "@/constants/contract";
import { parseHumanizedError, HumanizedError } from "@/lib/errorHandler";
import RoleGuard from "@/components/RoleGuard";
import TransactionModal, { TransactionStatus } from "@/components/TransactionModal";
import { PenSquare, Search, CheckCircle2, XCircle, Loader2, HelpCircle } from "lucide-react";

export default function AdminDashboard() {
  const { account, signer, isCorrectNetwork, switchNetwork, refreshUserInfo } = useWallet();

  // Form Atur Akses Pengguna
  const [targetAccount, setTargetAccount] = useState("");
  const [actorName, setActorName] = useState("");
  const [selectedRoleKey, setSelectedRoleKey] = useState<"farmer" | "logistics" | "retailer">("farmer");

  // Form Cek Status Akun
  const [searchAccount, setSearchAccount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    account: string;
    info: UserRoleInfo;
  } | null>(null);
  const [searchHumanizedError, setSearchHumanizedError] = useState<HumanizedError | null>(null);

  // Transaction Modal State
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [humanizedError, setHumanizedError] = useState<HumanizedError | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const getRoleBytes = (key: "farmer" | "logistics" | "retailer") => {
    switch (key) {
      case "farmer":
        return FARMER_ROLE;
      case "logistics":
        return LOGISTICS_ROLE;
      case "retailer":
        return RETAILER_ROLE;
    }
  };

  const getRoleLabel = (key: "farmer" | "logistics" | "retailer") => {
    switch (key) {
      case "farmer":
        return "Petani";
      case "logistics":
        return "Logistik";
      case "retailer":
        return "Pembeli";
    }
  };

  // Handle assignRole
  const handleAssignRole = async (e: React.FormEvent) => {
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
        title: "Pilih Akun Admin di MetaMask",
        description: `Akun Admin Anda (${account}) belum aktif sebagai penandatangan di dompet MetaMask.`,
        actionHint: "Buka ekstensi MetaMask Anda, pilih akun yang memiliki alamat Admin ini, lalu coba kembali.",
      });
      setTxStatus("error");
      return;
    }

    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    if (!ethers.isAddress(targetAccount.trim())) {
      setHumanizedError({
        title: "Alamat Akun Tidak Tepat",
        description: "Kode Akun Digital yang dimasukkan tidak memenuhi standar alamat Ethereum yang valid.",
        actionHint: "Pastikan alamat diawali '0x' dan memiliki panjang 42 karakter.",
      });
      setTxStatus("error");
      return;
    }

    if (!actorName.trim()) {
      setHumanizedError({
        title: "Nama Pelaku Usaha Kosong",
        description: "Nama pelaku usaha wajib diisi agar kemitraan tercatat jelas.",
        actionHint: "Ketik nama kelompok tani, kurir, atau toko pada kolom nama.",
      });
      setTxStatus("error");
      return;
    }

    try {
      setTxStatus("submitting");
      setHumanizedError(null);
      const contract = getSignerContract(activeSigner);
      const roleBytes = getRoleBytes(selectedRoleKey);

      const tx = await contract.assignRole(
        ethers.getAddress(targetAccount.trim()),
        roleBytes,
        actorName.trim()
      );

      setTxHash(tx.hash);
      setTxStatus("mining");

      await tx.wait();
      setSuccessMsg(`Hak peran ${getRoleLabel(selectedRoleKey)} berhasil diberikan kepada ${actorName}!`);
      setTxStatus("success");

      // Auto update search jika sedang melihat akun yang sama
      if (searchResult && searchResult.account.toLowerCase() === targetAccount.trim().toLowerCase()) {
        handleCheckStatus(targetAccount.trim());
      }

      await refreshUserInfo();
    } catch (err: any) {
      console.error("Error assignRole:", err);
      const humErr = parseHumanizedError(err, "role");
      setHumanizedError(humErr);
      setTxStatus("error");
    }
  };

  // Handle removeRole
  const handleRemoveRole = async () => {
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
        title: "Pilih Akun Admin di MetaMask",
        description: `Akun Admin Anda (${account}) belum aktif sebagai penandatangan di dompet MetaMask.`,
        actionHint: "Buka ekstensi MetaMask Anda, pilih akun yang memiliki alamat Admin ini, lalu coba kembali.",
      });
      setTxStatus("error");
      return;
    }

    if (!isCorrectNetwork) {
      await switchNetwork();
      return;
    }

    if (!ethers.isAddress(targetAccount.trim())) {
      setHumanizedError({
        title: "Alamat Akun Tidak Tepat",
        description: "Kode Akun Digital yang dimasukkan tidak memenuhi standar alamat Ethereum yang valid.",
        actionHint: "Pastikan alamat diawali '0x' dan memiliki panjang 42 karakter.",
      });
      setTxStatus("error");
      return;
    }

    try {
      setTxStatus("submitting");
      setHumanizedError(null);
      const contract = getSignerContract(activeSigner);
      const roleBytes = getRoleBytes(selectedRoleKey);

      const tx = await contract.removeRole(
        ethers.getAddress(targetAccount.trim()),
        roleBytes
      );

      setTxHash(tx.hash);
      setTxStatus("mining");

      await tx.wait();
      setSuccessMsg(`Hak peran ${getRoleLabel(selectedRoleKey)} berhasil dicabut.`);
      setTxStatus("success");

      if (searchResult && searchResult.account.toLowerCase() === targetAccount.trim().toLowerCase()) {
        handleCheckStatus(targetAccount.trim());
      }

      await refreshUserInfo();
    } catch (err: any) {
      console.error("Error removeRole:", err);
      const humErr = parseHumanizedError(err, "role");
      setHumanizedError(humErr);
      setTxStatus("error");
    }
  };

  // Handle Cek Status Akun
  const handleCheckStatus = async (accountToCheck?: string) => {
    const addressToQuery = (accountToCheck || searchAccount).trim();
    if (!addressToQuery) return;

    if (!ethers.isAddress(addressToQuery)) {
      setSearchHumanizedError({
        title: "Format Alamat Belum Sesuai",
        description: "Alamat akun digital yang dimasukkan tidak memenuhi standar alamat Ethereum yang valid.",
        actionHint: "Pastikan alamat diawali dengan '0x' dan memiliki 42 karakter.",
      });
      setSearchResult(null);
      return;
    }

    setIsSearching(true);
    setSearchHumanizedError(null);

    try {
      const contract = getReadOnlyContract();
      const res = await contract.getUserInfo(ethers.getAddress(addressToQuery));

      setSearchResult({
        account: addressToQuery,
        info: {
          isAdmin: res.isAdmin,
          isFarmer: res.isFarmer,
          isLogistics: res.isLogistics,
          isRetailer: res.isRetailer,
          actorName: res.actorName || "",
        },
      });
    } catch (err: any) {
      console.error("Gagal memeriksa akun:", err);
      setSearchHumanizedError(parseHumanizedError(err, "role"));
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <RoleGuard requiredRole="isAdmin" roleName="Admin">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-10">
        {/* Header Title */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Panel Pengelola Sistem
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1.5">
            Atur hak akses dan nama pelaku usaha untuk setiap akun digital.
          </p>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Kolom Kiri: Atur Akses Pengguna */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <PenSquare className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">
                Atur Akses Pengguna
              </h2>
            </div>

            <form onSubmit={handleAssignRole} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Kode Akun Digital (Wallet)
                </label>
                <input
                  type="text"
                  value={targetAccount}
                  onChange={(e) => setTargetAccount(e.target.value)}
                  placeholder="Contoh: 0x71C...9A21"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono transition min-h-[46px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nama Pelaku / Usaha
                </label>
                <input
                  type="text"
                  value={actorName}
                  onChange={(e) => setActorName(e.target.value)}
                  placeholder="Contoh: Poktan Cianjur Makmur"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition min-h-[46px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Pilih Peran
                </label>
                <select
                  value={selectedRoleKey}
                  onChange={(e) =>
                    setSelectedRoleKey(e.target.value as "farmer" | "logistics" | "retailer")
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white transition cursor-pointer min-h-[46px]"
                >
                  <option value="farmer">Petani (FARMER_ROLE)</option>
                  <option value="logistics">Logistik (LOGISTICS_ROLE)</option>
                  <option value="retailer">Pembeli (RETAILER_ROLE)</option>
                </select>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 w-full sm:w-auto bg-[#0e7039] hover:bg-[#0b5c2e] text-white py-3 rounded-full font-semibold text-sm transition shadow-xs cursor-pointer min-h-[46px] flex items-center justify-center"
                >
                  Berikan Akses
                </button>
                <button
                  type="button"
                  onClick={handleRemoveRole}
                  className="flex-1 w-full sm:w-auto bg-white hover:bg-red-50 text-red-600 border border-red-300 py-3 rounded-full font-semibold text-sm transition cursor-pointer min-h-[46px] flex items-center justify-center"
                >
                  Cabut Akses
                </button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Cek Status Akun */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">
                Cek Status Akun
              </h2>
            </div>

            {/* Input & Search Button - Stacked gracefully on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-5">
              <input
                type="text"
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
                placeholder="Masukkan Kode Akun Digital"
                className="flex-1 px-4 py-3 rounded-full border border-gray-200 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[46px]"
              />
              <button
                type="button"
                onClick={() => handleCheckStatus()}
                disabled={isSearching}
                className="w-full sm:w-auto bg-[#0e7039] hover:bg-[#0b5c2e] text-white px-6 py-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer flex-shrink-0 flex items-center justify-center gap-2 min-h-[46px]"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cek Peran"}
              </button>
            </div>

            {searchHumanizedError && (
              <div className="bg-amber-50/80 border border-amber-200/70 p-4 rounded-2xl mb-4 text-left">
                <p className="text-xs font-bold text-amber-900 mb-0.5">
                  {searchHumanizedError.title}
                </p>
                <p className="text-xs text-amber-800 mb-1.5">
                  {searchHumanizedError.description}
                </p>
                {searchHumanizedError.actionHint && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    💡 {searchHumanizedError.actionHint}
                  </p>
                )}
              </div>
            )}

            {/* Result Box */}
            {searchResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {searchResult.info.actorName || "Tanpa Nama Pelaku"}
                  </h3>

                  <div className="flex items-center gap-1.5">
                    {searchResult.info.isFarmer && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0e7039] border border-emerald-200">
                        Petani
                      </span>
                    )}
                    {searchResult.info.isLogistics && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Logistik
                      </span>
                    )}
                    {searchResult.info.isRetailer && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                        Pembeli
                      </span>
                    )}
                    {searchResult.info.isAdmin && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                        Admin
                      </span>
                    )}
                    {!searchResult.info.isFarmer &&
                      !searchResult.info.isLogistics &&
                      !searchResult.info.isRetailer &&
                      !searchResult.info.isAdmin && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          Belum Memiliki Peran
                        </span>
                      )}
                  </div>
                </div>

                <p className="text-xs font-mono text-gray-500 break-all">
                  {searchResult.account}
                </p>

                <div className="pt-2 border-t border-gray-200/60 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  {searchResult.info.isFarmer ||
                  searchResult.info.isLogistics ||
                  searchResult.info.isRetailer ||
                  searchResult.info.isAdmin ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Status: Akses Aktif</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Status: Tidak Memiliki Hak Akses</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Status Transaksi dengan Penjelasan Humanis */}
        <TransactionModal
          status={txStatus}
          txHash={txHash}
          humanizedError={humanizedError}
          onClose={() => setTxStatus("idle")}
          title="Manajemen Hak Akses"
          successMessage={successMsg}
        />
      </div>
    </RoleGuard>
  );
}
