
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import { Package, AlertTriangle, TrendingUp, Warehouse, Plus } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Item, Warehouse as WarehouseType, Ledger } from '@shared/schema';

// Mock components for now - these will need to be implemented
const StatsCard = ({ title, value, subtitle, icon: Icon }) => (
  <View style={styles.statsCard}>
    <Icon color="#888" size={24} />
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
    <Text style={styles.statsSubtitle}>{subtitle}</Text>
  </View>
);

const InventoryListItem = ({ name, sku, warehouse }) => (
  <View style={styles.inventoryItem}>
    <Text style={styles.inventoryItemName}>{name}</Text>
    <Text style={styles.inventoryItemDetails}>SKU: {sku} | Warehouse: {warehouse}</Text>
  </View>
);

const FloatingActionButton = ({ onPress, icon: Icon }) => (
  <Pressable onPress={onPress} style={styles.fab}>
    <Icon color="white" size={24} />
  </Pressable>
);

const Card = ({ children }) => <View style={styles.card}>{children}</View>;
const CardHeader = ({ children }) => <View style={styles.cardHeader}>{children}</View>;
const CardContent = ({ children }) => <View style={styles.cardContent}>{children}</View>;
const RoleBadge = ({ role }) => <View style={styles.badge}><Text style={styles.badgeText}>{role}</Text></View>;
const ThemeToggle = () => <View />;


export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<Ledger[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const itemsRes = await fetch('http://localhost:3000/api/items');
        const itemsData = await itemsRes.json();
        setItems(itemsData.data);

        const warehousesRes = await fetch('http://localhost:3000/api/warehouses');
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData.data);

        if (user) {
          const ledgerRes = await fetch('http://localhost:3000/api/ledger');
          const ledgerData = await ledgerRes.json();
          setLedgerEntries(ledgerData.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const recentItems = (ledgerEntries?.slice(0, 3).map(entry => {
    const item = items?.find(i => i.id === entry.itemId);
    const warehouse = warehouses?.find(w => w.id === entry.warehouseId);
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      sku: item.sku,
      warehouse: warehouse?.name || 'Unknown',
    };
  }).filter(Boolean) as any[]) || [];

  return (
    <View style={styles.container}>
      <TopBar
        title="Dashboard"
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      <ScrollView contentContainerStyle={styles.scrollView}>
        <Card>
          <CardHeader>
            <View>
              <Text style={styles.welcomeTitle}>Welcome back!</Text>
              <Text style={styles.welcomeUser}>{user ? `${user.firstName} ${user.lastName}` : 'Loading...'}</Text>
            </View>
            {user?.role && <RoleBadge role={user.role} />}
          </CardHeader>
        </Card>

        <View style={styles.statsGrid}>
          <StatsCard title="Total Items" value={loading ? '...' : (items?.length || 0).toString()} subtitle="In system" icon={Package} />
          <StatsCard title="Activity" value={loading ? '...' : (ledgerEntries?.length || 0).toString()} subtitle="Total movements" icon={TrendingUp} />
          <StatsCard title="Warehouses" value={loading ? '...' : (warehouses?.length || 0).toString()} subtitle="Active locations" icon={Warehouse} />
          <StatsCard title="Issues" value="0" subtitle="Needs attention" icon={AlertTriangle} />
        </View>

        <View>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6366f1" />
          ) : recentItems.length > 0 ? (
            recentItems.map(item => <InventoryListItem key={item.id} {...item} />)
          ) : (
            <Card><CardContent><Text style={styles.noActivityText}>No recent activity</Text></CardContent></Card>
          )}
        </View>
      </ScrollView>

      <FloatingActionButton icon={Plus} onPress={() => console.log('Add item')} />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollView: { padding: 16, gap: 24, paddingBottom: 80 },
  welcomeTitle: { fontSize: 18, fontWeight: '500' },
  welcomeUser: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 12 },
  noActivityText: { textAlign: 'center', color: '#6b7280', padding: 24 },
  statsCard: { flex: 1, minWidth: '45%', backgroundColor: 'white', borderRadius: 8, padding: 16, gap: 8 },
  statsValue: { fontSize: 24, fontWeight: 'bold' },
  statsTitle: { fontSize: 14, fontWeight: '500' },
  statsSubtitle: { fontSize: 12, color: '#6b7280' },
  inventoryItem: { backgroundColor: 'white', borderRadius: 8, padding: 16 },
  inventoryItemName: { fontSize: 16, fontWeight: '500' },
  inventoryItemDetails: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  fab: { position: 'absolute', bottom: 80, right: 16, backgroundColor: '#6366f1', borderRadius: 50, padding: 16, elevation: 5 },
  card: { backgroundColor: 'white', borderRadius: 8 },
  cardHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardContent: { padding: 16 },
  badge: { backgroundColor: '#e0e7ff', borderRadius: 16, paddingVertical: 4, paddingHorizontal: 12 }, 
  badgeText: { color: '#4f46e5', fontWeight: '500', fontSize: 12 }
});
