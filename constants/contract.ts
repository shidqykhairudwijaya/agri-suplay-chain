export const CONTRACT_ADDRESS = "0xf99E37fb88317A12d2ad18332271EB7D9fb403E4";

// Public RPC Sepolia (agar publik bisa baca data tanpa install MetaMask)
export const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
export const SEPOLIA_CHAIN_ID = 11155111;

// Role Hash (keccak256)
export const ROLES = {
  ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000",
  FARMER: "0x7c6181838a71a779e445600d4c6ecbe16bacf2b3c5bda69c29fada66d1b645d1",
  LOGISTICS: "0xded9b5e0e0e3a2b3f09a0bc36ec64b9bf7a7c2319f3c4d9cff5ce48714257b21",
  RETAILER: "0x2a5f906c256a5d799494fcd066e1f6c077689de1cdb65052a1624de4bace99bf",
};

export const CONTRACT_ABI = [
  "error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)",
  "error AccessControlBadConfirmation()",
  "function registerHarvest(string _batchId, string _commodityName, uint256 _weight, string _farmLocation) external",
  "function shipBatch(string _batchId) external",
  "function confirmDelivery(string _batchId) external",
  "function getBatch(string _batchId) external view returns (tuple(string batchId, string commodityName, uint256 weight, string farmLocation, uint8 status, address farmer, address logistics, address retailer, uint256 createdAt, uint256 updatedAt))",
  "function getAllBatchIds() external view returns (string[])",
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "event HarvestRegistered(string indexed batchId, string commodityName, uint256 weight, address indexed farmer, uint256 timestamp)",
  "event BatchShipped(string indexed batchId, address indexed logistics, uint256 timestamp)",
  "event DeliveryConfirmed(string indexed batchId, address indexed retailer, uint256 timestamp)"
];
