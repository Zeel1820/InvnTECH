// Reference: blueprint:javascript_log_in_with_replit
import { sql } from 'drizzle-orm';
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  mysqlEnum,
  json,
  index,
  decimal,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = mysqlTable(
  "sessions",
  {
    sid: varchar("sid", { length: 255 }).primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// User roles enum
export const userRoleEnum = mysqlEnum("user_role", ["admin", "manager", "staff"]);

// Item consumption type enum
export const consumptionTypeEnum = mysqlEnum("consumption_type", ["sellable", "loanable", "consumable"]);

// Users table (extended from Replit Auth blueprint)
export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  email: varchar("email", { length: 255 }).unique(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  role: userRoleEnum("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`(now())`).onUpdateNow().notNull(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Warehouses table
export const warehouses = mysqlTable("warehouses", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`(now())`).onUpdateNow().notNull(),
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWarehouseSchema = insertWarehouseSchema.partial();

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type UpdateWarehouse = z.infer<typeof updateWarehouseSchema>;
export type Warehouse = typeof warehouses.$inferSelect;

// Manager warehouse assignments
export const managerWarehouses = mysqlTable("manager_warehouses", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  managerId: varchar("manager_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id", { length: 255 }).notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
}, (table) => ({
  managerWarehouseUnique: uniqueIndex("manager_warehouse_unique").on(table.managerId, table.warehouseId),
}));

export const insertManagerWarehouseSchema = createInsertSchema(managerWarehouses).omit({
  id: true,
  createdAt: true,
});

export type InsertManagerWarehouse = z.infer<typeof insertManagerWarehouseSchema>;
export type ManagerWarehouse = typeof managerWarehouses.$inferSelect;

// Item types enum
export const itemTypeEnum = mysqlEnum("item_type", ["serialized", "non-serialized"]);

// Items table
export const items = mysqlTable("items", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: itemTypeEnum("type").notNull(),
  consumptionType: consumptionTypeEnum("consumption_type").notNull().default("consumable"),
  category: varchar("category", { length: 100 }),
  reorderLevel: int("reorder_level").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`(now())`).onUpdateNow().notNull(),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateItemSchema = insertItemSchema.partial();

export type InsertItem = z.infer<typeof insertItemSchema>;
export type UpdateItem = z.infer<typeof updateItemSchema>;
export type Item = typeof items.$inferSelect;

// Serial status enum
export const serialStatusEnum = mysqlEnum("serial_status", [
  "available",
  "issued",
  "under_repair",
  "retired",
]);

// Serialized items table
export const serials = mysqlTable("serials", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  itemId: varchar("item_id", { length: 255 }).notNull().references(() => items.id, { onDelete: "cascade" }),
  serialNumber: varchar("serial_number", { length: 255 }).notNull().unique(),
  warehouseId: varchar("warehouse_id", { length: 255 }).notNull().references(() => warehouses.id),
  status: serialStatusEnum("status").notNull().default("available"),
  assignedTo: varchar("assigned_to", { length: 255 }).references(() => users.id),
  warrantyEnd: timestamp("warranty_end"),
  qrToken: text("qr_token"),
  qrSecret: text("qr_secret"),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`(now())`).onUpdateNow().notNull(),
});

export const insertSerialSchema = createInsertSchema(serials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSerialSchema = insertSerialSchema.pick({
  warehouseId: true,
  status: true,
  assignedTo: true,
  warrantyEnd: true,
}).partial();

export type InsertSerial = z.infer<typeof insertSerialSchema>;
export type UpdateSerial = z.infer<typeof updateSerialSchema>;
export type Serial = typeof serials.$inferSelect;

// Batches table (for non-serialized items)
export const batches = mysqlTable("batches", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  itemId: varchar("item_id", { length: 255 }).notNull().references(() => items.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id", { length: 255 }).notNull().references(() => warehouses.id),
  batchNumber: varchar("batch_number", { length: 255 }).notNull(),
  quantity: int("quantity").notNull().default(0),
  expiryDate: timestamp("expiry_date"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  receivedDate: timestamp("received_date"),
  qrToken: text("qr_token"),
  qrSecret: text("qr_secret"),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`(now())`).onUpdateNow().notNull(),
}, (table) => ({
  batchWarehouseItemUnique: uniqueIndex("batch_warehouse_item_unique").on(table.warehouseId, table.batchNumber, table.itemId),
  batchExpiryDateIdx: index("batch_expiry_date_idx").on(table.expiryDate),
}));

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBatchSchema = insertBatchSchema.pick({
  quantity: true,
  expiryDate: true,
  costPerUnit: true,
}).partial();

export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type UpdateBatch = z.infer<typeof updateBatchSchema>;
export type Batch = typeof batches.$inferSelect;

// Ledger action enum
export const ledgerActionEnum = mysqlEnum("ledger_action", ["in", "out", "adjust", "transfer"]);

// Stock ledger table (immutable audit log)
export const ledger = mysqlTable("ledger", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  itemId: varchar("item_id", { length: 255 }).notNull().references(() => items.id),
  action: ledgerActionEnum("action").notNull(),
  quantity: int("quantity").notNull(),
  warehouseId: varchar("warehouse_id", { length: 255 }).notNull().references(() => warehouses.id),
  serialId: varchar("serial_id", { length: 255 }).references(() => serials.id),
  batchId: varchar("batch_id", { length: 255 }).references(() => batches.id),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  previousHash: varchar("previous_hash", { length: 255 }),
  reference: varchar("reference", { length: 255 }),
  reason: text("reason"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
}, (table) => ({
  ledgerItemIdIdx: index("ledger_item_id_idx").on(table.itemId),
  ledgerWarehouseIdIdx: index("ledger_warehouse_id_idx").on(table.warehouseId),
  ledgerCreatedAtIdx: index("ledger_created_at_idx").on(table.createdAt),
}));

export const insertLedgerSchema = createInsertSchema(ledger).omit({
  id: true,
  createdAt: true,
});

export type InsertLedger = z.infer<typeof insertLedgerSchema>;
export type Ledger = typeof ledger.$inferSelect;

// Transfer status enum
export const transferStatusEnum = mysqlEnum("transfer_status", [
  "pending",
  "approved",
  "in_transit",
  "completed",
  "rejected",
]);

// Stock transfers table
export const transfers = mysqlTable("transfers", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`(uuid())`),
  itemId: varchar("item_id", { length: 255 }).notNull().references(() => items.id),
  fromWarehouseId: varchar("from_warehouse_id", { length: 255 }).notNull().references(() => warehouses.id),
  toWarehouseId: varchar("to_warehouse_id", { length: 255 }).notNull().references(() => warehouses.id),
  quantity: int("quantity").notNull(),
  serialId: varchar("serial_id", { length: 255 }).references(() => serials.id),
  batchId: varchar("batch_id", { length: 255 }).references(() => batches.id),
  status: transferStatusEnum("status").notNull().default("pending"),
  requestedBy: varchar("requested_by", { length: 255 }).notNull().references(() => users.id),
  approvedBy: varchar("approved_by", { length: 255 }).references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`(now())`).notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  transferStatusIdx: index("transfer_status_idx").on(table.status),
}));

export const insertTransferSchema = createInsertSchema(transfers).omit({
  id: true,
  createdAt: true,
});

export const updateTransferSchema = insertTransferSchema.pick({
  status: true,
  approvedBy: true,
  completedAt: true,
  notes: true,
}).partial();

export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type UpdateTransfer = z.infer<typeof updateTransferSchema>;
export type Transfer = typeof transfers.$inferSelect;
