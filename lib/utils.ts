import { BatchStatus } from "@/constants/contract";

/**
 * Memotong alamat Ethereum untuk tampilan ramah pengguna (contoh: 0x1234...abcd).
 */
export function formatAddress(address: string, leadingChars = 6, trailingChars = 4): string {
  if (!address) return "-";
  if (address.length <= leadingChars + trailingChars) return address;
  return `${address.slice(0, leadingChars)}...${address.slice(-trailingChars)}`;
}

/**
 * Format tanggal dan waktu dalam standar bahasa Indonesia (contoh: "20 Nov 2026, 08:30").
 */
export function formatTimestamp(timestamp: number | bigint): string {
  if (!timestamp) return "-";
  const num = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  // Jika timestamp dalam detik (blockchain), ubah ke milidetik
  const ms = num < 1e12 ? num * 1000 : num;
  const date = new Date(ms);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

/**
 * Format tanggal saja (contoh: "20 Nov 2026").
 */
export function formatDateOnly(timestamp: number | bigint): string {
  if (!timestamp) return "-";
  const num = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const ms = num < 1e12 ? num * 1000 : num;
  const date = new Date(ms);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Mengembalikan konfigurasi label dan warna badge untuk status panen.
 */
export function getStatusBadgeConfig(status: BatchStatus) {
  switch (Number(status)) {
    case BatchStatus.Harvested:
      return {
        label: "Baru Dipanen",
        badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
        dotColor: "bg-amber-500",
        iconType: "clock" as const,
      };
    case BatchStatus.InTransit:
      return {
        label: "Sedang Dikirim",
        badgeClass: "bg-blue-100 text-blue-800 border border-blue-200",
        dotColor: "bg-blue-500",
        iconType: "truck" as const,
      };
    case BatchStatus.Delivered:
      return {
        label: "Sudah Diterima",
        badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        dotColor: "bg-emerald-600",
        iconType: "check" as const,
      };
    default:
      return {
        label: "Tidak Diketahui",
        badgeClass: "bg-gray-100 text-gray-700 border border-gray-200",
        dotColor: "bg-gray-400",
        iconType: "clock" as const,
      };
  }
}

