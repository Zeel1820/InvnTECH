import EmptyState from '../EmptyState'
import { Package } from 'lucide-react'

export default function EmptyStateExample() {
  return (
    <div className="p-4">
      <EmptyState
        icon={Package}
        title="No items found"
        description="Get started by adding your first inventory item using the button below."
        actionLabel="Add Item"
        onAction={() => console.log('Add item clicked')}
      />
    </div>
  )
}
