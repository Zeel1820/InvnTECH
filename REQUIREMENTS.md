# InvenTECH - System Requirements & Architecture Document

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Database Schema](#database-schema)
4. [Core Workflows](#core-workflows)
5. [Business Logic & Rules](#business-logic--rules)
6. [API Endpoints](#api-endpoints)
7. [Security Model](#security-model)
8. [Technical Architecture](#technical-architecture)

---

## System Overview

**InvenTECH** is an enterprise-grade Progressive Web Application (PWA) for mobile-first inventory management. The system tracks both serialized items (individual assets with unique serial numbers) and non-serialized inventory (batch/lot-based stock) across multiple warehouse locations.

### Key Features
- **Dual Tracking Modes**: Serialized (1:1 tracking) and Non-Serialized (batch/quantity tracking)
- **Multi-Warehouse Management**: Multiple physical locations with manager assignments
- **Immutable Audit Trail**: SHA-256 hash-chained ledger for all stock movements
- **QR Code Integration**: JWT-secured QR codes for asset tracking
- **Role-Based Access Control**: Three-tier permission system (Admin, Manager, Staff)
- **Mobile-First Design**: Material Design with bottom navigation for warehouse operations

---

## User Roles & Permissions

### Admin
**Full System Access**
- ✅ Create, edit, delete all items
- ✅ Create, edit, delete all warehouses
- ✅ Assign managers to warehouses
- ✅ View all ledger entries and verify chain integrity
- ✅ Perform all stock operations (IN/OUT/ADJUST)
- ✅ Initiate and approve transfers
- ✅ Access all reports and analytics
- ✅ Manage user accounts (via authentication system)

### Manager
**Assigned Warehouse Access**
- ✅ Create, edit items
- ✅ View assigned warehouses only
- ✅ Perform stock operations in assigned warehouses
- ✅ Initiate transfers from assigned warehouses
- ✅ Approve transfers to assigned warehouses
- ✅ View ledger entries for assigned warehouses
- ⛔ Cannot delete items
- ⛔ Cannot create/edit/delete warehouses
- ⛔ Cannot assign managers
- ⛔ Cannot verify ledger integrity

### Staff
**Read-Only with Limited Operations**
- ✅ View all items (read-only)
- ✅ View all warehouses (read-only)
- ✅ View ledger entries (read-only)
- ✅ Scan QR codes
- ✅ View reports
- ⛔ Cannot create, edit, or delete items
- ⛔ Cannot perform stock operations
- ⛔ Cannot initiate or approve transfers
- ⛔ Cannot manage warehouses

---

## Database Schema

### Core Tables

#### 1. **users**
User accounts with role-based access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY | User ID (from OIDC provider) |
| email | varchar | UNIQUE, NOT NULL | User email address |
| firstName | varchar | NOT NULL | User's first name |
| lastName | varchar | NOT NULL | User's last name |
| role | varchar | NOT NULL, DEFAULT 'staff' | Role: admin, manager, staff |
| isActive | boolean | DEFAULT true | Account active status |
| createdAt | timestamp | DEFAULT now() | Account creation timestamp |
| updatedAt | timestamp | DEFAULT now() | Last update timestamp |

**Relationships:**
- One-to-Many: users → ledger (via createdBy)
- One-to-Many: users → managerWarehouses (via managerId)

---

#### 2. **warehouses**
Physical storage locations for inventory.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique warehouse identifier |
| name | varchar | NOT NULL | Warehouse name |
| location | varchar | | Physical address/location |
| description | text | | Additional warehouse details |
| isActive | boolean | DEFAULT true | Warehouse active status |
| createdAt | timestamp | DEFAULT now() | Creation timestamp |
| updatedAt | timestamp | DEFAULT now() | Last update timestamp |
| updatedBy | varchar | FK → users.id | User who last updated |
| deletedAt | timestamp | | Soft delete timestamp |

**Relationships:**
- One-to-Many: warehouses → items (via defaultWarehouseId)
- One-to-Many: warehouses → managerWarehouses (via warehouseId)
- One-to-Many: warehouses → ledger (via warehouseId)
- One-to-Many: warehouses → serials (via warehouseId)
- One-to-Many: warehouses → batches (via warehouseId)

**Indexes:**
- `idx_warehouses_active` on (isActive, deletedAt) for active warehouse queries

---

#### 3. **managerWarehouses**
Junction table mapping managers to their assigned warehouses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique assignment identifier |
| managerId | varchar | FK → users.id, NOT NULL | Manager user ID |
| warehouseId | varchar | FK → warehouses.id, NOT NULL | Warehouse ID |
| assignedAt | timestamp | DEFAULT now() | Assignment timestamp |

**Relationships:**
- Many-to-One: managerWarehouses → users (via managerId)
- Many-to-One: managerWarehouses → warehouses (via warehouseId)

**Constraints:**
- UNIQUE (managerId, warehouseId) - prevents duplicate assignments

---

#### 4. **items**
Master data for inventory items (both serialized and non-serialized).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique item identifier |
| sku | varchar | UNIQUE, NOT NULL | Stock Keeping Unit (auto-generated if empty) |
| name | varchar | NOT NULL | Item name |
| description | text | | Detailed item description |
| type | varchar | NOT NULL | 'serialized' or 'non-serialized' |
| category | varchar | | Item category (e.g., electronics, supplies) |
| uom | varchar | | Unit of Measure (e.g., pieces, boxes, kg) |
| reorderLevel | integer | | Minimum stock level before reorder alert |
| defaultWarehouseId | varchar | FK → warehouses.id | Default storage warehouse |
| isActive | boolean | DEFAULT true | Item active status |
| createdAt | timestamp | DEFAULT now() | Creation timestamp |
| updatedAt | timestamp | DEFAULT now() | Last update timestamp |
| updatedBy | varchar | FK → users.id | User who last updated |
| deletedAt | timestamp | | Soft delete timestamp |

**Relationships:**
- One-to-Many: items → serials (via itemId)
- One-to-Many: items → batches (via itemId)
- One-to-Many: items → ledger (via itemId)
- Many-to-One: items → warehouses (via defaultWarehouseId)

**Business Rules:**
- SKU is auto-generated if not provided: `{NAME_PREFIX}-{TIMESTAMP}-{RANDOM}`
- Type cannot be changed after creation (serialized ↔ non-serialized conversion not allowed)
- Soft delete: `deletedAt` is set instead of physical deletion

---

#### 5. **serials**
Individual serialized items with unique serial numbers and lifecycle tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique serial record identifier |
| itemId | varchar | FK → items.id, NOT NULL | Parent item reference |
| serialNumber | varchar | UNIQUE, NOT NULL | Unique serial number |
| status | varchar | NOT NULL, DEFAULT 'in_stock' | Current lifecycle status |
| warehouseId | varchar | FK → warehouses.id | Current storage location |
| purchaseDate | date | | Date of purchase |
| purchasePrice | decimal(10,2) | | Purchase price |
| warrantyExpiry | date | | Warranty expiration date |
| notes | text | | Additional notes |
| isActive | boolean | DEFAULT true | Serial active status |
| createdAt | timestamp | DEFAULT now() | Creation timestamp |
| updatedAt | timestamp | DEFAULT now() | Last update timestamp |
| updatedBy | varchar | FK → users.id | User who last updated |
| deletedAt | timestamp | | Soft delete timestamp |

**Status Lifecycle:**
- `in_stock`: Available in warehouse
- `issued`: Assigned to user/location
- `under_repair`: Being repaired
- `retired`: Permanently out of service
- `lost`: Missing/unaccounted for

**Relationships:**
- Many-to-One: serials → items (via itemId)
- Many-to-One: serials → warehouses (via warehouseId)
- One-to-Many: serials → ledger (via serialId)

**Business Rules:**
- Can only exist for items with `type = 'serialized'`
- Serial number must be unique across entire system
- Status changes must be logged in ledger
- QR code contains JWT-signed token with serial ID

---

#### 6. **batches**
Non-serialized inventory with batch/lot tracking and quantity management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique batch identifier |
| itemId | varchar | FK → items.id, NOT NULL | Parent item reference |
| batchNumber | varchar | NOT NULL | Batch/Lot number |
| quantity | integer | NOT NULL, DEFAULT 0 | Current quantity |
| warehouseId | varchar | FK → warehouses.id, NOT NULL | Storage location |
| manufactureDate | date | | Manufacturing date |
| expiryDate | date | | Expiration date |
| supplier | varchar | | Supplier name |
| cost | decimal(10,2) | | Cost per unit |
| notes | text | | Additional notes |
| isActive | boolean | DEFAULT true | Batch active status |
| createdAt | timestamp | DEFAULT now() | Creation timestamp |
| updatedAt | timestamp | DEFAULT now() | Last update timestamp |
| updatedBy | varchar | FK → users.id | User who last updated |
| deletedAt | timestamp | | Soft delete timestamp |

**Relationships:**
- Many-to-One: batches → items (via itemId)
- Many-to-One: batches → warehouses (via warehouseId)
- One-to-Many: batches → ledger (via batchId)

**Business Rules:**
- Can only exist for items with `type = 'non-serialized'`
- Quantity must be >= 0 (enforced by business logic)
- Batch number must be unique per item
- Expiry date tracking for FIFO/LIFO/FEFO inventory management
- QR code contains JWT-signed token with batch ID

---

#### 7. **ledger**
Immutable audit trail for all stock movements with SHA-256 hash chain.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique ledger entry identifier |
| itemId | varchar | FK → items.id, NOT NULL | Item being moved |
| action | varchar | NOT NULL | Action type: 'in', 'out', 'adjust', 'transfer' |
| quantity | integer | NOT NULL | Quantity moved (positive or negative) |
| warehouseId | varchar | FK → warehouses.id, NOT NULL | Source/destination warehouse |
| serialId | varchar | FK → serials.id | Serial reference (for serialized items) |
| batchId | varchar | FK → batches.id | Batch reference (for non-serialized items) |
| transferId | varchar | FK → transfers.id | Transfer reference (for transfers) |
| reason | text | | Reason for stock movement |
| referenceNumber | varchar | | External reference (PO, invoice, etc.) |
| previousHash | varchar | | SHA-256 hash of previous ledger entry |
| currentHash | varchar | NOT NULL | SHA-256 hash of this entry |
| createdBy | varchar | FK → users.id, NOT NULL | User who created entry |
| createdAt | timestamp | DEFAULT now() | Entry creation timestamp |

**Hash Chain Structure:**
```
currentHash = SHA256(
  id + itemId + action + quantity + warehouseId + 
  serialId + batchId + transferId + reason + referenceNumber + 
  previousHash + createdBy + createdAt
)
```

**Relationships:**
- Many-to-One: ledger → items (via itemId)
- Many-to-One: ledger → warehouses (via warehouseId)
- Many-to-One: ledger → serials (via serialId)
- Many-to-One: ledger → batches (via batchId)
- Many-to-One: ledger → users (via createdBy)
- Many-to-One: ledger → transfers (via transferId)

**Business Rules:**
- **Immutable**: Entries can NEVER be updated or deleted
- **Hash Chain**: Each entry links to previous entry via hash
- First entry has `previousHash = null`
- All writes MUST use `createLedgerEntryWithHash()` helper
- Chain integrity verified via `/api/ledger/verify` (admin only)

**Action Types:**
- `in`: Stock received into warehouse
- `out`: Stock issued/removed from warehouse
- `adjust`: Inventory adjustment (stocktake correction)
- `transfer`: Stock moved between warehouses

---

#### 8. **transfers**
Stock transfer requests between warehouses with approval workflow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, DEFAULT uuid | Unique transfer identifier |
| itemId | varchar | FK → items.id, NOT NULL | Item being transferred |
| fromWarehouseId | varchar | FK → warehouses.id, NOT NULL | Source warehouse |
| toWarehouseId | varchar | FK → warehouses.id, NOT NULL | Destination warehouse |
| quantity | integer | NOT NULL | Quantity to transfer |
| serialId | varchar | FK → serials.id | Serial reference (for serialized items) |
| batchId | varchar | FK → batches.id | Batch reference (for non-serialized items) |
| status | varchar | NOT NULL, DEFAULT 'pending' | Transfer status |
| requestedBy | varchar | FK → users.id, NOT NULL | User who requested transfer |
| approvedBy | varchar | FK → users.id | User who approved transfer |
| rejectedBy | varchar | FK → users.id | User who rejected transfer |
| completedBy | varchar | FK → users.id | User who completed transfer |
| rejectionReason | text | | Reason for rejection |
| notes | text | | Additional transfer notes |
| createdAt | timestamp | DEFAULT now() | Request creation timestamp |
| approvedAt | timestamp | | Approval timestamp |
| rejectedAt | timestamp | | Rejection timestamp |
| completedAt | timestamp | | Completion timestamp |

**Status Lifecycle:**
1. `pending`: Transfer requested, awaiting approval
2. `approved`: Approved by destination manager/admin
3. `rejected`: Rejected by destination manager/admin
4. `completed`: Stock physically transferred and recorded

**Relationships:**
- Many-to-One: transfers → items (via itemId)
- Many-to-One: transfers → warehouses (via fromWarehouseId)
- Many-to-One: transfers → warehouses (via toWarehouseId)
- Many-to-One: transfers → serials (via serialId)
- Many-to-One: transfers → batches (via batchId)
- One-to-Many: transfers → ledger (via transferId)

**Business Rules:**
- Upon completion, creates TWO ledger entries:
  1. OUT from source warehouse
  2. IN to destination warehouse
- Both ledger entries share same `transferId` for traceability
- Managers can only approve transfers TO their assigned warehouses
- Source and destination warehouses must be different
- Quantity must match serial (1) or batch availability

---

#### 9. **sessions**
PostgreSQL-backed session storage for authentication (managed by `connect-pg-simple`).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| sid | varchar | PRIMARY KEY | Session ID |
| sess | json | NOT NULL | Session data |
| expire | timestamp | NOT NULL | Session expiration time |

**Business Rules:**
- Sessions expire after 7 days of inactivity
- Automatic cleanup of expired sessions
- Stores user authentication state from OIDC provider

---

## Core Workflows

### 1. User Authentication & Session Management

**Login Flow:**
1. User clicks "Sign In" on landing page
2. Browser redirects to OIDC provider (Replit Auth)
3. User authenticates with provider
4. Provider redirects back with authorization code
5. Backend exchanges code for user claims (id, email, name)
6. System checks if user exists:
   - **New User**: Create user record with default role 'staff'
   - **Existing User**: Update profile from claims
7. Create session in PostgreSQL with 7-day expiry
8. Redirect to Dashboard

**Session Management:**
- Sessions stored in PostgreSQL via `connect-pg-simple`
- HTTP-only cookies prevent XSS attacks
- CSRF tokens protect state-changing requests
- Session refresh on activity (rolling expiry)

---

### 2. Item Management Workflow

#### Creating Items

**Admin/Manager Flow:**
1. Navigate to Items page
2. Click "Add Item" button
3. Fill in item form:
   - **Name**: Required (e.g., "MacBook Pro 16-inch")
   - **SKU**: Optional (auto-generated if empty)
   - **Type**: Serialized or Non-Serialized (cannot change later)
   - **Category**: Optional (e.g., "Laptops")
   - **Description**: Optional
   - **Reorder Level**: Optional (triggers low-stock alerts)
4. Submit form
5. Backend validation:
   - SKU uniqueness check
   - Required fields validation
   - Type must be valid enum value
6. If SKU empty, auto-generate: `{NAME_PREFIX}-{TIMESTAMP}-{RANDOM}`
7. Insert into `items` table with `createdBy = current_user`
8. Return created item to frontend
9. Update UI with new item in list

**Business Logic:**
```typescript
// SKU Generation Algorithm
function generateSKU(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
// Example: "MacBook Pro" → "MAC-234567-A8F"
```

#### Editing Items

**Admin/Manager Flow:**
1. Click "Edit" button on item card
2. Form pre-populated with current values
3. Make changes (cannot change type)
4. Submit form
5. Backend updates item with `updatedBy = current_user`, `updatedAt = now()`
6. Return updated item
7. UI refreshes item list

**Restrictions:**
- `type` field is read-only after creation
- Cannot change SKU if already assigned to serials/batches
- Staff users cannot edit items

#### Deleting Items

**Admin-Only Flow:**
1. Click "Delete" button on item card
2. Confirmation dialog: "Are you sure you want to delete [Item Name]?"
3. User confirms deletion
4. Backend performs soft delete:
   - Set `deletedAt = now()`
   - Set `isActive = false`
5. Item removed from UI list
6. Item still exists in database for audit trail

**Restrictions:**
- Only admins can delete items
- Cannot delete if active serials/batches exist
- Soft delete preserves historical ledger references

---

### 3. Stock Operations Workflow

#### Stock IN (Receiving Inventory)

**Admin/Manager Flow:**
1. Navigate to item detail or stock operations page
2. Select "Receive Stock" action
3. Fill in form:
   - **Item**: Select from dropdown
   - **Warehouse**: Select destination warehouse
   - **Quantity**: Number of units received
   - **For Serialized**: Enter serial number(s)
   - **For Non-Serialized**: Select/create batch
   - **Reference Number**: Optional (PO number, invoice)
   - **Reason**: Optional notes
4. Submit form
5. Backend processing:
   - **Serialized Items**:
     - Create `serials` record with status 'in_stock'
     - Generate QR code with JWT token
   - **Non-Serialized Items**:
     - Create/update `batches` record
     - Increment batch quantity
     - Generate QR code for batch
   - Create ledger entry:
     ```typescript
     {
       action: 'in',
       quantity: +quantity,
       warehouseId: warehouseId,
       reason: reason,
       referenceNumber: referenceNumber
     }
     ```
   - Calculate and store hash chain
6. Return confirmation with QR code
7. UI displays success message and QR code for printing

**Hash Chain Example:**
```
Entry 1 (First): previousHash = null
  currentHash = SHA256(id + itemId + 'in' + 50 + warehouse1 + ... + null + userId + timestamp)
  
Entry 2: previousHash = Entry1.currentHash
  currentHash = SHA256(id + itemId + 'in' + 30 + warehouse2 + ... + Entry1.currentHash + userId + timestamp)
```

#### Stock OUT (Issuing Inventory)

**Admin/Manager Flow:**
1. Select "Issue Stock" action
2. Fill in form:
   - **Item**: Select from dropdown
   - **Warehouse**: Select source warehouse
   - **Quantity**: Number of units to issue
   - **For Serialized**: Select serial number(s)
   - **For Non-Serialized**: Select batch (FIFO/LIFO/FEFO)
   - **Reference Number**: Optional (work order, assignment)
   - **Reason**: Required (e.g., "Assigned to employee", "Used in project")
3. Submit form
4. Backend validation:
   - Check sufficient stock available
   - For serials: verify status is 'in_stock'
   - For batches: verify quantity >= requested
5. Backend processing:
   - **Serialized Items**:
     - Update serial status to 'issued'
   - **Non-Serialized Items**:
     - Decrement batch quantity
     - If quantity reaches 0, mark batch as depleted
   - Create ledger entry:
     ```typescript
     {
       action: 'out',
       quantity: -quantity, // Negative to indicate outgoing
       warehouseId: warehouseId,
       reason: reason
     }
     ```
6. Return confirmation
7. UI displays success message

**Validation Rules:**
```typescript
// Insufficient Stock Check
if (action === 'out' || action === 'adjust') {
  const currentStock = await calculateCurrentStock(itemId, warehouseId);
  if (currentStock + quantity < 0) {
    throw new Error('Insufficient stock for this operation');
  }
}
```

#### Stock ADJUST (Inventory Correction)

**Admin/Manager Flow:**
1. Select "Adjust Stock" action
2. Fill in form:
   - **Item**: Select from dropdown
   - **Warehouse**: Select warehouse
   - **Adjustment**: Positive (increase) or negative (decrease)
   - **Reason**: Required (e.g., "Stocktake correction", "Damaged goods")
3. Submit form
4. Backend processing:
   - Validate adjustment won't create negative stock
   - Update batch quantity or serial status
   - Create ledger entry:
     ```typescript
     {
       action: 'adjust',
       quantity: adjustmentAmount, // Can be + or -
       warehouseId: warehouseId,
       reason: reason
     }
     ```
5. Return confirmation

**Use Cases:**
- Stocktake discrepancies
- Damaged/lost inventory write-off
- Found inventory write-on
- Expiry date write-offs

---

### 4. Transfer Workflow

#### Initiating Transfer

**Manager/Admin Flow:**
1. Navigate to item detail or transfers page
2. Click "Transfer Stock"
3. Fill in form:
   - **Item**: Select from dropdown
   - **From Warehouse**: Select source warehouse (must be assigned to user if manager)
   - **To Warehouse**: Select destination warehouse
   - **Quantity**: Number of units to transfer
   - **For Serialized**: Select serial number
   - **For Non-Serialized**: Select batch
   - **Notes**: Optional transfer reason
4. Submit form
5. Backend validation:
   - Verify user has permission to transfer from source warehouse
   - Check stock availability
   - Ensure source ≠ destination
6. Create transfer record with status 'pending'
7. Notify destination warehouse manager (future: email/push notification)
8. Return confirmation

#### Approving Transfer

**Destination Manager/Admin Flow:**
1. Navigate to Transfers page
2. View pending transfers for assigned warehouses
3. Select transfer request
4. Review details:
   - Item information
   - Requested quantity
   - Source warehouse
   - Requestor name
   - Request date
5. Click "Approve" or "Reject"
6. If rejecting, provide reason
7. Backend processing:
   - **If Approved**:
     - Update transfer status to 'approved'
     - Set `approvedBy = current_user`, `approvedAt = now()`
   - **If Rejected**:
     - Update transfer status to 'rejected'
     - Set `rejectedBy = current_user`, `rejectedAt = now()`
     - Record rejection reason
8. Notify requester of decision

#### Completing Transfer

**Source Warehouse Staff Flow:**
1. View approved transfers
2. Physically move stock
3. Click "Complete Transfer"
4. Backend processing:
   - Verify transfer is approved
   - Create TWO linked ledger entries:
     ```typescript
     // Entry 1: OUT from source
     {
       action: 'transfer',
       quantity: -quantity,
       warehouseId: fromWarehouseId,
       transferId: transferId,
       serialId/batchId: ...
     }
     
     // Entry 2: IN to destination
     {
       action: 'transfer',
       quantity: +quantity,
       warehouseId: toWarehouseId,
       transferId: transferId,
       serialId/batchId: ...
     }
     ```
   - Update serial warehouse or batch warehouse
   - Update transfer status to 'completed'
   - Set `completedBy = current_user`, `completedAt = now()`
5. Both ledger entries maintain hash chain integrity
6. Return confirmation

**Transfer States Diagram:**
```
pending → approved → completed
   ↓
rejected (terminal state)
```

---

### 5. QR Code Workflow

#### QR Code Generation

**Backend Process:**
1. When serial or batch is created, generate JWT token:
   ```typescript
   const token = jwt.sign({
     type: 'serial', // or 'batch'
     id: serialId,
     itemId: itemId,
     sku: sku,
     iat: Date.now()
   }, SESSION_SECRET, { expiresIn: '10y' });
   ```
2. QR code content = JWT token (not plain ID)
3. Frontend renders QR code using `qrcode.react`
4. User can print QR code label

**Security Benefits:**
- QR code cannot be tampered with (JWT signature)
- Contains metadata for offline lookup
- Expiry prevents stale codes (optional)
- Secret key prevents forgery

#### QR Code Scanning

**Staff Flow:**
1. Navigate to Scanner page
2. Grant camera permission
3. Point camera at QR code
4. Scanner decodes JWT token
5. Frontend verifies JWT signature
6. Extract item/serial/batch ID from token
7. Fetch full details from backend:
   ```typescript
   GET /api/serials/{id}
   // or
   GET /api/batches/{id}
   ```
8. Display item information:
   - Item name and SKU
   - Serial number or batch number
   - Current warehouse location
   - Status
   - Recent ledger history
9. Options to perform actions (if permitted):
   - Issue stock
   - Adjust stock
   - Initiate transfer

**Manual Entry Fallback:**
- If camera unavailable, user can manually type serial/batch number
- Same lookup and display flow

---

### 6. Dashboard Workflow

**User Access:**
1. User logs in and redirects to Dashboard
2. Backend fetches role-based data:
   - **Admin**: All items, all warehouses, all ledger entries
   - **Manager**: All items, assigned warehouses, all ledger entries (MVP: global)
   - **Staff**: All items (read-only), all warehouses (read-only), all ledger entries (read-only)
3. Dashboard displays four stat cards:

#### Total Items Card
```typescript
const totalItems = items.filter(i => i.isActive && !i.deletedAt).length;
```

#### Activity Card
```typescript
const activityCount = ledgerEntries.length; // All ledger movements
```

#### Warehouses Card
```typescript
// Admin/Staff: All active warehouses
const warehouseCount = warehouses.filter(w => w.isActive).length;

// Manager: Only assigned warehouses (backend filters by managerWarehouses)
const warehouseCount = warehouses.length; // Already filtered server-side
```

#### This Month Card
```typescript
const thisMonthCount = ledgerEntries.filter(entry => {
  return entry.action === 'in' && 
         new Date(entry.createdAt).getMonth() === new Date().getMonth();
}).length;
```

#### Recent Activity Feed
- Display last 3 ledger entries
- Show: Item name, action, quantity, warehouse, timestamp
- Color-coded by action type:
  - IN: Green
  - OUT: Red
  - ADJUST: Yellow
  - TRANSFER: Blue

---

## Business Logic & Rules

### Inventory Calculation

**Current Stock Formula:**
```typescript
function calculateCurrentStock(itemId: string, warehouseId: string): number {
  // For non-serialized items:
  const ledgerEntries = await getLedgerEntries(itemId, warehouseId);
  const stock = ledgerEntries.reduce((sum, entry) => sum + entry.quantity, 0);
  return stock;
  
  // For serialized items:
  const serials = await getSerials(itemId, warehouseId, status: 'in_stock');
  return serials.length;
}
```

### Negative Stock Prevention

```typescript
// Before any OUT or ADJUST operation:
const currentStock = await calculateCurrentStock(itemId, warehouseId);
const newStock = currentStock + quantity; // quantity is negative for OUT

if (newStock < 0) {
  throw new Error(`Insufficient stock. Current: ${currentStock}, Requested: ${Math.abs(quantity)}`);
}
```

### Hash Chain Validation

```typescript
async function verifyLedgerIntegrity(): Promise<{ valid: boolean; errors: string[] }> {
  const entries = await getAllLedgerEntriesSortedByDate();
  const errors = [];
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPreviousHash = i === 0 ? null : entries[i - 1].currentHash;
    
    // Check 1: Previous hash link
    if (entry.previousHash !== expectedPreviousHash) {
      errors.push(`Entry ${entry.id}: Previous hash mismatch`);
    }
    
    // Check 2: Recalculate current hash
    const calculatedHash = calculateHash(entry);
    if (entry.currentHash !== calculatedHash) {
      errors.push(`Entry ${entry.id}: Current hash invalid`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### Auto-SKU Generation

```typescript
function generateSKU(itemName: string): string {
  // Extract first 3 characters from name
  const prefix = itemName
    .replace(/[^a-zA-Z0-9]/g, '') // Remove special chars
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, 'X'); // Pad if name too short
  
  // Last 6 digits of timestamp
  const timestamp = Date.now().toString().slice(-6);
  
  // 3 random alphanumeric characters
  const random = Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase();
  
  return `${prefix}-${timestamp}-${random}`;
}

// Examples:
// "MacBook Pro" → "MAC-789456-A8F"
// "Pencils" → "PEN-123789-K2M"
// "USB Cable" → "USB-456123-Q9P"
```

### Batch FIFO/FEFO Selection

```typescript
// FIFO: First In, First Out
function selectBatchFIFO(itemId: string, warehouseId: string): Batch {
  const batches = await getBatchesByWarehouse(itemId, warehouseId);
  return batches.sort((a, b) => a.createdAt - b.createdAt)[0];
}

// FEFO: First Expired, First Out
function selectBatchFEFO(itemId: string, warehouseId: string): Batch {
  const batches = await getBatchesByWarehouse(itemId, warehouseId);
  return batches
    .filter(b => b.expiryDate)
    .sort((a, b) => a.expiryDate - b.expiryDate)[0];
}

// LIFO: Last In, First Out
function selectBatchLIFO(itemId: string, warehouseId: string): Batch {
  const batches = await getBatchesByWarehouse(itemId, warehouseId);
  return batches.sort((a, b) => b.createdAt - a.createdAt)[0];
}
```

### Role-Based Query Filtering

```typescript
// Warehouse filtering for managers
async function getWarehousesByUser(userId: string, role: string) {
  if (role === 'admin' || role === 'staff') {
    // Return all active warehouses
    return await db.select()
      .from(warehouses)
      .where(eq(warehouses.isActive, true));
  }
  
  if (role === 'manager') {
    // Return only assigned warehouses
    return await db.select()
      .from(warehouses)
      .innerJoin(managerWarehouses, eq(warehouses.id, managerWarehouses.warehouseId))
      .where(
        and(
          eq(managerWarehouses.managerId, userId),
          eq(warehouses.isActive, true)
        )
      );
  }
}
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/auth/user` | Public | Get current authenticated user |
| GET | `/auth/login` | Public | Initiate OIDC login flow |
| GET | `/auth/callback` | Public | OIDC callback handler |
| POST | `/auth/logout` | Authenticated | Logout and destroy session |

### Items

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/items` | Authenticated | List all active items |
| GET | `/api/items/:id` | Authenticated | Get single item by ID |
| POST | `/api/items` | Admin, Manager | Create new item |
| PATCH | `/api/items/:id` | Admin, Manager | Update item |
| DELETE | `/api/items/:id` | Admin | Soft delete item |

### Warehouses

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/warehouses` | Authenticated | List warehouses (role-filtered) |
| GET | `/api/warehouses/:id` | Authenticated | Get single warehouse by ID |
| POST | `/api/warehouses` | Admin | Create new warehouse |
| PATCH | `/api/warehouses/:id` | Admin | Update warehouse |
| DELETE | `/api/warehouses/:id` | Admin | Soft delete warehouse |
| POST | `/api/warehouses/:id/managers` | Admin | Assign manager to warehouse |

### Ledger

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/ledger` | Authenticated | List all ledger entries |
| POST | `/api/ledger` | Admin, Manager | Create ledger entry (use helper!) |
| GET | `/api/ledger/verify` | Admin | Verify hash chain integrity |

### Serials

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/serials` | Authenticated | List all serials |
| GET | `/api/serials/:id` | Authenticated | Get single serial by ID |
| POST | `/api/serials` | Admin, Manager | Create serial (auto-creates ledger) |
| PATCH | `/api/serials/:id` | Admin, Manager | Update serial status |
| DELETE | `/api/serials/:id` | Admin | Soft delete serial |

### Batches

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/batches` | Authenticated | List all batches |
| GET | `/api/batches/:id` | Authenticated | Get single batch by ID |
| POST | `/api/batches` | Admin, Manager | Create batch (auto-creates ledger) |
| PATCH | `/api/batches/:id` | Admin, Manager | Update batch quantity |
| DELETE | `/api/batches/:id` | Admin | Soft delete batch |

### Transfers

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/transfers` | Authenticated | List transfers (role-filtered) |
| GET | `/api/transfers/:id` | Authenticated | Get single transfer by ID |
| POST | `/api/transfers` | Admin, Manager | Initiate transfer |
| PATCH | `/api/transfers/:id/approve` | Admin, Manager | Approve transfer |
| PATCH | `/api/transfers/:id/reject` | Admin, Manager | Reject transfer |
| PATCH | `/api/transfers/:id/complete` | Admin, Manager | Complete transfer |

### Stock Operations

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/stock/in` | Admin, Manager | Receive stock into warehouse |
| POST | `/api/stock/out` | Admin, Manager | Issue stock from warehouse |
| POST | `/api/stock/adjust` | Admin, Manager | Adjust stock quantity |

---

## Security Model

### Authentication
- **OIDC Provider**: Replit Auth
- **Session Storage**: PostgreSQL with 7-day expiry
- **Cookie**: HTTP-only, Secure (HTTPS only in production)
- **CSRF Protection**: Custom middleware validates tokens on POST/PATCH/DELETE

### Authorization
- **Middleware**: `isAuthenticated`, `requireRole('admin')`, `requireRole(['admin', 'manager'])`
- **Route Guards**: Applied at Express route level
- **Frontend Guards**: React components check user role before rendering UI

### Data Security
- **Soft Deletes**: No data physically deleted (audit trail preservation)
- **Immutable Ledger**: Cannot edit or delete ledger entries
- **QR Code Signing**: JWT tokens prevent QR code forgery
- **Hash Chain**: SHA-256 ensures ledger tampering detection

### SQL Injection Prevention
- **ORM**: Drizzle ORM with parameterized queries
- **No Raw SQL**: Direct SQL execution only for admin verification endpoints
- **Input Validation**: Zod schemas validate all request bodies

### XSS Prevention
- **React**: Auto-escapes user input
- **HTTP-only Cookies**: JavaScript cannot access session cookie
- **Content Security Policy**: Restricts inline scripts (future enhancement)

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Design System**: Material Design principles

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: Passport.js + OpenID Connect
- **Session Store**: PostgreSQL (`connect-pg-simple`)
- **Validation**: Zod schemas

### Infrastructure
- **Hosting**: Replit (development + production)
- **Database**: Neon PostgreSQL serverless
- **CDN**: Vite production build
- **Environment**: Docker-free (Nix-based Replit environment)

### Key Design Decisions

1. **Mobile-First PWA**: Bottom navigation, touch targets, offline support (planned)
2. **Immutable Ledger**: SHA-256 hash chain ensures audit integrity
3. **JWT QR Codes**: Security via signed tokens, not plain IDs
4. **Soft Deletes**: Preserve audit trail, prevent data loss
5. **Role-Based Access**: Three-tier system balances security and usability
6. **Material Design**: Professional enterprise aesthetic for warehouse use
7. **PostgreSQL Sessions**: Reliable session persistence vs. in-memory stores
8. **Centralized Helper**: `createLedgerEntryWithHash()` ensures hash chain consistency

---

## Future Enhancements (Post-MVP)

### Planned Features
- **Low Stock Alerts**: Real-time notifications when inventory below reorder level
- **Manager-Scoped Ledger**: Filter ledger entries by manager's assigned warehouses
- **Advanced Reports**: 
  - Stock aging report
  - Transfer history report
  - Low stock by warehouse
  - Expiry date tracking
- **Offline Mode**: Service worker for offline PWA functionality
- **Barcode Scanner**: Support standard 1D/2D barcodes in addition to QR codes
- **Email Notifications**: Transfer approvals, low stock alerts, expiry warnings
- **Audit Log Export**: CSV/Excel export for compliance
- **Multi-Language Support**: i18n for global deployments
- **Dark Mode**: User preference for theme
- **Custom Fields**: Configurable metadata per item type

### Known Limitations (MVP)
- No real-time updates (manual refresh required)
- No concurrency control (race conditions possible on simultaneous ledger writes)
- No manager-specific ledger filtering (sees global activity)
- No automated stock replenishment
- No supplier management
- No purchase order integration

---

## Appendix: Example Data Flows

### Example 1: Receiving Laptops (Serialized)

**Scenario**: Warehouse receives 3 MacBook Pro laptops

1. **User Action**: Navigate to Items → MacBook Pro → Receive Stock
2. **Form Input**:
   ```json
   {
     "action": "in",
     "quantity": 3,
     "warehouseId": "warehouse-1",
     "serials": [
       { "serialNumber": "MBP-2024-001" },
       { "serialNumber": "MBP-2024-002" },
       { "serialNumber": "MBP-2024-003" }
     ],
     "referenceNumber": "PO-12345",
     "reason": "New purchase from vendor"
   }
   ```
3. **Backend Processing**:
   - Create 3 serial records with status 'in_stock'
   - Create 3 ledger entries (one per serial) with action 'in', quantity=1
   - Generate 3 QR codes with JWT tokens
4. **Database State**:
   ```
   serials table:
   - id: uuid1, itemId: macbook-id, serialNumber: MBP-2024-001, status: in_stock
   - id: uuid2, itemId: macbook-id, serialNumber: MBP-2024-002, status: in_stock
   - id: uuid3, itemId: macbook-id, serialNumber: MBP-2024-003, status: in_stock
   
   ledger table:
   - action: 'in', quantity: 1, serialId: uuid1, previousHash: hash_n
   - action: 'in', quantity: 1, serialId: uuid2, previousHash: hash_n+1
   - action: 'in', quantity: 1, serialId: uuid3, previousHash: hash_n+2
   ```

### Example 2: Issuing Pencils (Non-Serialized)

**Scenario**: Issue 50 pencils from batch for office use

1. **User Action**: Navigate to Items → Office Pencils → Issue Stock
2. **Form Input**:
   ```json
   {
     "action": "out",
     "quantity": 50,
     "warehouseId": "warehouse-1",
     "batchId": "batch-abc123",
     "reason": "Office supply request #789"
   }
   ```
3. **Backend Processing**:
   - Check batch current quantity >= 50
   - Update batch: `quantity = quantity - 50`
   - Create ledger entry with action 'out', quantity=-50
4. **Database State**:
   ```
   batches table:
   - id: batch-abc123, quantity: 150 → 100 (reduced by 50)
   
   ledger table:
   - action: 'out', quantity: -50, batchId: batch-abc123, previousHash: hash_x
   ```

### Example 3: Inter-Warehouse Transfer

**Scenario**: Transfer 20 pencils from Warehouse A to Warehouse B

1. **User Action**: Manager at Warehouse A initiates transfer
   ```json
   {
     "itemId": "pencils-id",
     "fromWarehouseId": "warehouse-a",
     "toWarehouseId": "warehouse-b",
     "quantity": 20,
     "batchId": "batch-abc123"
   }
   ```
2. **Transfer Created**: Status = 'pending'
3. **Manager at Warehouse B Approves**: Status = 'approved'
4. **Staff Completes Transfer**:
   - Create ledger entry 1: action='transfer', quantity=-20, warehouseId='warehouse-a'
   - Create ledger entry 2: action='transfer', quantity=+20, warehouseId='warehouse-b'
   - Update batch warehouse: 'warehouse-b'
   - Update transfer status: 'completed'
5. **Database State**:
   ```
   transfers table:
   - id: transfer-1, status: completed, fromWarehouseId: warehouse-a, toWarehouseId: warehouse-b
   
   ledger table:
   - action: 'transfer', quantity: -20, warehouseId: warehouse-a, transferId: transfer-1
   - action: 'transfer', quantity: +20, warehouseId: warehouse-b, transferId: transfer-1
   
   batches table:
   - id: batch-abc123, warehouseId: warehouse-a → warehouse-b
   ```

---

**Document Version**: 1.0  
**Last Updated**: November 14, 2025  
**Status**: Current Implementation (MVP Complete)
