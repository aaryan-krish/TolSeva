import { View, Text, StyleSheet } from 'react-native';

const BADGE_STYLES = {
  EXPIRED: { bg: '#FEE2E2', text: '#991B1B', label: '🔴 EXPIRED' },
  EXPIRING_SOON: { bg: '#FEF3C7', text: '#92400E', label: '🟠 Expiring Soon' },
  APPROACHING: { bg: '#FEF9C3', text: '#713F12', label: '🟡 Approaching' },
  VALID: { bg: '#D1FAE5', text: '#065F46', label: '🟢 Valid' },
  PENDING: { bg: '#F3F4F6', text: '#374151', label: '⚪ Pending' }
};

export default function StatusBadge({ status }) {
  const style = BADGE_STYLES[status] || BADGE_STYLES.PENDING;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  text: { fontSize: 11, fontWeight: 'bold' }
});
