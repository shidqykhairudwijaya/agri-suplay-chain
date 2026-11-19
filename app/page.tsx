'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CONTRACT_ADDRESS, 
  CONTRACT_ABI, 
  SEPOLIA_RPC_URL, 
  SEPOLIA_CHAIN_ID, 
  ROLES 
} from '@/constants/contract';
import { 
  Sprout, 
  Truck, 
  Store, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  QrCode, 
  UserCheck, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  LogOut,
  ChevronDown,
  Copy,
  Check,
  Info,
  Clock,
  MapPin,
  Scale,
  Package
} from 'lucide-react';

interface BatchData {
  batchId: string;
  commodityName: string;
  weight: number;
  farmLocation: string;
  status: number; // 0: Harvested, 1: InTransit, 2: Delivered
  farmer: string;
  logistics: string;
  retailer: string;
  createdAt: number;
  updatedAt: number;
}

interface RoleStatus {
  isAdmin: boolean;
  isFarmer: boolean;
  isLogistics: boolean;
  isRetailer: boolean;
}

interface CustomError {
  reason?: string;
  message?: string;
}

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [userRoles, setUserRoles] = useState<RoleStatus>({
    isAdmin: false,
    isFarmer: false,
    isLogistics: false,
    isRetailer: false,
  });
  const [activeTab, setActiveTab] = useState<'track' | 'farmer' | 'logistics' | 'retailer' | 'admin'>('track');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // User Dropdown State
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // State Tracking
  const [searchId, setSearchId] = useState<string>('');
  const [batchDetail, setBatchDetail] = useState<BatchData | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Form Petani
  const [farmerForm, setFarmerForm] = useState({
    batchId: '',
    commodityName: '',
    weight: '',
    farmLocation: '',
  });

  // Form Logistik & Retailer
  const [targetBatchId, setTargetBatchId] = useState<string>('');

  // Form Admin Manual
  const [adminRoleTarget, setAdminRoleTarget] = useState<string>('');
  const [selectedRoleToGrant, setSelectedRoleToGrant] = useState<string>(ROLES.FARMER);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper untuk refresh role pengguna
  const refreshUserRole = useCallback(async (userAddr: string, providerOrSigner?: ethers.BrowserProvider | ethers.JsonRpcProvider) => {
    try {
      const p = providerOrSigner || new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, p);
      const [isAdmin, isFarmer, isLogistics, isRetailer] = await Promise.all([
        contract.hasRole(ROLES.ADMIN, userAddr),
        contract.hasRole(ROLES.FARMER, userAddr),
        contract.hasRole(ROLES.LOGISTICS, userAddr),
        contract.hasRole(ROLES.RETAILER, userAddr),
      ]);

      setUserRoles({ isAdmin, isFarmer, isLogistics, isRetailer });
    } catch (err) {
      console.error('Error checking roles:', err);
    }
  }, []);

  // 1. Fungsi Publik: Lacak Batch
  const trackBatch = useCallback(async (idToSearch?: string) => {
    const id = idToSearch || searchId;
    if (!id.trim()) return;

    try {
      setLoading(true);
      setMessage(null);
      const publicProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, publicProvider);

      const data = await contract.getBatch(id.trim());
      setBatchDetail({
        batchId: data.batchId,
        commodityName: data.commodityName,
        weight: Number(data.weight),
        farmLocation: data.farmLocation,
        status: Number(data.status),
        farmer: data.farmer,
        logistics: data.logistics,
        retailer: data.retailer,
        createdAt: Number(data.createdAt),
        updatedAt: Number(data.updatedAt),
      });
    } catch (err: unknown) {
      console.error(err);
      setBatchDetail(null);
      setMessage({ text: `Batch ID "${id}" tidak ditemukan di smart contract Sepolia. Pastikan ID sudah benar.`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  // Auto-search dari URL (?id=...) saat scan QR
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    if (urlId) {
      const timer = setTimeout(() => {
        setSearchId(urlId);
        trackBatch(urlId);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [trackBatch]);

  // Connect Wallet
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !('ethereum' in window)) {
      alert('Ekstensi MetaMask tidak ditemukan! Silakan pasang ekstensi MetaMask di browser.');
      return;
    }

    const eth = (window as unknown as { ethereum: Eip1193Provider }).ethereum;

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(eth);
      
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        try {
          await eth.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch {
          alert('Harap beralih ke jaringan Ethereum Sepolia di MetaMask!');
          setLoading(false);
          return;
        }
      }

      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();
      setAccount(userAddr);
      setAdminRoleTarget(userAddr);

      await refreshUserRole(userAddr, provider);
      setMessage({ text: `Berhasil terhubung ke akun: ${userAddr.slice(0, 6)}...${userAddr.slice(-4)}`, type: 'success' });
    } catch (err: unknown) {
      console.error(err);
      const error = err as CustomError;
      setMessage({ text: error.message || 'Gagal menghubungkan dompet.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [refreshUserRole]);

  // Ganti Akun MetaMask (Switch Account Dialog)
  const switchAccount = async () => {
    if (typeof window === 'undefined' || !('ethereum' in window)) return;
    const eth = (window as unknown as { ethereum: Eip1193Provider }).ethereum;
    try {
      await eth.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      setShowUserMenu(false);
    } catch (err) {
      console.error('User cancelled account switch', err);
    }
  };

  // Logout / Putuskan Koneksi
  const handleLogout = () => {
    setAccount('');
    setUserRoles({ isAdmin: false, isFarmer: false, isLogistics: false, isRetailer: false });
    setShowUserMenu(false);
    setMessage({ text: 'Koneksi dompet telah diputuskan. Anda sekarang berada dalam mode publik/tamu.', type: 'info' });
  };

  // Salin Alamat Wallet
  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Listener event MetaMask (Otomatis ganti akun jika diubah di ekstensi)
  useEffect(() => {
    if (typeof window === 'undefined' || !('ethereum' in window)) return;
    const eth = (window as unknown as { ethereum: Eip1193Provider }).ethereum;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length > 0) {
        setAccount(accs[0]);
        setAdminRoleTarget(accs[0]);
        refreshUserRole(accs[0]);
        setMessage({ text: `Beralih ke akun: ${accs[0].slice(0, 6)}...${accs[0].slice(-4)}`, type: 'info' });
      } else {
        setAccount('');
        setUserRoles({ isAdmin: false, isFarmer: false, isLogistics: false, isRetailer: false });
      }
    };

    eth.on('accountsChanged', handleAccountsChanged);
    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [refreshUserRole]);

  // Helper untuk mendapatkan Contract Signer
  const getSignerContract = async () => {
    if (typeof window === 'undefined' || !('ethereum' in window)) {
      throw new Error('MetaMask tidak ditemukan');
    }
    const eth = (window as unknown as { ethereum: Eip1193Provider }).ethereum;
    const provider = new ethers.BrowserProvider(eth);
    const signer = await provider.getSigner();
    return { contract: new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer), signer, provider };
  };

  // 2. Fungsi Petani: Registrasi Panen
  const handleRegisterHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      const { contract, signer } = await getSignerContract();
      const userAddr = await signer.getAddress();

      const hasFarmer = await contract.hasRole(ROLES.FARMER, userAddr);
      if (!hasFarmer) {
        setMessage({ 
          text: `Akun Anda belum memiliki hak FARMER_ROLE. Buka tab "Panel Admin" untuk mengaktifkan peran Petani terlebih dahulu.`, 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      const tx = await contract.registerHarvest(
        farmerForm.batchId.trim(),
        farmerForm.commodityName.trim(),
        BigInt(farmerForm.weight),
        farmerForm.farmLocation.trim()
      );
      setMessage({ text: 'Mengirim transaksi panen ke Sepolia... Menunggu konfirmasi penambang.', type: 'info' });
      await tx.wait();

      setMessage({ text: `Alhamdulillah! Batch "${farmerForm.batchId}" berhasil terdaftar di blockchain Sepolia!`, type: 'success' });
      const createdId = farmerForm.batchId.trim();
      setFarmerForm({ batchId: '', commodityName: '', weight: '', farmLocation: '' });
      setSearchId(createdId);
      trackBatch(createdId);
      setActiveTab('track');
    } catch (err: unknown) {
      console.error(err);
      const error = err as CustomError;
      setMessage({ text: error.reason || error.message || 'Gagal mendaftarkan panen.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Fungsi Logistik: Kirim Barang
  const handleShipBatch = async () => {
    if (!targetBatchId.trim()) return;
    try {
      setLoading(true);
      setMessage(null);
      const { contract, signer } = await getSignerContract();
      const userAddr = await signer.getAddress();

      const hasLogistics = await contract.hasRole(ROLES.LOGISTICS, userAddr);
      if (!hasLogistics) {
        setMessage({ 
          text: `Akun Anda belum memiliki hak LOGISTICS_ROLE. Buka tab "Panel Admin" untuk mengaktifkan peran Logistik.`, 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      const tx = await contract.shipBatch(targetBatchId.trim());
      setMessage({ text: 'Mengirim transaksi pengiriman... Status akan berubah menjadi InTransit.', type: 'info' });
      await tx.wait();

      setMessage({ text: `Sukses! Batch "${targetBatchId}" sekarang dalam status InTransit (Dalam Pengiriman)!`, type: 'success' });
      trackBatch(targetBatchId.trim());
      setActiveTab('track');
    } catch (err: unknown) {
      console.error(err);
      const error = err as CustomError;
      setMessage({ text: error.reason || error.message || 'Gagal mengubah status pengiriman. Pastikan status sebelumnya adalah Harvested.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Fungsi Retailer: Konfirmasi Penerimaan
  const handleConfirmDelivery = async () => {
    if (!targetBatchId.trim()) return;
    try {
      setLoading(true);
      setMessage(null);
      const { contract, signer } = await getSignerContract();
      const userAddr = await signer.getAddress();

      const hasRetailer = await contract.hasRole(ROLES.RETAILER, userAddr);
      if (!hasRetailer) {
        setMessage({ 
          text: `Akun Anda belum memiliki hak RETAILER_ROLE. Buka tab "Panel Admin" untuk mengaktifkan peran Retailer.`, 
          type: 'error' 
        });
        setLoading(false);
        return;
      }

      const tx = await contract.confirmDelivery(targetBatchId.trim());
      setMessage({ text: 'Mengonfirmasi penerimaan barang... Status akan berubah menjadi Delivered.', type: 'info' });
      await tx.wait();

      setMessage({ text: `Sukses! Batch "${targetBatchId}" resmi diterima di Toko (Delivered)!`, type: 'success' });
      trackBatch(targetBatchId.trim());
      setActiveTab('track');
    } catch (err: unknown) {
      console.error(err);
      const error = err as CustomError;
      setMessage({ text: error.reason || error.message || 'Gagal mengonfirmasi penerimaan. Pastikan status barang sebelumnya adalah InTransit.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 5. Fungsi Admin: Memberikan Role ke Akun
  const grantRoleDirect = async (roleHash: string, targetAddress: string, roleName: string) => {
    if (!ethers.isAddress(targetAddress)) {
      alert('Alamat wallet tidak valid! Pastikan format 0x... sudah benar.');
      return;
    }
    try {
      setLoading(true);
      setMessage(null);
      const { contract, provider } = await getSignerContract();

      setMessage({ text: `Membuka MetaMask untuk mendaftarkan role ${roleName}... Harap klik Confirm.`, type: 'info' });
      const tx = await contract.grantRole(roleHash, targetAddress.trim());
      setMessage({ text: `Transaksi dikirim ke Sepolia... Menunggu pencatatan blok.`, type: 'info' });
      await tx.wait();

      setMessage({ text: `BERHASIL! Hak akses ${roleName} resmi diberikan ke: ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`, type: 'success' });
      
      if (account && targetAddress.toLowerCase() === account.toLowerCase()) {
        await refreshUserRole(account, provider);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as CustomError;
      setMessage({ text: error.reason || error.message || 'Gagal memberikan role. Pastikan akun terhubung adalah Admin.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryRoleBadge = () => {
    const roles: string[] = [];
    if (userRoles.isAdmin) roles.push('Admin');
    if (userRoles.isFarmer) roles.push('Petani');
    if (userRoles.isLogistics) roles.push('Logistik');
    if (userRoles.isRetailer) roles.push('Retailer');

    if (roles.length === 0) return <span className="text-slate-400 font-medium">Publik (Tamu)</span>;
    return <span className="text-emerald-300 font-bold">{roles.join(' • ')}</span>;
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-1 rounded-full text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            🌱 Panen Selesai (Harvested)
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-3 py-1 rounded-full text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            🚚 Dalam Perjalanan (InTransit)
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-3 py-1 rounded-full text-xs shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            🏪 Diterima di Toko (Delivered)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 pb-20 font-sans selection:bg-emerald-200">
      {/* Top Professional Navbar */}
      <nav className="bg-emerald-950 text-white border-b border-emerald-900/60 sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-emerald-600 to-teal-500 p-2.5 rounded-xl shadow-inner text-white">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">AgriChain</span>
                <span className="bg-emerald-800/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-700">
                  Sepolia EVM
                </span>
              </div>
              <p className="text-xs text-emerald-400/80 font-medium hidden sm:block">Decentralized Agriculture Supply Chain DApp</p>
            </div>
          </div>

          {/* User Account & Wallet Control Center */}
          <div className="relative" ref={dropdownRef}>
            {account ? (
              <div>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 bg-emerald-900/90 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl border border-emerald-700/60 transition shadow-sm cursor-pointer"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <div className="text-left">
                    <div className="text-[11px] leading-tight flex items-center gap-1.5">
                      {getPrimaryRoleBadge()}
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-200">
                      {account.slice(0, 6)}...{account.slice(-4)}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Pengguna */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="pb-3 border-b border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akun Terhubung</span>
                      <div className="flex items-center justify-between mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="font-mono text-xs font-bold text-slate-700 truncate pr-2">{account}</span>
                        <button
                          onClick={copyAddress}
                          title="Salin Alamat"
                          className="text-slate-500 hover:text-emerald-600 transition p-1 cursor-pointer"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Status Hak Akses (Role List) */}
                    <div className="py-3 border-b border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hak Akses Smart Contract</span>
                        <button 
                          onClick={() => refreshUserRole(account)}
                          className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${userRoles.isAdmin ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          {userRoles.isAdmin ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"></span>}
                          Admin
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${userRoles.isFarmer ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          {userRoles.isFarmer ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"></span>}
                          Petani
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${userRoles.isLogistics ? 'bg-amber-50 border-amber-200 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          {userRoles.isLogistics ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"></span>}
                          Logistik
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${userRoles.isRetailer ? 'bg-blue-50 border-blue-200 text-blue-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                          {userRoles.isRetailer ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"></span>}
                          Retailer
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi: Ganti Akun & Logout */}
                    <div className="pt-3 flex flex-col gap-2">
                      <button
                        onClick={switchAccount}
                        className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Beralih Akun MetaMask
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Putuskan Koneksi (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                Connect MetaMask
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        
        {/* Banner Notifikasi Pesan */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-medium border flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
            message.type === 'error' ? 'bg-red-50 border-red-300 text-red-900' :
            'bg-blue-50 border-blue-300 text-blue-900'
          }`}>
            <div className="flex items-start gap-2.5">
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /> : 
               message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /> : 
               <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
              <div>{message.text}</div>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="bg-white p-1.5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap gap-1 mb-8">
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'track' 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Search className="w-4 h-4" /> Pelacakan Publik
          </button>

          <button
            onClick={() => setActiveTab('farmer')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'farmer' 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sprout className="w-4 h-4" /> Dashboard Petani
          </button>

          <button
            onClick={() => setActiveTab('logistics')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'logistics' 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Truck className="w-4 h-4" /> Dashboard Logistik
          </button>

          <button
            onClick={() => setActiveTab('retailer')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'retailer' 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4" /> Dashboard Retailer
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-emerald-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Panel Admin
          </button>
        </div>

        {/* ============================================================== */}
        {/* 1. TAB PELACAKAN PUBLIK */}
        {/* ============================================================== */}
        {activeTab === 'track' && (
          <div className="space-y-6">
            {/* Hero Search Box */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-8 rounded-3xl shadow-sm relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="bg-emerald-800/80 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-700 mb-3 inline-block">
                  Transparansi Rantai Pasok Terbuka
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                  Verifikasi Asal-Usul Komoditas Pertanian
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm mb-6 leading-relaxed">
                  Lacak keaslian tanggal panen, lokasi kebun, dan riwayat perpindahan tangan langsung dari Smart Contract Ethereum Sepolia tanpa memerlukan dompet kripto.
                </p>

                <div className="bg-white p-1.5 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center pl-3">
                    <Search className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Masukkan Batch ID (Contoh: AGRI-001)"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && trackBatch()}
                      className="w-full text-slate-800 placeholder-slate-400 text-sm focus:outline-none py-2"
                    />
                  </div>
                  <button
                    onClick={() => trackBatch()}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lacak Sekarang'}
                  </button>
                </div>
              </div>
            </div>

            {/* Hasil Tampilan Detail Batch */}
            {batchDetail ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
                {/* Header Kartu */}
                <div className="bg-slate-50/80 p-6 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paspor Digital Komoditas</span>
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      <Package className="w-6 h-6 text-emerald-700" />
                      {batchDetail.batchId}
                    </h3>
                  </div>
                  <div>
                    {getStatusBadge(batchDetail.status)}
                  </div>
                </div>

                {/* Ringkasan Parameter */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold">Nama Komoditas</span>
                      </div>
                      <p className="text-base font-extrabold text-slate-800">{batchDetail.commodityName}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Scale className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold">Berat Bersih</span>
                      </div>
                      <p className="text-base font-extrabold text-slate-800">{batchDetail.weight} Kilogram</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold">Asal Kebun</span>
                      </div>
                      <p className="text-base font-extrabold text-slate-800">{batchDetail.farmLocation}</p>
                    </div>
                  </div>

                  {/* Audit Trail Timeline */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      Runtutan Waktu Perpindahan Tangan (Blockchain Audit Trail)
                    </h4>

                    <div className="relative border-l-2 border-emerald-500 ml-4 pl-6 space-y-6">
                      {/* Step 1: Petani */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-bold text-sm text-slate-800">Tahap 1: Panen Didaftarkan oleh Petani</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {new Date(batchDetail.createdAt * 1000).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-mono">
                            Alamat Wallet Petani: <span className="text-emerald-800 font-bold">{batchDetail.farmer}</span>
                          </p>
                        </div>
                      </div>

                      {/* Step 2: Logistik */}
                      {batchDetail.status >= 1 && (
                        <div className="relative">
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100"></div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-sm text-slate-800">Tahap 2: Barang Diambil & Dikirim Kurir</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(batchDetail.updatedAt * 1000).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-mono">
                              Alamat Wallet Logistik: <span className="text-amber-800 font-bold">{batchDetail.logistics}</span>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Retailer */}
                      {batchDetail.status === 2 && (
                        <div className="relative">
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-bold text-sm text-slate-800">Tahap 3: Diterima & Diverifikasi di Toko</span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(batchDetail.updatedAt * 1000).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-mono">
                              Alamat Wallet Retailer: <span className="text-blue-800 font-bold">{batchDetail.retailer}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tombol QR & Explorer */}
                  <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
                    <button
                      onClick={() => setShowQRModal(!showQRModal)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      {showQRModal ? 'Tutup QR Code' : 'Tampilkan QR Code Kemasan'}
                    </button>

                    <a
                      href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      Buka di Sepolia Etherscan <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Tampilan Box QR Code */}
                  {showQRModal && (
                    <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                        <QRCodeSVG
                          value={typeof window !== 'undefined' ? `${window.location.origin}/?id=${batchDetail.batchId}` : batchDetail.batchId}
                          size={180}
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center font-medium">
                        Cetak dan tempelkan QR Code ini pada karung/kemasan produk untuk dipindai oleh konsumen akhir.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700 text-base">Belum Ada Batch yang Dilacak</h4>
                <p className="text-slate-400 text-xs max-w-md mx-auto mt-1">
                  Ketikkan Batch ID di atas (misal <span className="font-mono font-bold text-emerald-600">agri_1</span> atau hasil panen barumu) lalu klik Lacak.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* 2. TAB PETANI */}
        {/* ============================================================== */}
        {activeTab === 'farmer' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/90 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Registrasi Hasil Panen Baru</h2>
                <p className="text-xs text-slate-400">Khusus pengguna dengan hak akses <code className="font-mono text-emerald-700 font-bold">FARMER_ROLE</code></p>
              </div>
            </div>

            {!userRoles.isFarmer && account && (
              <div className="mt-4 mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Perhatian:</strong> Wallet yang aktif saat ini belum memiliki hak Petani. Buka tab <strong>Panel Admin</strong> untuk mengaktifkan <code className="font-mono">FARMER_ROLE</code> ke akun Anda terlebih dahulu.
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterHarvest} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch ID Unik</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BATCH-KOPI-001"
                  value={farmerForm.batchId}
                  onChange={(e) => setFarmerForm({ ...farmerForm, batchId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Komoditas Pertanian</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Arabika Gayo Super"
                  value={farmerForm.commodityName}
                  onChange={(e) => setFarmerForm({ ...farmerForm, commodityName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Berat Total (Kilogram)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 500"
                  value={farmerForm.weight}
                  onChange={(e) => setFarmerForm({ ...farmerForm, weight: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kebun (Umum)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Takengon, Aceh Tengah"
                  value={farmerForm.farmLocation}
                  onChange={(e) => setFarmerForm({ ...farmerForm, farmLocation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !account}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sprout className="w-4 h-4" />}
                Daftarkan Panen ke Blockchain Sepolia
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. TAB LOGISTIK */}
        {/* ============================================================== */}
        {activeTab === 'logistics' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/90 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Pembaruan Pengiriman Logistik</h2>
                <p className="text-xs text-slate-400">Khusus pengguna dengan hak akses <code className="font-mono text-amber-700 font-bold">LOGISTICS_ROLE</code></p>
              </div>
            </div>

            {!userRoles.isLogistics && account && (
              <div className="mt-4 mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Perhatian:</strong> Wallet yang aktif saat ini belum memiliki hak Logistik. Buka tab <strong>Panel Admin</strong> untuk mengaktifkan <code className="font-mono">LOGISTICS_ROLE</code>.
                </div>
              </div>
            )}

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch ID yang Akan Dikirim</label>
                <input
                  type="text"
                  placeholder="Masukkan Batch ID (Contoh: BATCH-KOPI-001)"
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleShipBatch}
                disabled={loading || !account}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Kirim Batch (Ubah Status ke InTransit)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. TAB RETAILER */}
        {/* ============================================================== */}
        {activeTab === 'retailer' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/90 max-w-xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-xl text-blue-700">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Konfirmasi Penerimaan Toko</h2>
                <p className="text-xs text-slate-400">Khusus pengguna dengan hak akses <code className="font-mono text-blue-700 font-bold">RETAILER_ROLE</code></p>
              </div>
            </div>

            {!userRoles.isRetailer && account && (
              <div className="mt-4 mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Perhatian:</strong> Wallet yang aktif saat ini belum memiliki hak Retailer. Buka tab <strong>Panel Admin</strong> untuk mengaktifkan <code className="font-mono">RETAILER_ROLE</code>.
                </div>
              </div>
            )}

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Batch ID yang Tiba di Toko</label>
                <input
                  type="text"
                  placeholder="Masukkan Batch ID (Contoh: BATCH-KOPI-001)"
                  value={targetBatchId}
                  onChange={(e) => setTargetBatchId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleConfirmDelivery}
                disabled={loading || !account}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                Konfirmasi Penerimaan (Ubah Status ke Delivered)
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 5. TAB ADMIN PANEL */}
        {/* ============================================================== */}
        {activeTab === 'admin' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Mode Cepat 1-Klik */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-6 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2.5 mb-2">
                <Zap className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">Mode Simulasi Mandiri (1-Klik untuk Diri Sendiri)</h3>
              </div>
              <p className="text-xs text-emerald-100 mb-4 leading-relaxed">
                Ingin mencoba alur lengkap dari hulu ke hilir menggunakan 1 wallet saja? Klik tombol di bawah untuk mendaftarkan akun aktifmu (<span className="font-mono font-bold text-amber-300">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'belum terhubung'}</span>) ke peran masing-masing.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => grantRoleDirect(ROLES.FARMER, account, 'Petani')}
                  disabled={loading || !account}
                  className="bg-emerald-700/80 hover:bg-emerald-700 border border-emerald-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sprout className="w-4 h-4 text-emerald-300" /> Jadi Petani
                </button>

                <button
                  type="button"
                  onClick={() => grantRoleDirect(ROLES.LOGISTICS, account, 'Logistik')}
                  disabled={loading || !account}
                  className="bg-amber-700/80 hover:bg-amber-700 border border-amber-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-4 h-4 text-amber-300" /> Jadi Logistik
                </button>

                <button
                  type="button"
                  onClick={() => grantRoleDirect(ROLES.RETAILER, account, 'Retailer')}
                  disabled={loading || !account}
                  className="bg-blue-700/80 hover:bg-blue-700 border border-blue-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Store className="w-4 h-4 text-blue-300" /> Jadi Retailer
                </button>
              </div>
            </div>

            {/* Form Pendelegasian ke Anggota Lain */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200/90">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Kelola Role Anggota Kelompok</h2>
                  <p className="text-xs text-slate-400">Bagikan hak akses ke alamat dompet teman kelompokmu untuk persiapan demonstrasi di hadapan dosen.</p>
                </div>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const roleName = selectedRoleToGrant === ROLES.FARMER ? 'Petani' : selectedRoleToGrant === ROLES.LOGISTICS ? 'Logistik' : 'Retailer';
                grantRoleDirect(selectedRoleToGrant, adminRoleTarget, roleName);
              }} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Role yang Akan Diberikan</label>
                  <select
                    value={selectedRoleToGrant}
                    onChange={(e) => setSelectedRoleToGrant(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value={ROLES.FARMER}>FARMER_ROLE (Petani - Daftarkan Panen)</option>
                    <option value={ROLES.LOGISTICS}>LOGISTICS_ROLE (Logistik - Kirim Barang)</option>
                    <option value={ROLES.RETAILER}>RETAILER_ROLE (Retailer - Terima di Toko)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Wallet Teman (Format 0x...)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0x1234567890abcdef..."
                    value={adminRoleTarget}
                    onChange={(e) => setAdminRoleTarget(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !account}
                  className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Berikan Izin Role Sekarang
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
