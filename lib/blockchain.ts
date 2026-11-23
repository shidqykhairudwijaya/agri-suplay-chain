import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  SEPOLIA_NETWORK_CONFIG,
} from "@/constants/contract";

// Daftar endpoint RPC Publik Sepolia yang stabil
const PUBLIC_RPC_URLS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.sepolia.org",
  "https://sepolia.gateway.tenderly.co",
  "https://1rpc.io/sepolia",
];

let publicProviderInstance: ethers.JsonRpcProvider | null = null;

/**
 * Mengembalikan JsonRpcProvider publik untuk membaca data blockchain tanpa perlu wallet terhubung.
 */
export function getPublicProvider(): ethers.JsonRpcProvider {
  if (!publicProviderInstance) {
    const customRpc = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL : undefined;
    const rpcUrl = customRpc || PUBLIC_RPC_URLS[0];
    publicProviderInstance = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: 11155111,
      name: "sepolia",
    });
  }
  return publicProviderInstance;
}

/**
 * Mengembalikan instance kontrak read-only (menggunakan public provider).
 */
export function getReadOnlyContract(): ethers.Contract {
  const provider = getPublicProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Mengembalikan instance kontrak write (menggunakan signer dari MetaMask).
 */
export function getSignerContract(signer: ethers.Signer): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

/**
 * Mengembalikan tautan Etherscan Sepolia untuk transaksi tertentu.
 */
export function getEtherscanTxUrl(txHash: string): string {
  return `${SEPOLIA_NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * Mengembalikan tautan Etherscan Sepolia untuk alamat akun tertentu.
 */
export function getEtherscanAddressUrl(address: string): string {
  return `${SEPOLIA_NETWORK_CONFIG.blockExplorerUrls[0]}/address/${address}`;
}

