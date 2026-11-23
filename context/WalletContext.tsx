"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import {
  SEPOLIA_CHAIN_ID,
  SEPOLIA_NETWORK_CONFIG,
  UserRoleInfo,
} from "@/constants/contract";
import { getReadOnlyContract } from "@/lib/blockchain";

const SESSION_STORAGE_KEY = "jejaktani_auth_session";

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  isLoggedIn: boolean;
  signer: ethers.Signer | null;
  userInfo: UserRoleInfo | null;
  activeRoleLabel: string;
  activeDashboardHref: string | null;
  connectWallet: () => Promise<UserRoleInfo | null>;
  requestAccountSwitch: () => Promise<UserRoleInfo | null>;
  logout: () => void;
  switchNetwork: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  chainId: null,
  isCorrectNetwork: false,
  isConnecting: false,
  isLoggedIn: false,
  signer: null,
  userInfo: null,
  activeRoleLabel: "",
  activeDashboardHref: null,
  connectWallet: async () => null,
  requestAccountSwitch: async () => null,
  logout: () => {},
  switchNetwork: async () => {},
  refreshUserInfo: async () => {},
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userInfo, setUserInfo] = useState<UserRoleInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  // Label peran aktif
  const activeRoleLabel = React.useMemo(() => {
    if (!userInfo) return "";
    if (userInfo.isAdmin) return "Admin";
    if (userInfo.isFarmer) return "Petani";
    if (userInfo.isLogistics) return "Logistik";
    if (userInfo.isRetailer) return "Pembeli";
    return "Tanpa Peran";
  }, [userInfo]);

  // Dashboard tujuan spesifik untuk peran tersebut (1 address = 1 dashboard)
  const activeDashboardHref = React.useMemo(() => {
    if (!userInfo) return null;
    if (userInfo.isAdmin) return "/dashboard/admin";
    if (userInfo.isFarmer) return "/dashboard/farmer";
    if (userInfo.isLogistics) return "/dashboard/logistics";
    if (userInfo.isRetailer) return "/dashboard/retailer";
    return null;
  }, [userInfo]);

  // Fungsi pengarah otomatis berdasarkan peran
  const redirectToDashboardByRole = useCallback(
    (info: UserRoleInfo) => {
      if (info.isAdmin) {
        router.push("/dashboard/admin");
      } else if (info.isFarmer) {
        router.push("/dashboard/farmer");
      } else if (info.isLogistics) {
        router.push("/dashboard/logistics");
      } else if (info.isRetailer) {
        router.push("/dashboard/retailer");
      } else {
        if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
          router.push("/");
        }
      }
    },
    [router]
  );

  const fetchUserInfo = useCallback(async (targetAccount: string): Promise<UserRoleInfo> => {
    try {
      const contract = getReadOnlyContract();
      const res = await contract.getUserInfo(targetAccount);
      const parsedInfo: UserRoleInfo = {
        isAdmin: res.isAdmin,
        isFarmer: res.isFarmer,
        isLogistics: res.isLogistics,
        isRetailer: res.isRetailer,
        actorName: res.actorName || "",
      };
      setUserInfo(parsedInfo);
      return parsedInfo;
    } catch (err) {
      console.warn("Gagal membaca getUserInfo:", err);
      const fallback: UserRoleInfo = {
        isAdmin: false,
        isFarmer: false,
        isLogistics: false,
        isRetailer: false,
        actorName: "",
      };
      setUserInfo(fallback);
      return fallback;
    }
  }, []);

  const refreshUserInfo = useCallback(async () => {
    if (account) {
      await fetchUserInfo(account);
    }
  }, [account, fetchUserInfo]);

  // Logout & Reset Sesi Ketat
  const logout = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {}

    setAccount(null);
    setSigner(null);
    setUserInfo(null);
    setIsLoggedIn(false);

    if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
      router.push("/");
    }
  }, [router]);

  // Connect via MetaMask (Akun aktif saat ini)
  const connectWallet = async (): Promise<UserRoleInfo | null> => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Ekstensi MetaMask tidak ditemukan! Silakan pasang MetaMask pada peramban Anda.");
      return null;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      const accounts = await provider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("Tidak ada akun yang dipilih.");
      }

      const activeAcc = ethers.getAddress(accounts[0]);
      const activeSigner = await provider.getSigner();

      setAccount(activeAcc);
      setSigner(activeSigner);
      setIsLoggedIn(true);

      const info = await fetchUserInfo(activeAcc);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ account: activeAcc })
      );

      // Otomatis arahkan ke dashboard peran
      redirectToDashboardByRole(info);

      return info;
    } catch (err: any) {
      console.error("Gagal menghubungkan MetaMask:", err);
      if (err.code !== 4001) {
        alert("Gagal masuk dengan MetaMask: " + (err.message || "Terjadi kesalahan"));
      }
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Meminta MetaMask memunculkan pop-up pemilihan / penggantian akun
  const requestAccountSwitch = async (): Promise<UserRoleInfo | null> => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Ekstensi MetaMask tidak ditemukan.");
      return null;
    }

    setIsConnecting(true);
    try {
      // Membuka jendela dialog pemilih akun di MetaMask
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      const accounts = await provider.send("eth_accounts", []);
      if (accounts && accounts.length > 0) {
        const newAcc = ethers.getAddress(accounts[0]);
        const newSigner = await provider.getSigner();

        setAccount(newAcc);
        setSigner(newSigner);
        setIsLoggedIn(true);

        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ account: newAcc })
        );

        const info = await fetchUserInfo(newAcc);

        // Otomatis langsung ubah dashboard sesuai peran akun yang baru dipilih
        redirectToDashboardByRole(info);

        return info;
      }
      return null;
    } catch (err: any) {
      console.warn("Pemilihan akun dibatalkan:", err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch Network to Sepolia
  const switchNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SEPOLIA_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Gagal menambahkan jaringan Sepolia:", addError);
        }
      } else {
        console.error("Gagal beralih jaringan:", switchError);
      }
    }
  };

  // Inisialisasi Sesi Saat Aplikasi Dimuat
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedSessionRaw) return;

    try {
      const sessionData = JSON.parse(savedSessionRaw);
      if (sessionData && sessionData.account && ethers.isAddress(sessionData.account)) {
        const savedAccount = ethers.getAddress(sessionData.account);
        setAccount(savedAccount);
        setIsLoggedIn(true);
        fetchUserInfo(savedAccount);

        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.getNetwork().then((net) => setChainId(Number(net.chainId))).catch(() => {});
          provider.send("eth_accounts", []).then(async (accounts) => {
            if (
              accounts &&
              accounts.length > 0 &&
              accounts[0].toLowerCase() === savedAccount.toLowerCase()
            ) {
              const activeSigner = await provider.getSigner();
              setSigner(activeSigner);
            }
          }).catch(() => {});
        }
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [fetchUserInfo]);

  // Listener Perpindahan Akun di MetaMask (accountsChanged & chainChanged)
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      // Jika pengguna memutuskan semua akun di MetaMask -> Logout
      if (!accounts || accounts.length === 0) {
        logout();
        return;
      }

      // Pengguna beralih akun di MetaMask -> Sinkronkan akun baru & ganti dashboard secara otomatis
      const newAcc = ethers.getAddress(accounts[0]);
      setAccount(newAcc);
      setIsLoggedIn(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await provider.getSigner().catch(() => null);
      setSigner(newSigner);

      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ account: newAcc })
      );

      const newInfo = await fetchUserInfo(newAcc);

      // LANGSUNG OTOMATIS BERALIH DASHBOARD SESUAI PERAN AKUN BARU
      redirectToDashboardByRole(newInfo);
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [fetchUserInfo, logout, redirectToDashboardByRole]);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isCorrectNetwork,
        isConnecting,
        isLoggedIn,
        signer,
        userInfo,
        activeRoleLabel,
        activeDashboardHref,
        connectWallet,
        requestAccountSwitch,
        logout,
        switchNetwork,
        refreshUserInfo,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
