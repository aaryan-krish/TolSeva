import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import StatusBadge from './StatusBadge';

export default function VisitCard({ visit, onVerify }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.titleRow}>
          <Text style={styles.instrumentName}>{visit.make} {visit.model}</Text>
          <StatusBadge status={visit.expiry_status} />
        </View>
      </View>

      <Text style={styles.serial}>S/N: {visit.serial_no}</Text>
      <Text style={styles.detail}>Type: {visit.instrument_type}</Text>
      <Text style={styles.detail}>Capacity: {visit.capacity} {visit.unit}</Text>

      <View style={styles.divider} />

      <Text style={styles.businessName}>🏪 {visit.business_name}</Text>
      <Text style={styles.detail}>👤 {visit.owner_name}</Text>
      {visit.vendor_phone && <Text style={styles.detail}>📞 +91 {visit.vendor_phone}</Text>}
      {visit.address && <Text style={styles.address}>📍 {visit.address}</Text>}

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          ⚠️ Expiry: {visit.expiry_date ? new Date(visit.expiry_date).toLocaleDateString('en-IN') : 'Not set'}
        </Text>
        <Text style={styles.dateText}>
          📅 Visit: {new Date(visit.preferred_date).toLocaleDateString('en-IN')}
        </Text>
      </View>

      <TouchableOpacity style={styles.verifyBtn} onPress={() => onVerify(visit)}>
        <Text style={styles.verifyBtnText}>Start Verification</Text>
      </TouchableOpacity>
    </View>
  );
}

const NAVY = '#FF9933'; // Saffron
const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 },
  row: { marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  instrumentName: { fontSize: 16, fontWeight: 'bold', color: NAVY, flex: 1 },
  serial: { fontSize: 12, color: '#555', fontFamily: 'monospace', marginTop: 4 },
  detail: { fontSize: 13, color: '#555', marginTop: 3 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  businessName: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 4 },
  address: { fontSize: 12, color: '#777', marginTop: 3 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 4 },
  dateText: { fontSize: 11, color: '#666' },
  verifyBtn: { backgroundColor: NAVY, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  verifyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
