# InvenTECH - Inventory Management System

## Overview

InvenTECH is an enterprise inventory management Progressive Web Application (PWA) designed for mobile-first usage. The system tracks both serialized items (individual assets with unique serial numbers) and non-serialized inventory (batch/lot-based stock) across multiple warehouse locations. It features QR code scanning for asset tracking, immutable audit trails via ledger entries, role-based access control, and comprehensive reporting capabilities.

The application is built as a full-stack TypeScript solution with a React frontend and Express backend, targeting warehouse managers, staff, and administrators who need real-time inventory visibility and control.

## Recent Changes (November 17, 2025)

**Consumption Type Feature:**
- Added consumptionType enum to items table: 'sellable', 'loanable', 'consumable'
- Backend POST `/api/consume` endpoint handles three consumption workflows:
  - Sellable: Marks serial as 'retired', creates OUT ledger entry with "Sold" reason
  - Loanable: Marks serial as 'issued', assigns to user, creates OUT ledger entry with "Loaned to user" reason
  - Consumable: Marks serial as 'retired', creates OUT ledger entry with "Consumed" reason
- Frontend Scanner automatically determines action based on item's consumptionType
- Loanable items trigger user assignment dialog with dropdown populated from GET `/api/users`
- All consumption actions create immutable ledger entries via `createLedgerEntryWithHash()`
- Validation ensures action matches item's consumption type (prevents misuse)
- Serial status checks prevent double-consumption of already retired items

**QR Scanner Implementation:**
- Real camera scanning using html5-qrcode library with start/stop controls
- Manual entry mode for entering SKUs/serial numbers directly
- Image upload mode to scan QR codes from pictures
- Automatic lookup via GET `/api/lookup/:code` endpoint
- Seamless integration with consumption workflows

**Previous Changes:**
- Bulk serial creation with QR code generation and print functionality
- Immutable ledger backend with SHA-256 hash chain for audit trail integrity
- MVP dashboard with role-based views and real-time statistics

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite as the build tool and bundler.

**UI Framework**: Material Design principles implemented through shadcn/ui components (Radix UI primitives) with Tailwind CSS for styling. The design follows a mobile-first approach with bottom navigation, card-based layouts, and touch-friendly spacing (minimum 44px touch targets).

**State Management**: TanStack Query (React Query) for server state management with built-in caching, optimistic updates, and automatic refetching. No global client state library is used; component state is managed locally with React hooks.

**Routing**: Wouter for lightweight client-side routing. Authentication gates are implemented at the router level to redirect unauthenticated users to the landing page.

**Forms**: React Hook Form with Zod validation for type-safe form handling and validation. Form schemas are shared between client and server via the `/shared` directory.

**Design System**: 
- Typography: Roboto for UI elements, Roboto Mono for data (SKUs, serial numbers)
- Spacing: Tailwind's 4px-based scale (2, 4, 6, 8, 12, 16)
- Components: Reusable components in `/client/src/components` including BottomNav, TopBar, StatsCard, InventoryListItem, QRCodeDisplay, etc.
- Theme: Light/dark mode support with CSS variables for theming

**Key Pages**:
- Dashboard: Overview stats and recent activity
- Inventory: Searchable/filterable list of all items
- Items: CRUD operations for inventory items
- Warehouses: Multi-warehouse management (admin/manager only)
- Scanner: QR code scanning interface with camera and manual entry
- Reports: Pre-built reports (stock levels, ledger, low stock, aging, transfers)
- ItemDetail: Individual item view with ledger history and QR code

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**API Pattern**: RESTful API with JSON payloads. All routes are prefixed with `/api/`.

**Authentication**: Replit Auth (OpenID Connect) integration using Passport.js strategy. Session-based authentication with PostgreSQL session store (`connect-pg-simple`). Sessions persist for 1 week with HTTP-only cookies.

**Authorization**: Role-based access control (RBAC) with three roles:
- `admin`: Full system access
- `manager`: Can manage assigned warehouses only
- `staff`: Read-only access with limited operations

Middleware functions `isAuthenticated` and `requireRole` enforce permissions at the route level.

