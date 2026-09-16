import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { submitVerification } from '../services/api';

const TEST_RESULTS = ['PASS', 'FAIL', 'CONDITIONAL_PASS'];
const RESULT_COLORS = { PASS: '#16a34a', FAIL: '#dc2626', CONDITIONAL_PASS: '#d97706' };

export default function VerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { visit } = route.params;

  const [testResult, setTestResult] = useState('');
  const [observations, setObservations] = useState('');
  const [errorPct, setErrorPct] = useState('');
  const [validMonths, setValidMonths] = useState('12');
  const [photoUri, setPhotoUri] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  async function capturePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required.'); return; }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.7
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Location permission is required.'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setGpsLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    Alert.alert('Location captured', `Lat: ${loc.coords.latitude.toFixed(5)}, Lng: ${loc.coords.longitude.toFixed(5)}`);
  }

  async function handleSubmit() {
    if (!testResult) { Alert.alert('Required', 'Please select a test result.'); return; }
    Alert.alert(
      'Confirm Verification',
      `Submit verification with result: ${testResult.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: doSubmit }
      ]
    );
  }

  async function doSubmit() {
    setLoading(true);
    try {
      const payload = {
        appointment_id: visit.id,
        instrument_id: visit.instrument_id,
        test_result: testResult,
        observations,
        error_percentage: errorPct ? parseFloat(errorPct) : null,
        valid_months: parseInt(validMonths) || 12,
        photo_url: photoUri || null
      };
      const res = await submitVerification(payload);
      navigation.navigate('Certificate', { cert: res.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Instrument Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{visit.make} {visit.model}</Text>
        <Text style={styles.summaryDetail}>S/N: {visit.serial_no}</Text>
        <Text style={styles.summaryDetail}>Type: {visit.instrument_type} | Cap: {visit.capacity} {visit.unit}</Text>
        <Text style={styles.summaryBusiness}>🏪 {visit.business_name}</Text>
      </View>

      <View style={styles.form}>
        {/* Test Result */}
        <Text style={styles.label}>Test Result *</Text>
        <View style={styles.resultRow}>
          {TEST_RESULTS.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.resultBtn, testResult === r && { backgroundColor: RESULT_COLORS[r], borderColor: RESULT_COLORS[r] }]}
              onPress={() => setTestResult(r)}
            >
              <Text style={[styles.resultText, testResult === r && { color: '#fff' }]}>{r.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error % */}
        <Text style={styles.label}>Error Percentage</Text>
        <TextInput style={styles.input} placeholder="0.000" value={errorPct} onChangeText={setErrorPct} keyboardType="decimal-pad" />

        {/* Valid Months */}
        <Text style={styles.label}>Certificate Validity (months)</Text>
        <View style={styles.resultRow}>
          {['6', '12', '24'].map(m => (
            <TouchableOpacity key={m} style={[styles.resultBtn, validMonths === m && styles.resultBtnActive]} onPress={() => setValidMonths(m)}>
              <Text style={[styles.resultText, validMonths === m && styles.resultTextActive]}>{m} mo</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Observations */}
        <Text style={styles.label}>Observations</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Describe test findings, instrument condition..." value={observations} onChangeText={setObservations} multiline numberOfLines={4} textAlignVertical="top" />

        {/* Photo & GPS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={capturePhoto}>
            <Text style={styles.actionBtnText}>{photoUri ? '📷 Retake Photo' : '📷 Capture Photo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={getLocation}>
            <Text style={styles.actionBtnText}>{gpsLocation ? '📍 GPS Captured' : '📍 Get GPS'}</Text>
          </TouchableOpacity>
        </View>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!testResult || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!testResult || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Issue Digital Certificate</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const NAVY = '#003087';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  summaryCard: { backgroundColor: NAVY, padding: 16, marginBottom: 8 },
  summaryTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  summaryDetail: { color: '#bcd4f7', fontSize: 13, marginTop: 2 },
  summaryBusiness: { color: '#C8960C', fontSize: 14, fontWeight: '600', marginTop: 6 },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff', marginBottom: 4 },
  textArea: { height: 100 },
  resultRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  resultBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 2, borderColor: '#d1d5db', backgroundColor: '#fff' },
  resultBtnActive: { backgroundColor: NAVY, borderColor: NAVY },
  resultText: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
  resultTextActive: { color: '#fff' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, backgroundColor: '#e0e7ff', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: NAVY, fontWeight: '600', fontSize: 13 },
  preview: { width: '100%', height: 180, borderRadius: 10, marginTop: 10, backgroundColor: '#ddd' },
  submitBtn: { backgroundColor: NAVY, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 32 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
