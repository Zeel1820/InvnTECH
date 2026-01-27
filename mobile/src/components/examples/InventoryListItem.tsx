import InventoryListItem from '../InventoryListItem'

export default function InventoryListItemExample() {
  return (
    <div className="p-4 space-y-3">
      <InventoryListItem
        id="1"
        name="MacBook Pro 16-inch"
        sku="LAPTOP-MBP16-001"
        type="serialized"
        status="in_stock"
        warehouse="Main Warehouse"
        onClick={() => console.log('Item clicked')}
      />
      <InventoryListItem
        id="2"
        name="Office Pencils (Box)"
        sku="STAT-PENCIL-BLK"
        type="non-serialized"
        quantity={150}
        status="low_stock"
        warehouse="Office Supplies"
        onClick={() => console.log('Item clicked')}
      />
      <InventoryListItem
        id="3"
        name="Dell Monitor 27-inch"
        sku="MON-DELL27-003"
        type="serialized"
        status="under_repair"
        warehouse="IT Department"
        onClick={() => console.log('Item clicked')}
      />
    </div>
  )
}
