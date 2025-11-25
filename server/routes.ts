import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { authMiddleware, requireRole, loginHandler } from './auth';

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
} from '@shared/schema';

import { z } from 'zod';
import { generateSKU, generateSerialNumbers, generateSerialQRToken } from './utils/itemUtils';
import { calculateHash, createLedgerEntryWithHash } from './utils/ledgerUtils';

export async function registerRoutes(app: Express): Promise<Server> {
  /* ──────────────────────────────────────────
     AUTH ROUTES (JWT BASED)
  ─────────────────────────────────────────── */
  app.get('/api/login', (req, res) => {
    res.redirect('/login');
  });
  // Login route -> returns { token, user }
  app.post('/api/auth/login', loginHandler);

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email & Password are required' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const newUser = await storage.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role || 'staff', // default
      });

      res.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // Get current logged-in user
  app.get('/api/auth/user', authMiddleware, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching auth user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  /* ──────────────────────────────────────────
     USERS
  ─────────────────────────────────────────── */

  app.get('/api/users', authMiddleware, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  /* ──────────────────────────────────────────
     WAREHOUSES
  ─────────────────────────────────────────── */

  app.get('/api/warehouses', authMiddleware, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Managers only see their assigned warehouses
      if (user.role === 'manager') {
        const warehouseIds = await storage.getManagerWarehouses(userId);
        const warehouses = await storage.getWarehouses();
        const filtered = warehouses.filter((w) => warehouseIds.includes(w.id));
        return res.json(filtered);
      }

      // Admins and staff see all warehouses
      const warehouses = await storage.getWarehouses();
      res.json(warehouses);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      res.status(500).json({ message: 'Failed to fetch warehouses' });
    }
  });

  app.post('/api/warehouses', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const data = insertWarehouseSchema.parse(req.body);
      const warehouse = await storage.createWarehouse(data);
      res.json(warehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating warehouse:', error);
      res.status(500).json({ message: 'Failed to create warehouse' });
    }
  });

  app.patch('/api/warehouses/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const data = updateWarehouseSchema.parse(req.body);
      const warehouse = await storage.updateWarehouse(req.params.id, data);
      if (!warehouse) {
        return res.status(404).json({ message: 'Warehouse not found' });
      }
      res.json(warehouse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating warehouse:', error);
      res.status(500).json({ message: 'Failed to update warehouse' });
    }
  });

  app.delete('/api/warehouses/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const warehouse = await storage.getWarehouse(req.params.id);
      if (!warehouse) {
        return res.status(404).json({ message: 'Warehouse not found' });
      }
      if (!warehouse.isActive) {
        return res.status(404).json({ message: 'Warehouse already deleted' });
      }
      await storage.updateWarehouse(req.params.id, { isActive: false });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      res.status(500).json({ message: 'Failed to delete warehouse' });
    }
  });

  app.post(
    '/api/warehouses/:id/managers',
    requireRole('admin'),
    async (req: Request, res: Response) => {
      try {
        const data = insertManagerWarehouseSchema.parse({
          managerId: req.body.managerId,
          warehouseId: req.params.id,
        });
        const assignment = await storage.assignManagerToWarehouse(data);
        res.json(assignment);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error assigning manager:', error);
        res.status(500).json({ message: 'Failed to assign manager' });
      }
    },
  );

  app.get('/api/manager-warehouses', authMiddleware, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const assignments = await storage.getManagerWarehouses(userId);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching manager warehouses:', error);
      res.status(500).json({ message: 'Failed to fetch manager warehouses' });
    }
  });

  /* ──────────────────────────────────────────
     ITEMS
  ─────────────────────────────────────────── */

  app.get('/api/items', authMiddleware, async (req: Request, res: Response) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Failed to fetch items' });
    }
  });

  app.get('/api/items/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      res.json(item);
    } catch (error) {
      console.error('Error fetching item:', error);
      res.status(500).json({ message: 'Failed to fetch item' });
    }
  });

  app.post('/api/items', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const { sku, ...itemData } = insertItemSchema.parse(req.body);
      const finalSku = sku || generateSKU(itemData.name);

      const existingItem = await storage.getItemBySku(finalSku);
      if (existingItem) {
        return res.status(400).json({ message: 'SKU already exists' });
      }

      const item = await storage.createItem({ ...itemData, sku: finalSku });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'Failed to create item' });
    }
  });

  app.patch(
    '/api/items/:id',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const item = await storage.getItem(req.params.id);
        if (!item) {
          return res.status(404).json({ message: 'Item not found or already deleted' });
        }

        const { isActive, ...data } = updateItemSchema.parse(req.body);

        if (data.sku) {
          const existingItem = await storage.getItemBySku(data.sku);
          if (existingItem && existingItem.id !== req.params.id) {
            return res.status(400).json({ message: 'SKU already exists' });
          }
        }

        const updatedItem = await storage.updateItem(req.params.id, data);
        res.json(updatedItem);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Failed to update item' });
      }
    },
  );

  app.delete('/api/items/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: 'Item not found or already deleted' });
      }

      await storage.deleteItem(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting item:', error);
      res.status(500).json({ message: 'Failed to delete item' });
    }
  });

  /* ──────────────────────────────────────────
     SERIALS
  ─────────────────────────────────────────── */

  app.get('/api/serials', authMiddleware, async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const serials = await storage.getSerials(itemId);
      res.json(serials);
    } catch (error) {
      console.error('Error fetching serials:', error);
      res.status(500).json({ message: 'Failed to fetch serials' });
    }
  });

  app.get('/api/serials/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const serial = await storage.getSerial(req.params.id);
      if (!serial) {
        return res.status(404).json({ message: 'Serial not found' });
      }
      res.json(serial);
    } catch (error) {
      console.error('Error fetching serial:', error);
      res.status(500).json({ message: 'Failed to fetch serial' });
    }
  });

  app.post('/api/serials', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = insertSerialSchema.parse(req.body);
      const serial = await storage.createSerial(data);

      const authReq = req as any;
      const dbUser = await storage.getUser(authReq.user.id);
      if (!dbUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      const userId = dbUser.id;
      const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

      // Create ledger entry for stock IN
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
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating serial:', error);
      res.status(500).json({ message: 'Failed to create serial' });
    }
  });

  // Bulk serial creation
  app.post(
    '/api/items/:id/serials/bulk',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const item = await storage.getItem(req.params.id);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }

        if (item.type !== 'serialized') {
          return res
            .status(400)
            .json({ message: "Item must be of type 'serialized' for bulk serial creation" });
        }

        const bodySchema = z.object({
          quantity: z.number().int().positive().max(1000),
          startIndex: z.string().min(1),
          warehouseId: z.string(),
        });

        const { quantity, startIndex, warehouseId } = bodySchema.parse(req.body);

        const warehouse = await storage.getWarehouse(warehouseId);
        if (!warehouse) {
          return res.status(404).json({ message: 'Warehouse not found' });
        }

        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }
        const userId = dbUser.id;
        const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

        const serialNumbers = generateSerialNumbers(startIndex, quantity);

        // Check duplicates
        for (const serialNumber of serialNumbers) {
          const existing = await storage.getSerialByNumber(serialNumber);
          if (existing) {
            return res.status(400).json({
              message: `Serial number ${serialNumber} already exists`,
            });
          }
        }

        const createdSerials: any[] = [];

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
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error creating bulk serials:', error);
        res.status(500).json({ message: 'Failed to create bulk serials' });
      }
    },
  );

  app.patch(
    '/api/serials/:id',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const data = updateSerialSchema.parse(req.body);
        const serial = await storage.updateSerial(req.params.id, data);
        if (!serial) {
          return res.status(404).json({ message: 'Serial not found' });
        }
        res.json(serial);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error updating serial:', error);
        res.status(500).json({ message: 'Failed to update serial' });
      }
    },
  );

  /* ──────────────────────────────────────────
     BATCHES
  ─────────────────────────────────────────── */

  app.get('/api/batches', authMiddleware, async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const batches = await storage.getBatches(itemId);
      res.json(batches);
    } catch (error) {
      console.error('Error fetching batches:', error);
      res.status(500).json({ message: 'Failed to fetch batches' });
    }
  });

  app.post('/api/batches', requireRole('admin', 'manager'), async (req: Request, res: Response) => {
    try {
      const data = insertBatchSchema.parse(req.body);
      const batch = await storage.createBatch(data);

      const authReq = req as any;
      const dbUser = await storage.getUser(authReq.user.id);
      if (!dbUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      const userId = dbUser.id;
      const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

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
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating batch:', error);
      res.status(500).json({ message: 'Failed to create batch' });
    }
  });

  app.patch(
    '/api/batches/:id',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const data = updateBatchSchema.parse(req.body);
        const oldBatch = await storage.getBatch(req.params.id);
        if (!oldBatch) {
          return res.status(404).json({ message: 'Batch not found' });
        }

        const batch = await storage.updateBatch(req.params.id, data);

        if (data.quantity !== undefined && data.quantity !== oldBatch.quantity) {
          const authReq = req as any;
          const dbUser = await storage.getUser(authReq.user.id);
          if (!dbUser) {
            return res.status(401).json({ message: 'User not found' });
          }
          const userId = dbUser.id;
          const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

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
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error updating batch:', error);
        res.status(500).json({ message: 'Failed to update batch' });
      }
    },
  );

  /* ──────────────────────────────────────────
     LEDGER
  ─────────────────────────────────────────── */

  app.get('/api/ledger', authMiddleware, async (req: Request, res: Response) => {
    try {
      const itemId = req.query.itemId as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const entries = await storage.getLedgerEntries({ itemId, warehouseId, limit });
      res.json(entries);
    } catch (error) {
      console.error('Error fetching ledger:', error);
      res.status(500).json({ message: 'Failed to fetch ledger' });
    }
  });

  app.post('/api/ledger', authMiddleware, async (req: Request, res: Response) => {
    try {
      const authReq = req as any;
      const dbUser = await storage.getUser(authReq.user.id);
      if (!dbUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      const userId = dbUser.id;
      const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

      const bodySchema = z.object({
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

      const data = bodySchema.parse(req.body);

      const entry = await createLedgerEntryWithHash(storage, {
        ...data,
        userId,
        createdBy: userName,
      });

      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating ledger entry:', error);
      res.status(500).json({ message: 'Failed to create ledger entry' });
    }
  });

  /* ──────────────────────────────────────────
     STOCK OPERATIONS: IN / OUT / ADJUST
  ─────────────────────────────────────────── */

  // Stock IN
  app.post(
    '/api/stock/in',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }
        const userId = dbUser.id;
        const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

        const bodySchema = z.object({
          itemId: z.string(),
          warehouseId: z.string(),
          quantity: z.number().positive(),
          batchId: z.string().optional(),
          serialId: z.string().optional(),
          reference: z.string().optional(),
          reason: z.string().optional(),
          metadata: z.any().optional(),
        });

        const data = bodySchema.parse(req.body);

        const item = await storage.getItem(data.itemId);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }

        const warehouse = await storage.getWarehouse(data.warehouseId);
        if (!warehouse) {
          return res.status(404).json({ message: 'Warehouse not found' });
        }

        if (data.batchId) {
          const batch = await storage.getBatch(data.batchId);
          if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
          }
          await storage.updateBatch(data.batchId, {
            quantity: batch.quantity + data.quantity,
          });
        }

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
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error processing stock IN:', error);
        res.status(500).json({ message: 'Failed to process stock IN' });
      }
    },
  );

  // Stock OUT
  app.post(
    '/api/stock/out',
    requireRole('admin', 'manager', 'staff'),
    async (req: Request, res: Response) => {
      try {
        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }
        const userId = dbUser.id;
        const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

        const bodySchema = z.object({
          itemId: z.string(),
          warehouseId: z.string(),
          quantity: z.number().positive(),
          batchId: z.string().optional(),
          serialId: z.string().optional(),
          reference: z.string().optional(),
          reason: z.string().optional(),
          metadata: z.any().optional(),
        });

        const data = bodySchema.parse(req.body);

        const item = await storage.getItem(data.itemId);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }

        const warehouse = await storage.getWarehouse(data.warehouseId);
        if (!warehouse) {
          return res.status(404).json({ message: 'Warehouse not found' });
        }

        if (data.batchId) {
          const batch = await storage.getBatch(data.batchId);
          if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
          }

          if (batch.quantity < data.quantity) {
            return res.status(400).json({ message: 'Insufficient stock in batch' });
          }

          await storage.updateBatch(data.batchId, {
            quantity: batch.quantity - data.quantity,
          });
        }

        if (data.serialId) {
          const serial = await storage.getSerial(data.serialId);
          if (!serial) {
            return res.status(404).json({ message: 'Serial not found' });
          }

          if (serial.status !== 'available') {
            return res.status(400).json({ message: 'Serial is not available' });
          }

          await storage.updateSerial(data.serialId, {
            status: 'issued',
          });
        }

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
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error processing stock OUT:', error);
        res.status(500).json({ message: 'Failed to process stock OUT' });
      }
    },
  );

  // Stock ADJUST
  app.post(
    '/api/stock/adjust',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }
        const userId = dbUser.id;
        const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

        const bodySchema = z.object({
          itemId: z.string(),
          warehouseId: z.string(),
          quantity: z.number().int(),
          batchId: z.string().optional(),
          reference: z.string().optional(),
          reason: z.string().min(1, 'Reason is required for adjustments'),
          metadata: z.any().optional(),
        });

        const data = bodySchema.parse(req.body);

        const item = await storage.getItem(data.itemId);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }

        const warehouse = await storage.getWarehouse(data.warehouseId);
        if (!warehouse) {
          return res.status(404).json({ message: 'Warehouse not found' });
        }

        if (data.batchId) {
          const batch = await storage.getBatch(data.batchId);
          if (!batch) {
            return res.status(404).json({ message: 'Batch not found' });
          }

          const newQuantity = batch.quantity + data.quantity;
          if (newQuantity < 0) {
            return res.status(400).json({ message: 'Adjustment would result in negative stock' });
          }

          await storage.updateBatch(data.batchId, {
            quantity: newQuantity,
          });
        }

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
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error processing stock ADJUST:', error);
        res.status(500).json({ message: 'Failed to process stock ADJUST' });
      }
    },
  );

  /* ──────────────────────────────────────────
     LEDGER INTEGRITY
  ─────────────────────────────────────────── */

  app.get('/api/ledger/verify', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const entries = await storage.getLedgerEntries({});

      entries.sort(
        (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      let isValid = true;
      let expectedPreviousHash: string | null = null;
      const errors: string[] = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (entry.previousHash !== expectedPreviousHash) {
          isValid = false;
          errors.push(`Entry ${entry.id} at index ${i}: previousHash mismatch`);
        }

        expectedPreviousHash = calculateHash(entry);
      }

      res.json({
        isValid,
        totalEntries: entries.length,
        errors,
      });
    } catch (error) {
      console.error('Error verifying ledger:', error);
      res.status(500).json({ message: 'Failed to verify ledger' });
    }
  });

  /* ──────────────────────────────────────────
     TRANSFERS
  ─────────────────────────────────────────── */

  app.get('/api/transfers', authMiddleware, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const warehouseId = req.query.warehouseId as string | undefined;

      const transfers = await storage.getTransfers({ status, warehouseId });
      res.json(transfers);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      res.status(500).json({ message: 'Failed to fetch transfers' });
    }
  });

  app.get('/api/transfers/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
      const transfer = await storage.getTransfer(req.params.id);
      if (!transfer) {
        return res.status(404).json({ message: 'Transfer not found' });
      }
      res.json(transfer);
    } catch (error) {
      console.error('Error fetching transfer:', error);
      res.status(500).json({ message: 'Failed to fetch transfer' });
    }
  });

  app.post(
    '/api/transfers',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }

        const data = insertTransferSchema.parse({ ...req.body, requestedBy: dbUser.id });
        const transfer = await storage.createTransfer(data);
        res.json(transfer);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error creating transfer:', error);
        res.status(500).json({ message: 'Failed to create transfer' });
      }
    },
  );

  app.patch(
    '/api/transfers/:id/approve',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }

        const transfer = await storage.getTransfer(req.params.id);
        if (!transfer) {
          return res.status(404).json({ message: 'Transfer not found' });
        }

        if (transfer.status !== 'pending') {
          return res.status(400).json({ message: 'Transfer is not pending' });
        }

        const updateData = updateTransferSchema.parse({
          status: 'approved',
          approvedBy: dbUser.id,
        });

        await storage.updateTransfer(req.params.id, updateData);

        res.json({ message: 'Transfer approved' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: 'Validation error', errors: error.errors });
        }
        console.error('Error approving transfer:', error);
        res.status(500).json({ message: 'Failed to approve transfer' });
      }
    },
  );

  app.patch(
    '/api/transfers/:id/complete',
    requireRole('admin', 'manager'),
    async (req: Request, res: Response) => {
      try {
        const authReq = req as any;
        const dbUser = await storage.getUser(authReq.user.id);
        if (!dbUser) {
          return res.status(401).json({ message: 'User not found' });
        }
        const userId = dbUser.id;
        const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

        const transfer = await storage.getTransfer(req.params.id);
        if (!transfer) {
          return res.status(404).json({ message: 'Transfer not found' });
        }

        if (transfer.status !== 'approved' && transfer.status !== 'in_transit') {
          return res.status(400).json({ message: 'Transfer must be approved first' });
        }

        if (transfer.serialId) {
          await storage.updateSerial(transfer.serialId, {
            warehouseId: transfer.toWarehouseId,
          });
        } else if (transfer.batchId) {
          const fromBatch = await storage.getBatch(transfer.batchId);
          if (fromBatch) {
            await storage.updateBatch(transfer.batchId, {
              quantity: fromBatch.quantity - transfer.quantity,
            });

            const toBatches = await storage.getBatches(transfer.itemId);
            const toBatch = toBatches.find(
              (b: any) =>
                b.warehouseId === transfer.toWarehouseId && b.batchNumber === fromBatch.batchNumber,
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

        const updateData = updateTransferSchema.parse({
          status: 'completed',
          completedAt: new Date(),
        });

        await storage.updateTransfer(req.params.id, updateData);

        res.json({ message: 'Transfer completed' });
      } catch (error) {
        console.error('Error completing transfer:', error);
        res.status(500).json({ message: 'Failed to complete transfer' });
      }
    },
  );

  /* ──────────────────────────────────────────
     QR LOOKUP
  ─────────────────────────────────────────── */

  app.get('/api/lookup/:code', authMiddleware, async (req: Request, res: Response) => {
    try {
      const code = req.params.code;

      const serial = await storage.getSerialByNumber(code);
      if (serial) {
        const item = await storage.getItem(serial.itemId);
        return res.json({ type: 'serial', serial, item });
      }

      const item = await storage.getItemBySku(code);
      if (item) {
        const serials = await storage.getSerials(item.id);
        const batches = await storage.getBatches(item.id);
        return res.json({ type: 'item', item, serials, batches });
      }

      res.status(404).json({ message: 'Not found' });
    } catch (error) {
      console.error('Error looking up code:', error);
      res.status(500).json({ message: 'Lookup failed' });
    }
  });

  /* ──────────────────────────────────────────
     CONSUMPTION (sell / loan / consume)
  ─────────────────────────────────────────── */

  app.post('/api/consume', authMiddleware, async (req: Request, res: Response) => {
    try {
      const consumeSchema = z.object({
        code: z.string().min(1, 'Code is required'),
        action: z.enum(['sell', 'loan', 'consume'], {
          errorMap: () => ({ message: 'Invalid action type' }),
        }),
        assignedToId: z.string().optional(),
      });

      const data = consumeSchema.parse(req.body);
      const { code, action, assignedToId } = data;

      const authReq = req as any;
      const dbUser = await storage.getUser(authReq.user.id);
      if (!dbUser) {
        return res.status(401).json({ message: 'User not found' });
      }
      const userId = dbUser.id;
      const userName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim();

      const serial = await storage.getSerialByNumber(code);
      if (serial) {
        const item = await storage.getItem(serial.itemId);
        if (!item) {
          return res.status(404).json({ message: 'Item not found' });
        }

        const expectedAction =
          item.consumptionType === 'sellable'
            ? 'sell'
            : item.consumptionType === 'loanable'
            ? 'loan'
            : 'consume';

        if (action !== expectedAction) {
          return res.status(400).json({
            message: `Invalid action. This item is ${item.consumptionType}, expected action: ${expectedAction}`,
          });
        }

        if (serial.status === 'retired') {
          return res.status(400).json({ message: 'This serial has already been retired/consumed' });
        }

        if (action === 'loan' && !assignedToId) {
          return res.status(400).json({ message: 'User assignment required for loanable items' });
        }

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
          return res.json({
            success: true,
            message: `${item.name} (${serial.serialNumber}) marked as sold`,
            item,
          });
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
          return res.json({
            success: true,
            message: `${item.name} (${serial.serialNumber}) loaned to user`,
            item,
          });
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
          return res.json({
            success: true,
            message: `${item.name} (${serial.serialNumber}) marked as consumed`,
            item,
          });
        }
      }

      // Non-serialized via SKU
      const item = await storage.getItemBySku(code);
      if (item) {
        if (item.type === 'serialized') {
          return res.status(400).json({
            message: `This is a serialized item. Please scan or enter a specific serial number, not the SKU.`,
          });
        }

        const expectedAction =
          item.consumptionType === 'sellable'
            ? 'sell'
            : item.consumptionType === 'loanable'
            ? 'loan'
            : 'consume';

        if (action !== expectedAction) {
          return res.status(400).json({
            message: `Invalid action. This item is ${item.consumptionType}, expected action: ${expectedAction}`,
          });
        }

        const batches = await storage.getBatches(item.id);
        if (!batches || batches.length === 0) {
          return res.status(400).json({ message: 'No stock available for this item' });
        }

        const batch = batches[0];

        const reason =
          action === 'sell'
            ? `Sold - SKU ${item.sku}`
            : action === 'loan'
            ? `Loaned - SKU ${item.sku}`
            : `Consumed - SKU ${item.sku}`;

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

        const actionPastTense =
          action === 'sell' ? 'sold' : action === 'loan' ? 'loaned' : 'consumed';

        return res.json({
          success: true,
          message: `${item.name} marked as ${actionPastTense}`,
          item,
        });
      }

      return res.status(404).json({ message: 'Item or serial not found' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error consuming item:', error);
      return res.status(500).json({ message: 'Consumption failed' });
    }
  });

  /* ────────────────────────────────────────── */

  const httpServer = createServer(app);
  return httpServer;
}
