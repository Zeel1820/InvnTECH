# InvenTECH Mobile PWA - Design Guidelines

## Design Approach

**Framework:** Material Design (Mobile-First)
**Rationale:** Enterprise inventory management requires clear information hierarchy, data-dense interfaces, and reliable mobile patterns. Material Design provides battle-tested mobile components, excellent touch optimization, and professional aesthetics suitable for utility-focused applications.

## Typography System

**Font Stack:** Roboto (Material Design standard)
- **Display/Headers:** Roboto Medium (500) - 24px, 20px, 18px
- **Body Text:** Roboto Regular (400) - 16px (optimal mobile readability)
- **Captions/Labels:** Roboto Regular (400) - 14px
- **Data Tables:** Roboto Mono (400) - 14px (for serial numbers, SKUs, quantities)
- **Buttons/Actions:** Roboto Medium (500) - 16px

**Hierarchy Rules:**
- Screen titles: 24px Medium
- Section headers: 18px Medium  
- List item titles: 16px Medium
- Body/forms: 16px Regular
- Metadata/timestamps: 14px Regular with reduced opacity

## Layout System

**Spacing Scale:** Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistency
- Component padding: p-4 (16px standard touch-friendly spacing)
- Section spacing: py-6 or py-8
- Card margins: m-4
- List item padding: p-4
- Form field spacing: space-y-4
- Bottom navigation clearance: pb-20 (to account for fixed bottom nav)

**Container Strategy:**
- Full-width mobile layouts: w-full with px-4 side padding
- Content max-width: max-w-screen-xl (when viewed on tablets)
- Card-based layouts: Individual cards with shadow-sm and rounded-lg borders
- Safe areas: Account for notches/status bars with appropriate padding

## Component Library

### Navigation
**Bottom Tab Navigation** (Fixed, Mobile Primary):
- Four primary tabs: Dashboard, Inventory, Scan, Reports
- Icon + label combination
- Active state with accent color and subtle elevation
- 56px height for comfortable thumb reach

**Top App Bar** (Material Standard):
- 56px height
- Screen title (truncated with ellipsis if needed)
- Action icons (search, filter, more menu) on right
- Back button on left for sub-screens
- Sticky/fixed position

**Hamburger Menu** (Role-Based):
- Slide-out drawer from left
- User profile section at top with role badge
- Grouped navigation items by function
- Settings and logout at bottom
- Overlay backdrop when open

### Data Display

**List Items** (Master List Pattern):
- Card-style containers with 4px spacing between items
- Three-line layout maximum: Title (16px), Subtitle (14px), Meta (14px muted)
- Right-aligned status chips/badges
- Swipe actions for quick operations (delete, edit, transfer)
- Pull-to-refresh gesture

**Data Tables** (Reports/Ledger):
- Horizontal scroll for wide data on mobile
- Sticky column headers
- Alternating row backgrounds for readability
- Compact row height: 48px
- Tap row to expand details

**Cards** (Dashboard Widgets):
- Elevated cards with shadow-md
- 16px padding (p-4)
- Header with icon and title
- Primary metric/value prominently displayed
- Secondary info below
- Optional action button at bottom

**Status Indicators**:
- Color-coded chips with rounded-full shape
- Stock status: Low Stock (warning), Out of Stock (error), In Stock (success)
- Item lifecycle badges: In Stock, Issued, Under Repair, Retired, Lost
- Small size (text-xs, px-3, py-1)

### Forms & Input

**Text Fields** (Material Outlined):
- Floating labels
- 56px height for touch
- Clear/visible focus states
- Helper text below field
- Error states with red accent and error message

**Dropdowns/Selects**:
- Bottom sheet selection on mobile
- Large tap targets (48px minimum)
- Search filter for long lists
- Selected value shown in field with chevron icon

**Action Buttons**:
- Primary: Filled with elevation, 48px height minimum
- Secondary: Outlined with transparent fill
- Floating Action Button (FAB): For primary screen action (Add Item, Scan QR)
- FAB positioned bottom-right with 16px margin

**Wizards** (Add Item Flow):
- Stepper indicator at top showing progress
- One section per screen on mobile
- Next/Back buttons in footer
- Save as draft option for long forms

### QR Code Features

**QR Scanner Interface**:
- Full-screen camera viewfinder
- Semi-transparent overlay with centered scan frame
- Flashlight toggle button (top-right)
- Manual entry fallback (bottom)
- Success animation with haptic feedback
- Immediate navigation to scanned item details

**QR Display/Generation**:
- Centered QR code with adequate white space
- Item name/SKU below code
- Download/Share buttons underneath
- Print layout preview option

### Reports & Analytics

**Report Cards**:
- Summary metrics in grid: 2 columns on mobile
- Large numbers (32px) with labels below
- Trend indicators (arrows, percentages)
- Tap card to view detailed report

**Charts** (Where applicable):
- Simplified visualizations for mobile
- Bar charts for comparisons
- Line charts for trends
- Horizontal orientation for better mobile viewing

### Detail Screens

**Item Detail Layout**:
- Hero section: Item image/QR code (if available), name, SKU
- Tabbed sections: Details, History, Actions
- Timeline view for ledger entries (vertical line with nodes)
- Expandable sections to reduce scroll depth

**Batch/Serial Detail**:
- Prominent display of batch number/serial number
- Expiry warning banner (if applicable)
- Current location and quantity
- Complete audit trail in chronological timeline

## Interactions & Micro-animations

**Keep Minimal:**
- Subtle fade-in for new content (150ms)
- Smooth slide transitions between screens (250ms)
- Button press states with scale (0.98) and opacity
- Loading spinners for async operations
- No decorative animations

**Gestures:**
- Swipe-to-refresh on lists
- Swipe actions on list items (reveal delete/edit)
- Pinch-to-zoom on QR codes/images
- Long-press for context menus

## Role-Specific Dashboards

**Admin Dashboard:**
- System health metrics at top
- Quick actions: Add User, Add Warehouse, Add Item
- Recent activity feed
- Low stock alerts
- Charts: Inventory value, movement trends

**Manager Dashboard:**
- Assigned warehouse selector (dropdown if multiple)
- Stock overview cards for assigned warehouses
- Pending approvals section
- Quick transfer action
- Expiry warnings

**Staff Dashboard:**
- Simplified view: Search inventory, Scan QR
- Recent items accessed
- Quick stock check by location
- Minimal actions (view-only focus)

## Accessibility & Mobile Optimization

- Minimum tap target: 48x48px (Material standard)
- High contrast text: 4.5:1 minimum ratio
- Focus indicators on all interactive elements
- Screen reader labels on icons
- Haptic feedback on key actions (scan success, item added)
- Offline indicator banner when connectivity lost
- Error states with clear recovery actions

## Images

**Item Images:**
- Placeholder icon when no image uploaded (generic box icon)
- Thumbnail in list views (48x48px, rounded corners)
- Full size in detail view with zoom capability
- Upload from camera or gallery

**No Hero Images** - This is a utility app, not a marketing page. Focus on functional clarity over visual storytelling.