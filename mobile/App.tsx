
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NativeRouter, Route, Routes } from 'react-router-native';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Scan from './pages/Scan';
import Reports from './pages/Reports';
import BottomNav from './components/BottomNav';
import { AuthProvider } from './hooks/useAuth';

export default function App() {
  return (
    <NativeRouter>
      <AuthProvider>
        <View style={styles.container}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
          <BottomNav />
          <StatusBar style="auto" />
        </View>
      </AuthProvider>
    </NativeRouter>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
