// Reference: blueprint:javascript_log_in_with_replit
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./replitAuth";
import { csrfProtection } from "./csrfProtection";
import {
  insertWarehouseSchema,
  updateWarehouseSchema,
  insertItemSchema,
  updateItemSchema,
  insertSerialSchema,
  updateSerialSchema,
  insertBatchSchema,
  updateBatchSchema,
  insertLedgerSchema,
  insertTransferSchema,
  updateTransferSchema,
  insertManagerWarehouseSchema,
} from "@shared/schema";
import { z } from "zod";
import { generateSKU, generateSerialNumbers, generateSerialQRToken } from "./utils/itemUtils";
import { calculateHash, createLedgerEntryWithHash } from "./utils/ledgerUtils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  
  // Apply CSRF protection to all routes
  app.use(csrfProtection);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users (for assignment dropdowns)
  app.get('/api/users', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Warehouse routes
  app.get('/api/warehouses', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Managers only see their assigned warehouses
      if (user.role === 'manager') {
        const warehouseIds = await storage.getManagerWarehouses(userId);
        const warehouses = await storage.getWarehouses();
        const filtered = warehouses.filter(w => warehouseIds.includes(w.id));
        return res.json(filtered);
      }

      // Admins and staff see all warehouses
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Failed to fetch warehouses" });
    }
  });

  app.post('/api/warehouses', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const data = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(data);
      res.json(warehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating warehouse:", error);
      res.status(500).json({ message: "Failed to create warehouse" });
    }
  });

  app.patch('/api/warehouses/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const data = updateWarehouseSchema.parse(req.body);
      const warehouse = await storage.updateWarehouse(req.params.id, data);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      res.json(warehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Failed to update warehouse" });
    }
  });

  app.delete('/api/warehouses/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      if (!warehouse.isActive) {
        return res.status(404).json({ message: "Warehouse already deleted" });
      }
      await storage.updateWarehouse(req.params.id, { isActive: false });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Failed to delete warehouse" });
    }
  });

  app.post('/api/warehouses/:id/managers', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const data = insertManagerWarehouseSchema.parse({
        managerId: req.body.managerId,
        warehouseId: req.params.id,
      });
      const assignment = await storage.assignManagerToWarehouse(data);
      res.json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error assigning manager:", error);
      res.status(500).json({ message: "Failed to assign manager" });
    }
  });

  app.get('/api/manager-warehouses', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getManagerWarehouses(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching manager warehouses:", error);
      res.status(500).json({ message: "Failed to fetch manager warehouses" });
    }
  });

  // Item routes
  app.get('/api/items', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get('/api/items/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post('/api/items', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const { sku, ...itemData } = insertItemSchema.parse(req.body);
      const finalSku = sku || generateSKU(itemData.name);
      
      const existingItem = await storage.getItemBySku(finalSku);
      if (existingItem) {
        return res.status(400).json({ message: "SKU already exists" });
      }
      
      const item = await storage.createItem({ ...itemData, sku: finalSku });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.patch('/api/items/:id', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found or already deleted" });
      }
      
      const { isActive, ...data } = updateItemSchema.parse(req.body);
      
      if (data.sku) {
        const existingItem = await storage.getItemBySku(data.sku);
        if (existingItem && existingItem.id !== req.params.id) {
          return res.status(400).json({ message: "SKU already exists" });
        }
      }
      
      const updatedItem = await storage.updateItem(req.params.id, data);
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete('/api/items/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found or already deleted" });
      }
      
      await storage.deleteItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Serial routes
  app.get('/api/serials', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const serials = await storage.getSerials(itemId);
      res.json(serials);
    } catch (error) {
      console.error("Error fetching serials:", error);
      res.status(500).json({ message: "Failed to fetch serials" });
    }
  });

  app.get('/api/serials/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const serial = await storage.getSerial(req.params.id);
      if (!serial) {
        return res.status(404).json({ message: "Serial not found" });
      }
      res.json(serial);
    } catch (error) {
      console.error("Error fetching serial:", error);
      res.status(500).json({ message: "Failed to fetch serial" });
    }
  });

  app.post('/api/serials', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = insertSerialSchema.parse(req.body);
      const serial = await storage.createSerial(data);
      
      // Create ledger entry for stock IN
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      await createLedgerEntryWithHash(storage, {
        itemId: serial.itemId,
        action: 'in',
        quantity: 1,
        warehouseId: serial.warehouseId,
        serialId: serial.id,
        userId,
        createdBy: userName,
        reason: 'Initial stock - Serialized item created',
      });
      
      res.json(serial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating serial:", error);
      res.status(500).json({ message: "Failed to create serial" });
    }
  });

  // Bulk serial creation endpoint
  app.post('/api/items/:id/serials/bulk', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (item.type !== 'serialized') {
        return res.status(400).json({ message: "Item must be of type 'serialized' for bulk serial creation" });
      }

      const schema = z.object({
        quantity: z.number().int().positive().max(1000),
        startIndex: z.string().min(1),
        warehouseId: z.string(),
      });
      
      const { quantity, startIndex, warehouseId } = schema.parse(req.body);
      
      // Verify warehouse exists
      const warehouse = await storage.getWarehouse(warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      // Generate serial numbers
      const serialNumbers = generateSerialNumbers(startIndex, quantity);
      
      // Check for duplicates
      for (const serialNumber of serialNumbers) {
        const existing = await storage.getSerialByNumber(serialNumber);
        if (existing) {
          return res.status(400).json({ 
            message: `Serial number ${serialNumber} already exists` 
          });
        }
      }
      
      // Create all serials
      const createdSerials = [];
      for (const serialNumber of serialNumbers) {
        const { token, secret } = generateSerialQRToken('', serialNumber, item.id);
        
        const serial = await storage.createSerial({
          itemId: item.id,
          serialNumber,
          warehouseId,
          status: 'available',
          qrToken: token,
          qrSecret: secret,
        });
        
        // Create ledger entry for each serial
        await createLedgerEntryWithHash(storage, {
          itemId: item.id,
          action: 'in',
          quantity: 1,
          warehouseId,
          serialId: serial.id,
          userId,
          createdBy: userName,
          reason: `Bulk serial creation - ${quantity} units`,
        });
        
        // Explicitly exclude qrSecret from response for security
        createdSerials.push({
          id: serial.id,
          itemId: serial.itemId,
          serialNumber: serial.serialNumber,
          warehouseId: serial.warehouseId,
          status: serial.status,
          assignedTo: serial.assignedTo,
          warrantyEnd: serial.warrantyEnd,
          qrToken: serial.qrToken,
          createdAt: serial.createdAt,
          updatedAt: serial.updatedAt,
        });
      }
      
      res.status(201).json({ 
        count: createdSerials.length,
        serials: createdSerials,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating bulk serials:", error);
      res.status(500).json({ message: "Failed to create bulk serials" });
    }
  });

  app.patch('/api/serials/:id', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = updateSerialSchema.parse(req.body);
      const serial = await storage.updateSerial(req.params.id, data);
      if (!serial) {
        return res.status(404).json({ message: "Serial not found" });
      }
      res.json(serial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating serial:", error);
      res.status(500).json({ message: "Failed to update serial" });
    }
  });

  // Batch routes
  app.get('/api/batches', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const batches = await storage.getBatches(itemId);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ message: "Failed to fetch batches" });
    }
  });

  app.post('/api/batches', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(data);
      
      // Create ledger entry for stock IN
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      await createLedgerEntryWithHash(storage, {
        itemId: batch.itemId,
        action: 'in',
        quantity: batch.quantity,
        warehouseId: batch.warehouseId,
        batchId: batch.id,
        userId,
        createdBy: userName,
        reason: 'Initial stock - Batch created',
      });
      
      res.json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating batch:", error);
      res.status(500).json({ message: "Failed to create batch" });
    }
  });

  app.patch('/api/batches/:id', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = updateBatchSchema.parse(req.body);
      const oldBatch = await storage.getBatch(req.params.id);
      if (!oldBatch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      const batch = await storage.updateBatch(req.params.id, data);
      
      // If quantity changed, create adjust ledger entry
      if (data.quantity !== undefined && data.quantity !== oldBatch.quantity) {
        const userId = (req as any).dbUser.id;
        const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
        const quantityDiff = data.quantity - oldBatch.quantity;
        await createLedgerEntryWithHash(storage, {
          itemId: oldBatch.itemId,
          action: 'adjust',
          quantity: quantityDiff,
          warehouseId: oldBatch.warehouseId,
          batchId: oldBatch.id,
          userId,
          createdBy: userName,
          reason: 'Quantity adjustment',
        });
      }
      
      res.json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating batch:", error);
      res.status(500).json({ message: "Failed to update batch" });
    }
  });

  // Ledger routes
  app.get('/api/ledger', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const entries = await storage.getLedgerEntries({ itemId, warehouseId, limit });
      res.json(entries);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      res.status(500).json({ message: "Failed to fetch ledger" });
    }
  });

  app.post('/api/ledger', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      const schema = z.object({
        itemId: z.string(),
        warehouseId: z.string(),
        action: z.enum(['in', 'out', 'adjust', 'transfer']),
        quantity: z.number(),
        serialId: z.string().optional(),
        batchId: z.string().optional(),
        reference: z.string().optional(),
        reason: z.string().optional(),
        metadata: z.any().optional(),
      });
      
      const data = schema.parse(req.body);
      
      const entry = await createLedgerEntryWithHash(storage, {
        ...data,
        userId,
        createdBy: userName,
      });
      
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating ledger entry:", error);
      res.status(500).json({ message: "Failed to create ledger entry" });
    }
  });

  // Stock IN operation - receive items into warehouse
  app.post('/api/stock/in', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      const schema = z.object({
        itemId: z.string(),
        warehouseId: z.string(),
        quantity: z.number().positive(),
        batchId: z.string().optional(),
        serialId: z.string().optional(),
        reference: z.string().optional(),
        reason: z.string().optional(),
        metadata: z.any().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Verify item and warehouse exist
      const item = await storage.getItem(data.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const warehouse = await storage.getWarehouse(data.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      // If batch specified, update batch quantity
      if (data.batchId) {
        const batch = await storage.getBatch(data.batchId);
        if (!batch) {
          return res.status(404).json({ message: "Batch not found" });
        }
        await storage.updateBatch(data.batchId, {
          quantity: batch.quantity + data.quantity,
        });
      }
      
      // Create ledger entry with hash chain
      const entry = await createLedgerEntryWithHash(storage, {
        itemId: data.itemId,
        action: 'in',
        quantity: data.quantity,
        warehouseId: data.warehouseId,
        serialId: data.serialId,
        batchId: data.batchId,
        userId,
        createdBy: userName,
        reference: data.reference,
        reason: data.reason || 'Stock received',
        metadata: data.metadata,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error processing stock IN:", error);
      res.status(500).json({ message: "Failed to process stock IN" });
    }
  });

  // Stock OUT operation - issue items from warehouse
  app.post('/api/stock/out', requireRole('admin', 'manager', 'staff'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      const schema = z.object({
        itemId: z.string(),
        warehouseId: z.string(),
        quantity: z.number().positive(),
        batchId: z.string().optional(),
        serialId: z.string().optional(),
        reference: z.string().optional(),
        reason: z.string().optional(),
        metadata: z.any().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Verify item and warehouse exist
      const item = await storage.getItem(data.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const warehouse = await storage.getWarehouse(data.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      // If batch specified, validate and update quantity
      if (data.batchId) {
        const batch = await storage.getBatch(data.batchId);
        if (!batch) {
          return res.status(404).json({ message: "Batch not found" });
        }
        
        if (batch.quantity < data.quantity) {
          return res.status(400).json({ message: "Insufficient stock in batch" });
        }
        
        await storage.updateBatch(data.batchId, {
          quantity: batch.quantity - data.quantity,
        });
      }
      
      // If serial specified, verify it's available
      if (data.serialId) {
        const serial = await storage.getSerial(data.serialId);
        if (!serial) {
          return res.status(404).json({ message: "Serial not found" });
        }
        
        if (serial.status !== 'available') {
          return res.status(400).json({ message: "Serial is not available" });
        }
        
        await storage.updateSerial(data.serialId, {
          status: 'issued',
        });
      }
      
      // Create ledger entry with hash chain
      const entry = await createLedgerEntryWithHash(storage, {
        itemId: data.itemId,
        action: 'out',
        quantity: data.quantity,
        warehouseId: data.warehouseId,
        serialId: data.serialId,
        batchId: data.batchId,
        userId,
        createdBy: userName,
        reference: data.reference,
        reason: data.reason || 'Stock issued',
        metadata: data.metadata,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error processing stock OUT:", error);
      res.status(500).json({ message: "Failed to process stock OUT" });
    }
  });

  // Stock ADJUST operation - adjust inventory levels
  app.post('/api/stock/adjust', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      const schema = z.object({
        itemId: z.string(),
        warehouseId: z.string(),
        quantity: z.number().int(), // Can be positive or negative
        batchId: z.string().optional(),
        reference: z.string().optional(),
        reason: z.string().min(1, "Reason is required for adjustments"),
        metadata: z.any().optional(),
      });
      
      const data = schema.parse(req.body);
      
      // Verify item and warehouse exist
      const item = await storage.getItem(data.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      const warehouse = await storage.getWarehouse(data.warehouseId);
      if (!warehouse) {
        return res.status(404).json({ message: "Warehouse not found" });
      }
      
      // If batch specified, validate and update quantity
      if (data.batchId) {
        const batch = await storage.getBatch(data.batchId);
        if (!batch) {
          return res.status(404).json({ message: "Batch not found" });
        }
        
        const newQuantity = batch.quantity + data.quantity;
        if (newQuantity < 0) {
          return res.status(400).json({ message: "Adjustment would result in negative stock" });
        }
        
        await storage.updateBatch(data.batchId, {
          quantity: newQuantity,
        });
      }
      
      // Create ledger entry with hash chain
      const entry = await createLedgerEntryWithHash(storage, {
        itemId: data.itemId,
        action: 'adjust',
        quantity: data.quantity,
        warehouseId: data.warehouseId,
        serialId: null,
        batchId: data.batchId,
        userId,
        createdBy: userName,
        reference: data.reference,
        reason: data.reason,
        metadata: data.metadata,
      });
      
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error processing stock ADJUST:", error);
      res.status(500).json({ message: "Failed to process stock ADJUST" });
    }
  });

  // Ledger integrity verification endpoint
  app.get('/api/ledger/verify', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const entries = await storage.getLedgerEntries({});
      
      // Sort by creation time ascending
      entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      let isValid = true;
      let expectedPreviousHash: string | null = null;
      const errors: string[] = [];
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        // Check if previousHash matches expected
        if (entry.previousHash !== expectedPreviousHash) {
          isValid = false;
          errors.push(`Entry ${entry.id} at index ${i}: previousHash mismatch`);
        }
        
        // Calculate hash for this entry to use as next previous hash
        expectedPreviousHash = calculateHash(entry);
      }
      
      res.json({
        isValid,
        totalEntries: entries.length,
        errors,
      });
    } catch (error) {
      console.error("Error verifying ledger:", error);
      res.status(500).json({ message: "Failed to verify ledger" });
    }
  });

  // Transfer routes
  app.get('/api/transfers', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      
      const transfers = await storage.getTransfers({ status, warehouseId });
      res.json(transfers);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      res.status(500).json({ message: "Failed to fetch transfers" });
    }
  });

  app.get('/api/transfers/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const transfer = await storage.getTransfer(req.params.id);
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      res.json(transfer);
    } catch (error) {
      console.error("Error fetching transfer:", error);
      res.status(500).json({ message: "Failed to fetch transfer" });
    }
  });

  app.post('/api/transfers', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const data = insertTransferSchema.parse({ ...req.body, requestedBy: userId });
      const transfer = await storage.createTransfer(data);
      res.json(transfer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating transfer:", error);
      res.status(500).json({ message: "Failed to create transfer" });
    }
  });

  app.patch('/api/transfers/:id/approve', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const transfer = await storage.getTransfer(req.params.id);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      if (transfer.status !== 'pending') {
        return res.status(400).json({ message: "Transfer is not pending" });
      }
      
      const updateData = updateTransferSchema.parse({
        status: 'approved',
        approvedBy: userId,
      });
      
      await storage.updateTransfer(req.params.id, updateData);
      
      res.json({ message: "Transfer approved" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error approving transfer:", error);
      res.status(500).json({ message: "Failed to approve transfer" });
    }
  });

  app.patch('/api/transfers/:id/complete', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const userId = (req as any).dbUser.id;
      const transfer = await storage.getTransfer(req.params.id);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      if (transfer.status !== 'approved' && transfer.status !== 'in_transit') {
        return res.status(400).json({ message: "Transfer must be approved first" });
      }
      
      // Update serial or batch warehouse
      if (transfer.serialId) {
        await storage.updateSerial(transfer.serialId, {
          warehouseId: transfer.toWarehouseId,
        });
      } else if (transfer.batchId) {
        const fromBatch = await storage.getBatch(transfer.batchId);
        if (fromBatch) {
          // Reduce quantity in from warehouse
          await storage.updateBatch(transfer.batchId, {
            quantity: fromBatch.quantity - transfer.quantity,
          });
          
          // Find or create batch in to warehouse
          const toBatches = await storage.getBatches(transfer.itemId);
          const toBatch = toBatches.find(b => 
            b.warehouseId === transfer.toWarehouseId && 
            b.batchNumber === fromBatch.batchNumber
          );
          
          if (toBatch) {
            await storage.updateBatch(toBatch.id, {
              quantity: toBatch.quantity + transfer.quantity,
            });
          } else {
            await storage.createBatch({
              itemId: transfer.itemId,
              warehouseId: transfer.toWarehouseId,
              batchNumber: fromBatch.batchNumber,
              quantity: transfer.quantity,
              expiryDate: fromBatch.expiryDate,
            });
          }
        }
      }
      
      // Create ledger entries with hash chain
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      await createLedgerEntryWithHash(storage, {
        itemId: transfer.itemId,
        action: 'transfer',
        quantity: -transfer.quantity,
        warehouseId: transfer.fromWarehouseId,
        serialId: transfer.serialId,
        batchId: transfer.batchId,
        userId,
        createdBy: userName,
        reference: transfer.id,
        reason: `Transfer to ${transfer.toWarehouseId}`,
      });
      
      await createLedgerEntryWithHash(storage, {
        itemId: transfer.itemId,
        action: 'transfer',
        quantity: transfer.quantity,
        warehouseId: transfer.toWarehouseId,
        serialId: transfer.serialId,
        batchId: transfer.batchId,
        userId,
        createdBy: userName,
        reference: transfer.id,
        reason: `Transfer from ${transfer.fromWarehouseId}`,
      });
      
      // Update transfer
      const updateData = updateTransferSchema.parse({
        status: 'completed',
        completedAt: new Date(),
      });
      await storage.updateTransfer(req.params.id, updateData);
      
      res.json({ message: "Transfer completed" });
    } catch (error) {
      console.error("Error completing transfer:", error);
      res.status(500).json({ message: "Failed to complete transfer" });
    }
  });

  // QR lookup route
  app.get('/api/lookup/:code', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const code = req.params.code;
      
      // Try to find serial
      const serial = await storage.getSerialByNumber(code);
      if (serial) {
        const item = await storage.getItem(serial.itemId);
        return res.json({ type: 'serial', serial, item });
      }
      
      // Try to find item by SKU
      const item = await storage.getItemBySku(code);
      if (item) {
        const serials = await storage.getSerials(item.id);
        const batches = await storage.getBatches(item.id);
        return res.json({ type: 'item', item, serials, batches });
      }
      
      res.status(404).json({ message: "Not found" });
    } catch (error) {
      console.error("Error looking up code:", error);
      res.status(500).json({ message: "Lookup failed" });
    }
  });

  // Consumption action endpoint
  app.post('/api/consume', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Validate input
      const consumeSchema = z.object({
        code: z.string().min(1, "Code is required"),
        action: z.enum(['sell', 'loan', 'consume'], { errorMap: () => ({ message: "Invalid action type" }) }),
        assignedToId: z.string().optional(),
      });

      const validatedData = consumeSchema.parse(req.body);
      const { code, action, assignedToId } = validatedData;
      
      const userId = (req as any).dbUser.id;
      const userName = `${(req as any).dbUser.firstName} ${(req as any).dbUser.lastName}`;
      
      // Try to find serial first
      const serial = await storage.getSerialByNumber(code);
      if (serial) {
        const item = await storage.getItem(serial.itemId);
        if (!item) {
          return res.status(404).json({ message: "Item not found" });
        }
        
        // Validate action matches item's consumption type
        const expectedAction = item.consumptionType === 'sellable' ? 'sell' : 
                               item.consumptionType === 'loanable' ? 'loan' : 'consume';
        if (action !== expectedAction) {
          return res.status(400).json({ 
            message: `Invalid action. This item is ${item.consumptionType}, expected action: ${expectedAction}` 
          });
        }
        
        // Check if serial is already consumed/retired
        if (serial.status === 'retired') {
          return res.status(400).json({ message: "This serial has already been retired/consumed" });
        }
        
        // Validate loan action has assigned user
        if (action === 'loan' && !assignedToId) {
          return res.status(400).json({ message: "User assignment required for loanable items" });
        }
        
        // Handle serialized item consumption
        if (action === 'sell') {
          await storage.updateSerial(serial.id, { status: 'retired' });
          await createLedgerEntryWithHash(storage, {
            itemId: item.id,
            action: 'out',
            quantity: 1,
            warehouseId: serial.warehouseId,
            serialId: serial.id,
            userId,
            createdBy: userName,
            reason: `Sold - ${serial.serialNumber}`,
          });
          return res.json({ success: true, message: `${item.name} (${serial.serialNumber}) marked as sold`, item });
        } else if (action === 'loan') {
          await storage.updateSerial(serial.id, { status: 'issued', assignedTo: assignedToId });
          await createLedgerEntryWithHash(storage, {
            itemId: item.id,
            action: 'out',
            quantity: 1,
            warehouseId: serial.warehouseId,
            serialId: serial.id,
            userId,
            createdBy: userName,
            reason: `Loaned - ${serial.serialNumber} to user ${assignedToId}`,
          });
          return res.json({ success: true, message: `${item.name} (${serial.serialNumber}) loaned to user`, item });
        } else if (action === 'consume') {
          await storage.updateSerial(serial.id, { status: 'retired' });
          await createLedgerEntryWithHash(storage, {
            itemId: item.id,
            action: 'out',
            quantity: 1,
            warehouseId: serial.warehouseId,
            serialId: serial.id,
            userId,
            createdBy: userName,
            reason: `Consumed - ${serial.serialNumber}`,
          });
          return res.json({ success: true, message: `${item.name} (${serial.serialNumber}) marked as consumed`, item });
        }
      }
      
      // Try to find item by SKU (non-serialized)
      const item = await storage.getItemBySku(code);
      if (item) {
        // For serialized items, user must scan a specific serial number
        if (item.type === 'serialized') {
          return res.status(400).json({ 
            message: `This is a serialized item. Please scan or enter a specific serial number, not the SKU.`
          });
        }
        
        // Validate action matches item's consumption type
        const expectedAction = item.consumptionType === 'sellable' ? 'sell' : 
                               item.consumptionType === 'loanable' ? 'loan' : 'consume';
        if (action !== expectedAction) {
          return res.status(400).json({ 
            message: `Invalid action. This item is ${item.consumptionType}, expected action: ${expectedAction}` 
          });
        }
        
        // For non-serialized items, check stock availability
        const batches = await storage.getBatches(item.id);
        if (!batches || batches.length === 0) {
          return res.status(400).json({ message: "No stock available for this item" });
        }
        
        const batch = batches[0]; // Use first batch
        
        // Create ledger entry for non-serialized item
        const reason = action === 'sell' ? `Sold - SKU ${item.sku}` : 
                       action === 'loan' ? `Loaned - SKU ${item.sku}` : 
                       `Consumed - SKU ${item.sku}`;
        
        await createLedgerEntryWithHash(storage, {
          itemId: item.id,
          action: 'out',
          quantity: 1,
          warehouseId: batch.warehouseId,
          batchId: batch.id,
          userId,
          createdBy: userName,
          reason,
        });
        
        const actionPastTense = action === 'sell' ? 'sold' : action === 'loan' ? 'loaned' : 'consumed';
        return res.json({ success: true, message: `${item.name} marked as ${actionPastTense}`, item });
      }
      
      return res.status(404).json({ message: "Item or serial not found" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error consuming item:", error);
      return res.status(500).json({ message: "Consumption failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