**Security**:
- CSRF protection via custom middleware that validates tokens on all state-changing requests (POST/PATCH/DELETE)
- QR codes contain JWT-signed tokens (not plain IDs) to prevent tampering
- Raw body buffering for webhook verification (if needed)

**Database ORM**: Drizzle ORM with type-safe schema definitions in `/shared/schema.ts`. Direct SQL queries are minimized in favor of Drizzle's query builder.

**Business Logic**: Centralized in `/server/storage.ts` which acts as a data access layer. All database operations go through this interface for consistency and testability.

**Utilities**: 
- SKU generation: Auto-generates SKUs using item name prefix + timestamp + random string
- QR token generation: Creates signed JWT tokens for batches and serials with embedded metadata

### Data Model

**Core Entities** (defined in `/shared/schema.ts`):

1. **users**: User accounts with role, profile info, and active status
2. **warehouses**: Physical locations for inventory storage
3. **managerWarehouses**: Junction table mapping managers to their assigned warehouses
4. **items**: Inventory item master data (SKU, name, type, UOM, reorder level, etc.)
   - Type: `serialized` or `non-serialized`
5. **serials**: Individual serialized items with serial numbers, status lifecycle, warranty tracking
   - States: `in_stock`, `issued`, `under_repair`, `retired`, `lost`
6. **batches**: Non-serialized inventory with batch/lot numbers, manufacture/expiry dates, supplier info
7. **ledger**: Immutable transaction log for all stock movements
   - Types: `in`, `out`, `adjust`, `transfer`
   - Captures: quantity, timestamp, user, warehouse, reason, reference
8. **transfers**: Stock transfers between warehouses with approval workflow
   - States: `pending`, `approved`, `rejected`, `completed`
9. **sessions**: PostgreSQL-backed session storage (required for Replit Auth)

**Key Architectural Decisions**:

- **Immutable Ledger**: All stock changes are recorded as append-only ledger entries. Current stock levels are derived from ledger aggregation, not stored as mutable fields. This ensures complete audit trails and prevents data loss.

- **Batch vs. Serial Tracking**: Items are classified as either serialized (1:1 tracking with unique serial numbers) or non-serialized (batch/lot tracking with quantities). This dual-mode approach handles both high-value assets and bulk commodities.

- **Soft Deletes**: All entities support soft deletion via `deletedAt` timestamp and track `updatedBy` for audit purposes.

- **Multi-Warehouse Support**: Inventory is scoped to warehouses. Managers can only access warehouses they're assigned to (enforced at query level). Transfers create two ledger entries (OUT from source, IN to destination) with shared reference ID.

### External Dependencies

**Database**: PostgreSQL (via Neon serverless driver `@neondatabase/serverless` with WebSocket support for serverless environments). Database URL is required via `DATABASE_URL` environment variable.

**Authentication Provider**: Replit Auth OIDC (configurable via `ISSUER_URL` and `REPL_ID` environment variables). Falls back to `https://replit.com/oidc` if not specified.

**UI Libraries**:
- Radix UI: Headless component primitives for accessible, composable UI
- Tailwind CSS: Utility-first CSS framework
- shadcn/ui: Pre-built component collection built on Radix UI

**QR Code Generation**: `qrcode.react` for client-side QR code SVG rendering. QR codes encode signed JWT tokens for security.

**Validation**: Zod for runtime type validation and schema definition. Schemas are shared between client and server to ensure type safety across the stack.

**Fonts**: Google Fonts (Roboto and Roboto Mono) loaded from CDN in production.

**Session Storage**: PostgreSQL with `connect-pg-simple` adapter for Express sessions.

**Build Tools**:
- Vite: Frontend build tool with HMR
- esbuild: Backend bundling for production
- tsx: TypeScript execution for development

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string (Neon serverless format)
- `SESSION_SECRET`: Secret for signing session cookies
- `REPL_ID`: Replit instance identifier (for auth)
- `ISSUER_URL`: OIDC provider URL (optional, defaults to Replit)
- `NODE_ENV`: `development` or `production`

**Notable Constraints**:
- Mobile-first design: All UI components must work on small screens (320px+)
- PWA requirements: Manifest, service worker, offline support (planned)
- No native mobile app: Runs entirely in browser as PWA
- Real-time updates: Not currently implemented (polling or manual refresh required)