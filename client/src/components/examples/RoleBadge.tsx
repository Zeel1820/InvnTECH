import RoleBadge from '../RoleBadge'

export default function RoleBadgeExample() {
  return (
    <div className="p-4 flex gap-2">
      <RoleBadge role="admin" />
      <RoleBadge role="manager" />
      <RoleBadge role="staff" />
    </div>
  )
}
