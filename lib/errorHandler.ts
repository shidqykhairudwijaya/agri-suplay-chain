export interface HumanizedError {
  title: string;
  description: string;
  actionHint?: string;
}

export type ErrorContext =
  | "harvest"
  | "shipping"
  | "delivery"
  | "role"
  | "tracking"
  | "general";

/**
 * Mengubah pesan error teknis dari Web3, MetaMask, RPC, dan Smart Contract
 * menjadi pesan bahasa Indonesia yang ramah, santun, dan solutif bagi pengguna umum.
 */
export function parseHumanizedError(
  error: any,
  context: ErrorContext = "general"
): HumanizedError {
  if (!error) {
    return {
      title: "Terjadi Kendala",
      description: "Operasi tidak dapat diselesaikan.",
      actionHint: "Silakan muat ulang halaman atau coba beberapa saat lagi.",
    };
  }

  // Kumpulkan semua representasi teks error dari berbagai format ethers/metamask
  const rawMsg = (
    (error?.reason || "") +
    " " +
    (error?.message || "") +
    " " +
    (error?.data?.message || "") +
    " " +
    (error?.shortMessage || "") +
    " " +
    (typeof error === "string" ? error : "")
  ).toLowerCase();

  const errCode = error?.code;

  // 1. Dibatalkan oleh Pengguna di MetaMask
  if (
    errCode === 4001 ||
    errCode === "ACTION_REJECTED" ||
    rawMsg.includes("user rejected") ||
    rawMsg.includes("user denied") ||
    rawMsg.includes("rejected the request")
  ) {
    return {
      title: "Permintaan Dibatalkan",
      description: "Anda membatalkan permintaan tanda tangan transaksi pada dompet MetaMask.",
      actionHint:
        "Tidak ada data yang diubah atau saldo yang terpotong. Anda dapat mencobanya kembali kapan saja.",
    };
  }

  // 2. Saldo Biaya Gas Sepolia ETH Tidak Cukup
  if (
    errCode === "INSUFFICIENT_FUNDS" ||
    rawMsg.includes("insufficient funds") ||
    rawMsg.includes("gas required exceeds allowance")
  ) {
    return {
      title: "Saldo Biaya Gas Tidak Cukup",
      description:
        "Dompet digital Anda tidak memiliki saldo Sepolia ETH yang cukup untuk membayar biaya gas transaksi di jaringan blockchain.",
      actionHint:
        "Silakan isi ulang saldo Sepolia ETH gratis Anda melalui layanan Faucet Sepolia sebelum melanjutkan.",
    };
  }

  // 3. Hak Akses Ditolak Smart Contract (AccessControlUnauthorizedAccount)
  if (
    rawMsg.includes("accesscontrolunauthorizedaccount") ||
    rawMsg.includes("accesscontrolbadconfirmation") ||
    rawMsg.includes("missing role") ||
    rawMsg.includes("unauthorized")
  ) {
    return {
      title: "Hak Akses Belum Terdaftar",
      description:
        "Alamat dompet digital Anda saat ini belum memiliki izin peran resmi untuk melakukan tindakan ini.",
      actionHint:
        "Silakan hubungi Pengelola Sistem (Admin) untuk mendaftarkan akun dompet Anda ke dalam sistem.",
    };
  }

  // 4. Kasus Berdasarkan Konteks Tindakan
  if (context === "harvest") {
    if (
      rawMsg.includes("already exists") ||
      rawMsg.includes("exists") ||
      rawMsg.includes("reverted") ||
      rawMsg.includes("call_exception")
    ) {
      return {
        title: "Kode Panen Sudah Digunakan",
        description:
          "Kode panen yang Anda masukkan kemungkinan sudah pernah didaftarkan sebelumnya di blockchain.",
        actionHint:
          "Gunakan kode panen baru yang unik (misalnya: PANEN-004 atau tambahkan penomoran khusus).",
      };
    }
  }

  if (context === "shipping") {
    if (rawMsg.includes("reverted") || rawMsg.includes("call_exception")) {
      return {
        title: "Status Pengiriman Belum Sesuai",
        description:
          "Hasil panen ini tidak dapat diproses kirim karena statusnya belum siap dikirim atau sudah berada dalam perjalanan.",
        actionHint:
          "Pastikan hasil panen masih berada di tab 'Siap Dikirim' sebelum menekan Mulai Pengiriman.",
      };
    }
  }

  if (context === "delivery") {
    if (rawMsg.includes("reverted") || rawMsg.includes("call_exception")) {
      return {
        title: "Barang Belum Dalam Pengiriman",
        description:
          "Penerimaan produk belum dapat dikonfirmasi karena status komoditas belum dimulai pengirimannya oleh kurir logistik.",
        actionHint:
          "Tunggu konfirmasi kurir memulai perjalanan terlebih dahulu sebelum menerima barang.",
      };
    }
  }

  if (context === "role") {
    if (rawMsg.includes("invalid address") || rawMsg.includes("address")) {
      return {
        title: "Format Alamat Akun Tidak Tepat",
        description:
          "Alamat dompet digital yang Anda masukkan tidak sesuai dengan format akun Ethereum yang valid.",
        actionHint:
          "Pastikan alamat diawali dengan '0x' dan memiliki panjang tepat 42 karakter heksadesimal.",
      };
    }
  }

  // 5. Gangguan Jaringan / Node RPC
  if (
    errCode === "NETWORK_ERROR" ||
    rawMsg.includes("failed to fetch") ||
    rawMsg.includes("network error") ||
    rawMsg.includes("timeout") ||
    rawMsg.includes("connection refused")
  ) {
    return {
      title: "Koneksi Jaringan Terkendala",
      description:
        "Terjadi sedikit keterlambatan komunikasi dengan node jaringan Ethereum Sepolia.",
      actionHint:
        "Periksa sambungan internet Anda lalu coba kembali dalam beberapa saat.",
    };
  }

  if (rawMsg.includes("429") || rawMsg.includes("too many requests") || rawMsg.includes("rate limit")) {
    return {
      title: "Lalu Lintas Jaringan Sedang Padat",
      description:
        "Server blockchain sedang menerima banyak permintaan pelacakan secara bersamaan.",
      actionHint:
        "Tunggu sekitar 5-10 detik sebelum mengulang kembali tindakan Anda.",
    };
  }

  // 6. Transaksi Antrean / Nonce Tertunda
  if (
    errCode === "NONCE_EXPIRED" ||
    errCode === "REPLACEMENT_UNDERPRICED" ||
    rawMsg.includes("nonce")
  ) {
    return {
      title: "Ada Transaksi yang Sedang Berjalan",
      description:
        "Dompet Anda masih memproses transaksi sebelumnya di jaringan Sepolia.",
      actionHint:
        "Tunggu hingga transaksi sebelumnya selesai atau percepat transaksi tersebut di MetaMask.",
    };
  }

  // 7. Pesan Default Ramah Pengguna
  return {
    title: "Pencatatan Belum Berhasil",
    description:
      "Transaksi belum dapat diproses secara sempurna oleh jaringan saat ini.",
    actionHint:
      "Silakan periksa koneksi dompet Anda, pastikan saldo gas mencukupi, lalu coba kembali.",
  };
}

