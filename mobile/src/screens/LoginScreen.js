import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { inspectorLogin, requestVendorOtp, verifyVendorOtp } from '../services/api';

const NAVY = '#003087';
const GOLD = '#C8960C';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'inspector'
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Inspector state
  const [govId, setGovId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Vendor state
  const [vendorStep, setVendorStep] = useState(1); // 1: phone/gstin, 2: otp
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // ── INSPECTOR LOGIN ──────────────────────────────────────────────
  async function handleInspectorLogin() {
    if (!govId.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your Government ID and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await inspectorLogin({ gov_id: govId.trim(), password });
      await login(res.data.token, res.data.inspector, 'inspector');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── VENDOR REQUEST OTP ────────────────────────────────────────────
  async function handleVendorRequestOtp() {
    if (!gstin.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please enter both GSTIN and mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestVendorOtp({ gstin: gstin.trim().toUpperCase(), phone: phone.trim() });
      if (res.data.dev_otp) {
        setOtp(res.data.dev_otp);
        Alert.alert('OTP Sent', `Simulated OTP received: ${res.data.dev_otp}`);
      } else {
        Alert.alert('OTP Sent', 'An OTP has been sent to your registered mobile number.');
      }
      setVendorStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP. Check details and try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── VENDOR VERIFY OTP ─────────────────────────────────────────────
  async function handleVendorVerifyOtp() {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyVendorOtp({ gstin: gstin.trim().toUpperCase(), otp: otp.trim() });
      await login(res.data.token, res.data.vendor, 'vendor');
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Fills
  function fillDemoVendor() {
    setGstin('27AAPFU0939F1ZV');
    setPhone('9811223344');
  }

  function fillDemoInspector() {
    setGovId('LMI-MH-001');
    setPassword('Inspector@123');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.emblem}>
            <Text style={styles.emblemText}>GoI</Text>
          </View>
          <Text style={styles.headerTitle}>TolSeva</Text>
          <Text style={styles.headerSub}>Legal Metrology Portal</Text>
          <Text style={styles.headerSub2}>Government of India</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'vendor' && styles.activeTabBtn]}
            onPress={() => setActiveTab('vendor')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'vendor' && styles.activeTabBtnText]}>
              🏪 Vendor Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'inspector' && styles.activeTabBtn]}
            onPress={() => setActiveTab('inspector')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'inspector' && styles.activeTabBtnText]}>
              🛡️ Inspector
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {activeTab === 'vendor' ? (
            <>
              <Text style={styles.cardTitle}>Vendor Services</Text>
              <Text style={styles.cardSub}>Register scales, manage renewals, & view certificates</Text>

              {vendorStep === 1 ? (
                <>
                  <Text style={styles.label}>GSTIN *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 27AAPFU0939F1ZV"
                    value={gstin}
                    onChangeText={setGstin}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />

                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />

                  <TouchableOpacity style={styles.loginBtn} onPress={handleVendorRequestOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Request OTP</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.demoFillBtn} onPress={fillDemoVendor}>
                    <Text style={styles.demoFillText}>⚡ Use Demo Vendor Credentials</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.stepInfoText}>
                    Enter the 6-digit OTP sent for GSTIN <Text style={{ fontWeight: 'bold' }}>{gstin}</Text>
                  </Text>

                  <Text style={styles.label}>One-Time Password (OTP)</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="6-digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <TouchableOpacity style={styles.loginBtn} onPress={handleVendorVerifyOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Verify & Login</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.backBtn} onPress={() => setVendorStep(1)}>
                    <Text style={styles.backBtnText}>← Change GSTIN / Phone</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Inspector Login</Text>
              <Text style={styles.cardSub}>Authorized Legal Metrology Officers only</Text>

              <Text style={styles.label}>Government ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. LMI-MH-001"
                value={govId}
                onChangeText={setGovId}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Text style={styles.label}>Password *</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(p => !p)}>
                  <Text style={styles.eyeText}>{showPwd ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.loginBtn} onPress={handleInspectorLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login as Inspector</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.demoFillBtn} onPress={fillDemoInspector}>
                <Text style={styles.demoFillText}>⚡ Use Demo Inspector Credentials</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.helpText}>National Legal Metrology Helpline: 1800-11-4000</Text>
        </View>

        <Text style={styles.footer}>© 2026 Government of India | Department of Consumer Affairs</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: NAVY, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  emblem: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: GOLD, marginBottom: 8 },
  emblemText: { color: NAVY, fontWeight: 'bold', fontSize: 13 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: GOLD, fontSize: 13, fontWeight: '600', marginTop: 2 },
  headerSub2: { color: '#bcd4f7', fontSize: 11, marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabBtn: { backgroundColor: '#fff' },
  tabBtnText: { color: '#cbdcf7', fontWeight: 'bold', fontSize: 14 },
  activeTabBtnText: { color: NAVY },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 22, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: NAVY, marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#666', marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#333', marginBottom: 14, backgroundColor: '#fafafa' },
  otpInput: { textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 'bold', color: NAVY },
  stepInfoText: { fontSize: 13, color: '#444', marginBottom: 16, backgroundColor: '#f0f4fc', padding: 10, borderRadius: 8 },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  loginBtn: { backgroundColor: NAVY, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  demoFillBtn: { marginTop: 12, paddingVertical: 8, alignItems: 'center', backgroundColor: '#f4f7fb', borderRadius: 8, borderWidth: 1, borderColor: '#d1dfef' },
  demoFillText: { color: '#0040a8', fontSize: 12, fontWeight: '600' },
  backBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 6 },
  backBtnText: { color: '#666', fontSize: 13 },
  helpText: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 18 },
  footer: { color: '#9ab5d9', fontSize: 11, textAlign: 'center', marginTop: 20 }
});
