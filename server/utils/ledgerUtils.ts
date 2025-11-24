import crypto from 'crypto';
import type { IStorage } from '../storage';
import type { InsertLedger, Ledger } from '@shared/schema';

export interface LedgerHashData {
  id: string;
  itemId: string;
  action: string;
  quantity: number;
  warehouseId: string;
  serialId: string | null;
  batchId: string | null;
  userId: string;
  createdBy: string;
  previousHash: string | null;
  reference: string | null;
  reason: string | null;
  metadata: any;
  createdAt: Date;
}

export function calculateHash(data: LedgerHashData): string {
  const hashInput = JSON.stringify({
    id: data.id,
    itemId: data.itemId,
    action: data.action,
    quantity: data.quantity,
    warehouseId: data.warehouseId,
    serialId: data.serialId,
    batchId: data.batchId,
    userId: data.userId,
    createdBy: data.createdBy,
    previousHash: data.previousHash,
    reference: data.reference,
    reason: data.reason,
    metadata: data.metadata,
    createdAt: data.createdAt.toISOString(),
  });

  return crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex');
}

export interface CreateLedgerEntryParams {
  itemId: string;
  action: 'in' | 'out' | 'adjust' | 'transfer';
  quantity: number;
  warehouseId: string;
  serialId?: string | null;
  batchId?: string | null;
  userId: string;
  createdBy: string;
  reference?: string | null;
  reason?: string | null;
  metadata?: any;
}

/**
 * Centralized helper to create ledger entries with hash chain
 * ALWAYS use this function instead of calling storage.createLedgerEntry directly
 */
export async function createLedgerEntryWithHash(
  storage: IStorage,
  params: CreateLedgerEntryParams
): Promise<Ledger> {
  // Get the last ledger entry to calculate previous hash
  const lastEntries = await storage.getLedgerEntries({ limit: 1 });
  const previousHash = lastEntries.length > 0 ? calculateHash(lastEntries[0]) : null;
  
  const entry = await storage.createLedgerEntry({
    itemId: params.itemId,
    action: params.action,
    quantity: params.quantity,
    warehouseId: params.warehouseId,
    serialId: params.serialId || null,
    batchId: params.batchId || null,
    userId: params.userId,
    createdBy: params.createdBy,
    previousHash,
    reference: params.reference || null,
    reason: params.reason || null,
    metadata: params.metadata || null,
  });
  
  return entry;
}
