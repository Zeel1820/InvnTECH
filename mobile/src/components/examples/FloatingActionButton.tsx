import FloatingActionButton from '../FloatingActionButton'
import { Plus } from 'lucide-react'

export default function FloatingActionButtonExample() {
  return (
    <div className="h-96 relative">
      <FloatingActionButton
        icon={Plus}
        label="Add Item"
        onClick={() => console.log('FAB clicked')}
      />
    </div>
  )
}
