import LedgerEntry from '../LedgerEntry'

export default function LedgerEntryExample() {
  return (
    <div className="p-4 max-w-md">
      <LedgerEntry
        id="1"
        type="in"
        quantity={50}
        timestamp="2024-01-15 10:30 AM"
        user="John Admin"
        warehouse="Main Warehouse"
        reason="Initial stock"
        reference="PO-2024-001"
      />
      <LedgerEntry
        id="2"
        type="out"
        quantity={-10}
        timestamp="2024-01-16 02:15 PM"
        user="Jane Manager"
        warehouse="Main Warehouse"
        reason="Issued to IT Department"
      />
      <LedgerEntry
        id="3"
        type="transfer"
        quantity={20}
        timestamp="2024-01-17 09:00 AM"
        user="Bob Manager"
        warehouse="Main → Branch Office"
        reference="TRF-2024-005"
      />
    </div>
  )
}
