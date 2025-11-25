import QRCodeDisplay from '../QRCodeDisplay'

export default function QRCodeDisplayExample() {
  return (
    <div className="p-4">
      <QRCodeDisplay
        value="LAPTOP-MBP16-001-SN123456"
        title="MacBook Pro 16-inch"
        subtitle="SKU: LAPTOP-MBP16-001 • Serial: SN123456"
      />
    </div>
  )
}
