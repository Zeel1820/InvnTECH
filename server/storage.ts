// Reference: blueprint:javascript_log_in_with_replit
import {
  users,
  warehouses,
  items,
  serials,
  batches,
  ledger,
  transfers,
  managerWarehouses,
  type User,
  type UpsertUser,
  type Warehouse,
  type InsertWarehouse,
  type Item,
  type InsertItem,
  type Serial,
  type InsertSerial,
  type Batch,
  type InsertBatch,
  type Ledger,
  type InsertLedger,
  type Transfer,
  type InsertTransfer,
  type ManagerWarehouse,
  type InsertManagerWarehouse,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Warehouse operations
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: string): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: string, warehouse: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  getManagerWarehouses(managerId: string): Promise<string[]>;
  assignManagerToWarehouse(data: InsertManagerWarehouse): Promise<ManagerWarehouse>;
  removeManagerFromWarehouse(managerId: string, warehouseId: string): Promise<void>;
  
  // Item operations
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  getItemBySku(sku: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<void>;
  
  // Serial operations
  getSerials(itemId?: string): Promise<Serial[]>;
  getSerial(id: string): Promise<Serial | undefined>;
  getSerialByNumber(serialNumber: string): Promise<Serial | undefined>;
  createSerial(serial: InsertSerial): Promise<Serial>;
  updateSerial(id: string, serial: Partial<InsertSerial>): Promise<Serial | undefined>;
  
  // Batch operations
  getBatches(itemId?: string): Promise<Batch[]>;
  getBatch(id: string): Promise<Batch | undefined>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: string, batch: Partial<InsertBatch>): Promise<Batch | undefined>;
  
  // Ledger operations
  createLedgerEntry(entry: InsertLedger): Promise<Ledger>;
  getLedgerEntries(filters?: { itemId?: string; warehouseId?: string; limit?: number }): Promise<Ledger[]>;
  
  // Transfer operations
  getTransfers(filters?: { status?: string; warehouseId?: string }): Promise<Transfer[]>;
  getTransfer(id: string): Promise<Transfer | undefined>;
  createTransfer(transfer: InsertTransfer): Promise<Transfer>;
  updateTransfer(id: string, transfer: Partial<InsertTransfer>): Promise<Transfer | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to upsert based on ID (normal case)
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // Handle unique constraint violation on email
      if (error?.code === '23505' && error?.constraint === 'users_email_unique') {
        // Find user by email and delete them (CASCADE handles related records)
        await db.delete(users).where(eq(users.email, userData.email));
        
        // Now insert the new user
        const [user] = await db
          .insert(users)
          .values(userData)
          .returning();
        return user;
      }
      throw error;
    }
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses).where(eq(warehouses.isActive, true));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return warehouse;
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const [created] = await db.insert(warehouses).values(warehouse).returning();
    return created;
  }

  async updateWarehouse(id: string, warehouseData: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updated] = await db
      .update(warehouses)
      .set({ ...warehouseData, updatedAt: new Date() })
      .where(eq(warehouses.id, id))
      .returning();
    return updated;
  }

  async getManagerWarehouses(managerId: string): Promise<string[]> {
    const assignments = await db
      .select({ warehouseId: managerWarehouses.warehouseId })
      .from(managerWarehouses)
      .where(eq(managerWarehouses.managerId, managerId));
    return assignments.map(a => a.warehouseId);
  }

  async assignManagerToWarehouse(data: InsertManagerWarehouse): Promise<ManagerWarehouse> {
    const [assignment] = await db.insert(managerWarehouses).values(data).returning();
    return assignment;
  }

  async removeManagerFromWarehouse(managerId: string, warehouseId: string): Promise<void> {
    await db
      .delete(managerWarehouses)
      .where(
        and(
          eq(managerWarehouses.managerId, managerId),
          eq(managerWarehouses.warehouseId, warehouseId)
        )
      );
  }

  // Item operations
  async getItems(): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.isActive, true)).orderBy(desc(items.createdAt));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(and(eq(items.id, id), eq(items.isActive, true)));
    return item;
  }

  async getItemBySku(sku: string): Promise<Item | undefined> {
    // Try exact match first (case-insensitive)
    const [exactMatch] = await db.select().from(items).where(sql`LOWER(${items.sku}) = LOWER(${sku})`);
    if (exactMatch) {
      return exactMatch;
    }
    
    // Try partial match (case-insensitive)
    const [partialMatch] = await db.select().from(items).where(sql`LOWER(${items.sku}) LIKE LOWER(${sku} || '%')`);
    return partialMatch;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [created] = await db.insert(items).values(item).returning();
    return created;
  }

  async updateItem(id: string, itemData: Partial<InsertItem>): Promise<Item | undefined> {
    const [updated] = await db
      .update(items)
      .set({ ...itemData, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    await db.update(items).set({ isActive: false, updatedAt: new Date() }).where(eq(items.id, id));
  }

  // Serial operations
  async getSerials(itemId?: string): Promise<Serial[]> {
    if (itemId) {
      return await db.select().from(serials).where(eq(serials.itemId, itemId));
    }
    return await db.select().from(serials);
  }

  async getSerial(id: string): Promise<Serial | undefined> {
    const [serial] = await db.select().from(serials).where(eq(serials.id, id));
    return serial;
  }

  async getSerialByNumber(serialNumber: string): Promise<Serial | undefined> {
    const [serial] = await db.select().from(serials).where(sql`LOWER(${serials.serialNumber}) = LOWER(${serialNumber})`);
    return serial;
  }

  async createSerial(serial: InsertSerial): Promise<Serial> {
    const [created] = await db.insert(serials).values(serial).returning();
    return created;
  }

  async updateSerial(id: string, serialData: Partial<InsertSerial>): Promise<Serial | undefined> {
    const [updated] = await db
      .update(serials)
      .set({ ...serialData, updatedAt: new Date() })
      .where(eq(serials.id, id))
      .returning();
    return updated;
  }

  // Batch operations
  async getBatches(itemId?: string): Promise<Batch[]> {
    if (itemId) {
      return await db.select().from(batches).where(eq(batches.itemId, itemId));
    }
    return await db.select().from(batches);
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const [created] = await db.insert(batches).values(batch).returning();
    return created;
  }

  async updateBatch(id: string, batchData: Partial<InsertBatch>): Promise<Batch | undefined> {
    const [updated] = await db
      .update(batches)
      .set({ ...batchData, updatedAt: new Date() })
      .where(eq(batches.id, id))
      .returning();
    return updated;
  }

  // Ledger operations
  async createLedgerEntry(entry: InsertLedger): Promise<Ledger> {
    const [created] = await db.insert(ledger).values(entry).returning();
    return created;
  }

  async getLedgerEntries(filters?: { itemId?: string; warehouseId?: string; limit?: number }): Promise<Ledger[]> {
    let query = db.select().from(ledger);
    
    const conditions = [];
    if (filters?.itemId) {
      conditions.push(eq(ledger.itemId, filters.itemId));
    }
    if (filters?.warehouseId) {
      conditions.push(eq(ledger.warehouseId, filters.warehouseId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(ledger.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    return await query;
  }

  // Transfer operations
  async getTransfers(filters?: { status?: string; warehouseId?: string }): Promise<Transfer[]> {
    let query = db.select().from(transfers);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(transfers.status, filters.status as any));
    }
    if (filters?.warehouseId) {
      conditions.push(
        or(
          eq(transfers.fromWarehouseId, filters.warehouseId),
          eq(transfers.toWarehouseId, filters.warehouseId)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(transfers.createdAt));
  }

  async getTransfer(id: string): Promise<Transfer | undefined> {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, id));
    return transfer;
  }

  async createTransfer(transfer: InsertTransfer): Promise<Transfer> {
    const [created] = await db.insert(transfers).values(transfer).returning();
    return created;
  }

  async updateTransfer(id: string, transferData: Partial<InsertTransfer>): Promise<Transfer | undefined> {
    const [updated] = await db
      .update(transfers)
      .set(transferData)
      .where(eq(transfers.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
