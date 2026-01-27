import StatsCard from '../StatsCard'
import { Package } from 'lucide-react'

export default function StatsCardExample() {
  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      <StatsCard
        title="Total Items"
        value="1,234"
        subtitle="Active inventory"
        icon={Package}
        trend={{ value: "12%", isPositive: true }}
        onClick={() => console.log('Card clicked')}
      />
      <StatsCard
        title="Low Stock"
        value="23"
        subtitle="Needs reorder"
        icon={Package}
        trend={{ value: "5%", isPositive: false }}
      />
    </div>
  )
}
