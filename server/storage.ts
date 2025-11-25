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
  type InsertWarehouse,
  type Warehouse,
  type InsertItem,
  type Item,
  type InsertSerial,
  type Serial,
  type InsertBatch,
  type Batch,
  type InsertLedger,
  type Ledger,
  type InsertTransfer,
  type Transfer,
  type InsertManagerWarehouse,
  type ManagerWarehouse,
} from "@shared/schema";

import { db } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export class DatabaseStorage {
  /* ---------------------------------------- */
  /* USERS – for JWT Login                    */
  /* ---------------------------------------- */

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: string;
  }): Promise<User> {
    const hashed = await bcrypt.hash(data.password, 10);
    const id = randomUUID();

    try {
      await db.insert(users).values({
        id,
        email: data.email,
        password: hashed,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        role: data.role,
      });

      const [created] = await db.select().from(users).where(eq(users.id, id));
      if (!created) {
        throw new Error("Failed to fetch created user");
      }
      return created;
    } catch (err: any) {
      if (err?.errno === 1062) {
        // Duplicate entry
        throw new Error("Email already exists");
      }
      throw err;
    }
  }

  async validatePassword(raw: string, hash: string) {
    return bcrypt.compare(raw, hash);
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  /* ---------------------------------------- */
  /* WAREHOUSES                               */
  /* ---------------------------------------- */

  async getWarehouses(): Promise<Warehouse[]> {
    return await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.isActive, true));
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const [wh] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return wh;
  }

  async createWarehouse(data: InsertWarehouse): Promise<Warehouse> {
    const id = randomUUID();
    await db.insert(warehouses).values({ id, ...data });

    const [created] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    if (!created) throw new Error("Failed to fetch created warehouse");
    return created;
  }

  async updateWarehouse(
    id: string,
    data: Partial<InsertWarehouse>
  ): Promise<Warehouse | undefined> {
    await db
      .update(warehouses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(warehouses.id, id));

    const [updated] = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return updated;
  }

  async getManagerWarehouses(managerId: string): Promise<string[]> {
    const rows = await db
      .select({ warehouseId: managerWarehouses.warehouseId })
      .from(managerWarehouses)
      .where(eq(managerWarehouses.managerId, managerId));

    return rows.map((x) => x.warehouseId);
  }

  async assignManagerToWarehouse(
    data: InsertManagerWarehouse
  ): Promise<ManagerWarehouse> {
    const id = randomUUID();
    await db.insert(managerWarehouses).values({ id, ...data });

    const [created] = await db
      .select()
      .from(managerWarehouses)
      .where(eq(managerWarehouses.id, id));

    if (!created) throw new Error("Failed to fetch created managerWarehouse");
    return created;
  }

  /* ---------------------------------------- */
  /* ITEMS                                    */
  /* ---------------------------------------- */

  async getItems(): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.isActive, true))
      .orderBy(desc(items.createdAt));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getItemBySku(sku: string): Promise<Item | undefined> {
    const [item] = await db
      .select()
      .from(items)
      .where(sql`LOWER(${items.sku}) = LOWER(${sku})`);
    return item;
  }

  async createItem(data: InsertItem): Promise<Item> {
    const id = randomUUID();
    await db.insert(items).values({ id, ...data });

    const [created] = await db.select().from(items).where(eq(items.id, id));
    if (!created) throw new Error("Failed to fetch created item");
    return created;
  }

  async updateItem(
    id: string,
    data: Partial<InsertItem>
  ): Promise<Item | undefined> {
    await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, id));

    const [updated] = await db.select().from(items).where(eq(items.id, id));
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    await db
      .update(items)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(items.id, id));
  }

  /* ---------------------------------------- */
  /* SERIALS                                  */
  /* ---------------------------------------- */

  async getSerials(itemId?: string): Promise<Serial[]> {
    if (itemId) {
      return await db
        .select()
        .from(serials)
        .where(eq(serials.itemId, itemId));
    }
    return await db.select().from(serials);
  }

  async getSerial(id: string): Promise<Serial | undefined> {
    const [serial] = await db.select().from(serials).where(eq(serials.id, id));
    return serial;
  }

  async getSerialByNumber(code: string): Promise<Serial | undefined> {
    const [serial] = await db
      .select()
      .from(serials)
      .where(sql`LOWER(${serials.serialNumber}) = LOWER(${code})`);
    return serial;
  }

  async createSerial(data: InsertSerial): Promise<Serial> {
    const id = randomUUID();
    await db.insert(serials).values({ id, ...data });

    const [created] = await db.select().from(serials).where(eq(serials.id, id));
    if (!created) throw new Error("Failed to fetch created serial");
    return created;
  }

  async updateSerial(
    id: string,
    data: Partial<InsertSerial>
  ): Promise<Serial | undefined> {
    await db
      .update(serials)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(serials.id, id));

    const [updated] = await db.select().from(serials).where(eq(serials.id, id));
    return updated;
  }

  /* ---------------------------------------- */
  /* BATCHES                                  */
  /* ---------------------------------------- */

  async getBatches(itemId?: string): Promise<Batch[]> {
    if (itemId) {
      return await db
        .select()
        .from(batches)
        .where(eq(batches.itemId, itemId));
    }
    return await db.select().from(batches);
  }

  async getBatch(id: string): Promise<Batch | undefined> {
    const [batch] = await db.select().from(batches).where(eq(batches.id, id));
    return batch;
  }

  async createBatch(data: InsertBatch): Promise<Batch> {
    const id = randomUUID();
    await db.insert(batches).values({ id, ...data });

    const [created] = await db.select().from(batches).where(eq(batches.id, id));
    if (!created) throw new Error("Failed to fetch created batch");
    return created;
  }

  async updateBatch(
    id: string,
    data: Partial<InsertBatch>
  ): Promise<Batch | undefined> {
    await db
      .update(batches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(batches.id, id));

    const [updated] = await db.select().from(batches).where(eq(batches.id, id));
    return updated;
  }

  /* ---------------------------------------- */
  /* LEDGER                                   */
  /* ---------------------------------------- */

  async createLedgerEntry(data: InsertLedger): Promise<Ledger> {
    const id = randomUUID();
    await db.insert(ledger).values({ id, ...data });

    const [created] = await db.select().from(ledger).where(eq(ledger.id, id));
    if (!created) throw new Error("Failed to fetch created ledger entry");
    return created;
  }

 async getLedgerEntries(filters: { itemId?: string; warehouseId?: string; limit?: number } = {}) {
  let whereClause: any[] = [];

  if (filters.itemId) {
    whereClause.push(eq(ledger.itemId, filters.itemId));
  }
  if (filters.warehouseId) {
    whereClause.push(eq(ledger.warehouseId, filters.warehouseId));
  }

  const finalQuery = db
    .select()
    .from(ledger)
    .where(whereClause.length ? and(...whereClause) : undefined)
    .orderBy(desc(ledger.createdAt))
    .limit(filters.limit ?? undefined);

  return await finalQuery;
}


  /* ---------------------------------------- */
  /* TRANSFERS                                */
  /* ---------------------------------------- */

  async getTransfers(filters: { status?: string; warehouseId?: string } = {}) {
  let whereClause: any[] = [];

  if (filters.status) {
    whereClause.push(eq(transfers.status, filters.status as any));
  }

  if (filters.warehouseId) {
    whereClause.push(
      or(
        eq(transfers.fromWarehouseId, filters.warehouseId),
        eq(transfers.toWarehouseId, filters.warehouseId)
      )
    );
  }

  const finalQuery = db
    .select()
    .from(transfers)
    .where(whereClause.length ? and(...whereClause) : undefined)
    .orderBy(desc(transfers.createdAt));

  return await finalQuery;
}


  async getTransfer(id: string): Promise<Transfer | undefined> {
    const [transfer] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, id));
    return transfer;
  }

  async createTransfer(data: InsertTransfer): Promise<Transfer> {
    const id = randomUUID();
    await db.insert(transfers).values({ id, ...data });

    const [created] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, id));

    if (!created) throw new Error("Failed to fetch created transfer");
    return created;
  }

  async updateTransfer(
    id: string,
    data: Partial<InsertTransfer>
  ): Promise<Transfer | undefined> {
    await db
      .update(transfers)
      .set(data)
      .where(eq(transfers.id, id));

    const [updated] = await db
      .select()
      .from(transfers)
      .where(eq(transfers.id, id));

    return updated;
  }
}

export const storage = new DatabaseStorage();
