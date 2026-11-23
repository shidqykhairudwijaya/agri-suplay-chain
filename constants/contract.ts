import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0xC978D3Eb11D356c45f0AD4FF1A12EFe967502044";
export const START_BLOCK = 12196146;
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const FARMER_ROLE = ethers.id("FARMER_ROLE");
export const LOGISTICS_ROLE = ethers.id("LOGISTICS_ROLE");
export const RETAILER_ROLE = ethers.id("RETAILER_ROLE");

export const SEPOLIA_NETWORK_CONFIG = {
  chainId: SEPOLIA_CHAIN_HEX,
  chainName: "Ethereum Sepolia",
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "SEP",
    decimals: 18,
  },
  rpcUrls: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.sepolia.org",
    "https://sepolia.gateway.tenderly.co",
  ],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export enum BatchStatus {
  Harvested = 0, // Baru Dipanen
  InTransit = 1, // Sedang Dikirim
  Delivered = 2, // Sudah Diterima
}

export interface BatchData {
  batchId: string;
  commodityName: string;
  weightKg: bigint;
  farmLocation: string;
  farmerAddress: string;
  farmerName: string;
  status: BatchStatus;
  createdAt: bigint;
  updatedAt: bigint;
  exists: boolean;
}

export interface UserRoleInfo {
  isAdmin: boolean;
  isFarmer: boolean;
  isLogistics: boolean;
  isRetailer: boolean;
  actorName: string;
}

export interface TrackingEventItem {
  id: string;
  statusTitle: string;
  status: BatchStatus;
  actorTitle: string;
  actorName: string;
  actorAddress: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

export const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "_actorName",
        type: "string",
      },
    ],
    name: "assignRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "batchId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "logistics",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "logisticsName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "BatchShipped",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchId",
        type: "string",
      },
    ],
    name: "confirmDelivery",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "batchId",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "retailer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "retailerName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "DeliveryConfirmed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "batchId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "commodityName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "weightKg",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "farmLocation",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "farmer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "farmerName",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "HarvestRegistered",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchId",
        type: "string",
      },
      {
        internalType: "string",
        name: "_commodityName",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_weightKg",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "_farmLocation",
        type: "string",
      },
    ],
    name: "registerHarvest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_role",
        type: "bytes32",
      },
    ],
    name: "removeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "string",
        name: "actorName",
        type: "string",
      },
    ],
    name: "RoleAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchId",
        type: "string",
      },
    ],
    name: "shipBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "actorNames",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FARMER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllBatches",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "batchId",
            type: "string",
          },
          {
            internalType: "string",
            name: "commodityName",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "weightKg",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "farmLocation",
            type: "string",
          },
          {
            internalType: "address",
            name: "farmerAddress",
            type: "address",
          },
          {
            internalType: "string",
            name: "farmerName",
            type: "string",
          },
          {
            internalType: "enum AgriSupplyChain.BatchStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "createdAt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "updatedAt",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct AgriSupplyChain.Batch[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchId",
        type: "string",
      },
    ],
    name: "getBatch",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "batchId",
            type: "string",
          },
          {
            internalType: "string",
            name: "commodityName",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "weightKg",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "farmLocation",
            type: "string",
          },
          {
            internalType: "address",
            name: "farmerAddress",
            type: "address",
          },
          {
            internalType: "string",
            name: "farmerName",
            type: "string",
          },
          {
            internalType: "enum AgriSupplyChain.BatchStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "createdAt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "updatedAt",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct AgriSupplyChain.Batch",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalBatches",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "getUserInfo",
    outputs: [
      {
        internalType: "bool",
        name: "isAdmin",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isFarmer",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isLogistics",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "isRetailer",
        type: "bool",
      },
      {
        internalType: "string",
        name: "actorName",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LOGISTICS_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "RETAILER_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

