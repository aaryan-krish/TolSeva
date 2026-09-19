import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getAssignedVisits } from '../services/api';
import VisitCard from '../components/VisitCard';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'expired', label: '🔴 Expired' },
  { key: 'approaching', label: '🟡 Approaching' }
];

export default function VisitListScreen() {
  const navigation = useNavigation();
  const { auth, logout } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 12 }}>
          <Text style={{ color: '#C8960C', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      )
    });
  }, []);

  useEffect(() => { fetchVisits(); }, [filter]);

  async function fetchVisits() {
    setLoading(true);
    try {
      const res = await getAssignedVisits(filter);
      setVisits(res.data.visits);
    } catch (err) {
      Alert.alert('Error', 'Failed to load visits. Check connection.');
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVisits();
    setRefreshing(false);
  }, [filter]);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  }

  function handleVerify(visit) {
    navigation.navigate('Verify', { visit });
  }

  return (
    <View style={styles.container}>
      {/* Inspector info */}
      <View style={styles.inspectorBar}>
        <Text style={styles.inspectorName}>{auth?.user?.full_name}</Text>
        <Text style={styles.inspectorZone}>Zone: {auth?.user?.zone} | {auth?.user?.gov_id}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countText}>{visits.length} visit(s)</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#003087" />
          <Text style={styles.loadingText}>Loading visits...</Text>
        </View>
      ) : (
        <FlatList
          data={visits}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <VisitCard visit={item} onVerify={handleVerify} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003087']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>No visits in queue</Text>
              <Text style={styles.emptyText}>Pull down to refresh</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const NAVY = '#FF9933'; // Saffron
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  inspectorBar: { backgroundColor: NAVY, paddingHorizontal: 16, paddingVertical: 10 },
  inspectorName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  inspectorZone: { color: '#bcd4f7', fontSize: 12 },
  filterRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e5e7eb', flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#d1d5db' },
  filterBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  filterTextActive: { color: '#fff' },
  countText: { marginLeft: 'auto', fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  list: { padding: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 12, color: '#666' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  emptyText: { fontSize: 13, color: '#9ca3af', marginTop: 4 }
});
