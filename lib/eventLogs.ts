import { ethers } from "ethers";
import {
  START_BLOCK,
  BatchStatus,
  TrackingEventItem,
} from "@/constants/contract";
import { getReadOnlyContract, getPublicProvider } from "./blockchain";

/**
 * Mengambil log event kronologis untuk suatu batchId spesifik mulai dari START_BLOCK (12195501).
 * Event yang dicari:
 * 1. HarvestRegistered(string batchId, string commodityName, uint256 weightKg, string farmLocation, address farmer, string farmerName, uint256 timestamp)
 * 2. BatchShipped(string batchId, address logistics, string logisticsName, uint256 timestamp)
 * 3. DeliveryConfirmed(string batchId, address retailer, string retailerName, uint256 timestamp)
 */
export async function getBatchTimelineEvents(batchId: string): Promise<TrackingEventItem[]> {
  const contract = getReadOnlyContract();
  const provider = getPublicProvider();
  const currentBlock = await provider.getBlockNumber();

  const events: TrackingEventItem[] = [];

  try {
    // 1. Filter HarvestRegistered
    const harvestFilter = contract.filters.HarvestRegistered();
    const harvestLogs = await contract.queryFilter(harvestFilter, START_BLOCK, currentBlock);

    for (const log of harvestLogs) {
      if ("args" in log && log.args) {
        const [
          logBatchId,
          commodityName,
          weightKg,
          farmLocation,
          farmerAddress,
          farmerName,
          timestamp,
        ] = log.args;

        if (logBatchId === batchId) {
          events.push({
            id: `harvest-${log.transactionHash}`,
            statusTitle: "Dipanen Petani",
            status: BatchStatus.Harvested,
            actorTitle: "Petani",
            actorName: farmerName || "Petani Terdaftar",
            actorAddress: farmerAddress,
            timestamp: Number(timestamp),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }
    }

    // 2. Filter BatchShipped
    const shippedFilter = contract.filters.BatchShipped();
    const shippedLogs = await contract.queryFilter(shippedFilter, START_BLOCK, currentBlock);

    for (const log of shippedLogs) {
      if ("args" in log && log.args) {
        const [logBatchId, logisticsAddress, logisticsName, timestamp] = log.args;

        if (logBatchId === batchId) {
          events.push({
            id: `shipped-${log.transactionHash}`,
            statusTitle: "Sedang Dikirim",
            status: BatchStatus.InTransit,
            actorTitle: "Logistik",
            actorName: logisticsName || "Mitra Logistik",
            actorAddress: logisticsAddress,
            timestamp: Number(timestamp),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }
    }

    // 3. Filter DeliveryConfirmed
    const deliveryFilter = contract.filters.DeliveryConfirmed();
    const deliveryLogs = await contract.queryFilter(deliveryFilter, START_BLOCK, currentBlock);

    for (const log of deliveryLogs) {
      if ("args" in log && log.args) {
        const [logBatchId, retailerAddress, retailerName, timestamp] = log.args;

        if (logBatchId === batchId) {
          events.push({
            id: `delivery-${log.transactionHash}`,
            statusTitle: "Sudah Diterima",
            status: BatchStatus.Delivered,
            actorTitle: "Pembeli",
            actorName: retailerName || "Toko / Pembeli",
            actorAddress: retailerAddress,
            timestamp: Number(timestamp),
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          });
        }
      }
    }

    // Urutkan event berdasarkan timestamp secara descending (paling mutakhir di atas, sesuai UI Gambar 2)
    events.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Gagal mengambil event logs untuk batch:", batchId, error);
  }

  return events;
}

