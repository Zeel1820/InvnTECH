// Reference: blueprint:javascript_log_in_with_replit
import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  jsonb,
  index,
  decimal,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "staff"]);

// Item consumption type enum
export const consumptionTypeEnum = pgEnum("consumption_type", ["sellable", "loanable", "consumable"]);

// Users table (extended from Replit Auth blueprint)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull().unique(),
  location: text("location"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const managerWarehouses = pgTable("manager_warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  managerId: varchar("manager_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("manager_warehouse_unique").on(table.managerId, table.warehouseId),
]);

export const insertManagerWarehouseSchema = createInsertSchema(managerWarehouses).omit({
  id: true,
  createdAt: true,
});

export type InsertManagerWarehouse = z.infer<typeof insertManagerWarehouseSchema>;
export type ManagerWarehouse = typeof managerWarehouses.$inferSelect;

// Item types enum
export const itemTypeEnum = pgEnum("item_type", ["serialized", "non-serialized"]);

// Items table
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: itemTypeEnum("type").notNull(),
  consumptionType: consumptionTypeEnum("consumption_type").notNull().default("consumable"),
  category: varchar("category", { length: 100 }),
  reorderLevel: integer("reorder_level").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const serialStatusEnum = pgEnum("serial_status", [
  "available",
  "issued",
  "under_repair",
  "retired",
]);

// Serialized items table
export const serials = pgTable("serials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  serialNumber: varchar("serial_number", { length: 255 }).notNull().unique(),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  status: serialStatusEnum("status").notNull().default("available"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  warrantyEnd: timestamp("warranty_end"),
  qrToken: text("qr_token"),
  qrSecret: text("qr_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
export const batches = pgTable("batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  batchNumber: varchar("batch_number", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  expiryDate: timestamp("expiry_date"),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }),
  receivedDate: timestamp("received_date"),
  qrToken: text("qr_token"),
  qrSecret: text("qr_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("batch_warehouse_item_unique").on(table.warehouseId, table.batchNumber, table.itemId),
  index("batch_expiry_date_idx").on(table.expiryDate),
]);

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
export const ledgerActionEnum = pgEnum("ledger_action", ["in", "out", "adjust", "transfer"]);

// Stock ledger table (immutable audit log)
export const ledger = pgTable("ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  action: ledgerActionEnum("action").notNull(),
  quantity: integer("quantity").notNull(),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id),
  serialId: varchar("serial_id").references(() => serials.id),
  batchId: varchar("batch_id").references(() => batches.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdBy: varchar("created_by").notNull(),
  previousHash: varchar("previous_hash"),
  reference: varchar("reference", { length: 255 }),
  reason: text("reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ledger_item_id_idx").on(table.itemId),
  index("ledger_warehouse_id_idx").on(table.warehouseId),
  index("ledger_created_at_idx").on(table.createdAt),
]);

export const insertLedgerSchema = createInsertSchema(ledger).omit({
  id: true,
  createdAt: true,
});

export type InsertLedger = z.infer<typeof insertLedgerSchema>;
export type Ledger = typeof ledger.$inferSelect;

// Transfer status enum
export const transferStatusEnum = pgEnum("transfer_status", [
  "pending",
  "approved",
  "in_transit",
  "completed",
  "rejected",
]);

// Stock transfers table
export const transfers = pgTable("transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").notNull().references(() => items.id),
  fromWarehouseId: varchar("from_warehouse_id").notNull().references(() => warehouses.id),
  toWarehouseId: varchar("to_warehouse_id").notNull().references(() => warehouses.id),
  quantity: integer("quantity").notNull(),
  serialId: varchar("serial_id").references(() => serials.id),
  batchId: varchar("batch_id").references(() => batches.id),
  status: transferStatusEnum("status").notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("transfer_status_idx").on(table.status),
]);

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
