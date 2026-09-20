import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CertificateScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cert } = route.params;

  async function handleShare() {
    await Share.share({
      message: `TolSeva Digital Certificate\nCertificate No: ${cert.certificate_no}\nValid Until: ${cert.valid_until}\nVerify at: https://tolseva.gov.in/verify/${cert.certificate_no}`
    });
  }

  // Parse QR payload for display
  const qrData = cert.log?.qr_payload || cert.certificate_no || 'CERT';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success header */}
      <View style={styles.successHeader}>
        <Text style={styles.successIcon}>🏅</Text>
        <Text style={styles.successTitle}>Certificate Issued!</Text>
        <Text style={styles.successSub}>Verification completed successfully</Text>
      </View>

      {/* Certificate Card */}
      <View style={styles.certCard}>
        <View style={styles.certHeader}>
          <Text style={styles.certHeaderTitle}>Legal Metrology Department</Text>
          <Text style={styles.certHeaderSub}>Government of India</Text>
        </View>

        <View style={styles.certBody}>
          <Text style={styles.certLabel}>Certificate Number</Text>
          <Text style={styles.certValue}>{cert.certificate_no}</Text>

          <Text style={styles.certLabel}>Test Result</Text>
          <Text style={[styles.certValue, {
            color: cert.log?.test_result === 'PASS' ? '#16a34a' :
                   cert.log?.test_result === 'FAIL' ? '#dc2626' : '#d97706'
          }]}>{cert.log?.test_result?.replace('_', ' ')}</Text>

          <Text style={styles.certLabel}>Valid Until</Text>
          <Text style={styles.certValue}>
            {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
          </Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrLabel}>Scan to Verify</Text>
          <QRCode
            value={qrData}
            size={160}
            color="#003087"
            backgroundColor="#fff"
          />
          <Text style={styles.qrSub}>Scan with any QR scanner to verify authenticity</Text>
        </View>
      </View>

      {/* Actions */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 Share Certificate</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('VisitList')}>
        <Text style={styles.doneBtnText}>Done — Back to Visits</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const NAVY = '#FF9933'; // Saffron
const GOLD = '#138808'; // India Green
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  content: { padding: 16, paddingBottom: 40 },
  successHeader: { alignItems: 'center', marginBottom: 20 },
  successIcon: { fontSize: 56, marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#16a34a' },
  successSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  certCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, marginBottom: 16 },
  certHeader: { backgroundColor: NAVY, padding: 16, alignItems: 'center' },
  certHeaderTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  certHeaderSub: { color: GOLD, fontSize: 12, marginTop: 2 },
  certBody: { padding: 20 },
  certLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14 },
  certValue: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 3, fontFamily: 'monospace' },
  qrContainer: { alignItems: 'center', padding: 20, borderTopWidth: 1, borderColor: '#f3f4f6' },
  qrLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 12 },
  qrSub: { fontSize: 11, color: '#9ca3af', marginTop: 10, textAlign: 'center' },
  shareBtn: { backgroundColor: '#e0f2fe', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#bae6fd' },
  shareBtnText: { color: NAVY, fontWeight: 'bold', fontSize: 15 },
  doneBtn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});
