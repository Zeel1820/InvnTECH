import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NativeRouter, Route, Routes } from 'react-router-native';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Scan from './pages/Scanner';
import Reports from './pages/Reports';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <NativeRouter>
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
    </NativeRouter>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
