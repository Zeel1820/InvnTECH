import TopBar from '../TopBar'

export default function TopBarExample() {
  return (
    <TopBar 
      title="Dashboard" 
      showSearch 
      showNotifications
      onMenuClick={() => console.log('Menu clicked')}
      onSearchClick={() => console.log('Search clicked')}
    />
  )
}
