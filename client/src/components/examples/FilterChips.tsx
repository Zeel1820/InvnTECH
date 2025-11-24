import FilterChips from '../FilterChips'
import { useState } from 'react'

export default function FilterChipsExample() {
  const [filters, setFilters] = useState([
    { id: '1', label: 'Type', value: 'Serialized' },
    { id: '2', label: 'Warehouse', value: 'Main' },
    { id: '3', label: 'Status', value: 'In Stock' },
  ]);

  return (
    <div className="p-4">
      <FilterChips
        filters={filters}
        onRemove={(id) => {
          console.log('Remove filter:', id);
          setFilters(filters.filter(f => f.id !== id));
        }}
      />
    </div>
  )
}
