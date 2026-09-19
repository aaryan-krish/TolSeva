import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  inspectorLogin, requestPasswordResetOtp, verifyPasswordReset,
  requestVendorOtp, verifyVendorOtp
} from '../services/api';

const SAFFRON = '#FF9933';
const GREEN = '#138808';
const NAVY = '#003087';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'inspector'
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Inspector state
  const [govId, setGovId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Inspector Password reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetShowPwd, setResetShowPwd] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');

  // Vendor state
  const [vendorStep, setVendorStep] = useState(1); // 1: gstin & phone, 2: otp
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [vendorOtp, setVendorOtp] = useState('');

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
      Alert.alert('Required Fields', 'Please enter both GSTIN and mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestVendorOtp({ gstin: gstin.trim().toUpperCase(), phone: phone.trim() });
      if (res.data?.dev_otp) {
        setVendorOtp(res.data.dev_otp);
        Alert.alert('OTP Dispatched', `Simulated SMS OTP: ${res.data.dev_otp}\n(Auto-filled for testing)`);
      } else {
        Alert.alert('OTP Sent', 'A verification code has been sent to your registered phone.');
      }
      setVendorStep(2);
    } catch (err) {
      Alert.alert('Request Failed', err.response?.data?.error || 'Failed to send OTP. Check GSTIN/Phone.');
    } finally {
      setLoading(false);
    }
  }

  // ── VENDOR VERIFY OTP ─────────────────────────────────────────────
  async function handleVendorVerifyOtp() {
    if (!vendorOtp.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyVendorOtp({ gstin: gstin.trim().toUpperCase(), otp: vendorOtp.trim() });
      await login(res.data.token, res.data.vendor, 'vendor');
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Quick Demo Autofills
  function fillDemoVendor() {
    setGstin('27AAPFU0939F1ZV');
    setPhone('9811223344');
  }

  function fillDemoInspector() {
    setGovId('LMI-MH-001');
    setPassword('Inspector@123');
  }

  // Password reset handlers
  function startReset() {
    setIsResetting(true);
    setResetStep(1);
    setResetIdentifier(govId.trim());
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
  }

  async function handleRequestResetOtp() {
    if (!resetIdentifier.trim()) {
      Alert.alert('Required', 'Please enter your Government ID or registered mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await requestPasswordResetOtp({
        role: 'inspector',
        identifier: resetIdentifier.trim()
      });
      setMaskedPhone(res.data.phone_masked || '');
      if (res.data.dev_otp) {
        setResetOtp(res.data.dev_otp);
      }
      setResetStep(2);
      Alert.alert('OTP Dispatched', `A 6-digit code has been sent to your phone ending in ${res.data.phone_masked?.slice(-4) || '****'}.`);
    } catch (err) {
      Alert.alert('Request Failed', err.response?.data?.error || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyResetPassword() {
    if (!resetOtp || resetOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }
    setLoading(true);
    try {
      await verifyPasswordReset({
        role: 'inspector',
        identifier: resetIdentifier.trim(),
        otp: resetOtp.trim(),
        new_password: newPassword
      });
      Alert.alert('Success', 'Password has been reset successfully! You can now log in.');
      setGovId(resetIdentifier.trim());
      setPassword('');
      setIsResetting(false);
      setResetStep(1);
    } catch (err) {
      Alert.alert('Reset Failed', err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.headerTitle}>TolSeva</Text>
          <Text style={styles.headerSub}>Legal Metrology Portal / विधिक माप विज्ञान</Text>
          <Text style={styles.headerSub2}>Government of India</Text>
        </View>

        {/* Role Switcher Tabs */}
        {!isResetting && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'vendor' && styles.activeTabBtn]}
              onPress={() => setActiveTab('vendor')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'vendor' && styles.activeTabBtnText]}>
                🏪 Vendor (व्यापारी)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'inspector' && styles.activeTabBtn]}
              onPress={() => setActiveTab('inspector')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'inspector' && styles.activeTabBtnText]}>
                🛡️ Inspector (अधिकारी)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Card */}
        <View style={styles.card}>
          {isResetting ? (
            /* ── Inspector Password Reset View ── */
            <>
              <View style={styles.resetHeader}>
                <TouchableOpacity onPress={() => setIsResetting(false)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back to Login</Text>
                </TouchableOpacity>
                <Text style={styles.cardTitle}>Reset Password</Text>
              </View>

              {resetStep === 1 ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Government ID or Mobile</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. LMI-MH-001"
                    value={resetIdentifier}
                    onChangeText={setResetIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.loginBtn} onPress={handleRequestResetOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Send Reset Code</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Enter 6-Digit OTP</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="••••••"
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                  <TouchableOpacity style={styles.loginBtn} onPress={handleVerifyResetPassword} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Set New Password</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : activeTab === 'vendor' ? (
            /* ── Vendor Login View (OTP) ── */
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

                  <Text style={styles.label}>Registered Mobile Number *</Text>
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
                    <Text style={styles.demoFillText}>⚡ Use Demo Vendor (Sharma Kirana)</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.stepInfoBox}>
                    <Text style={styles.stepInfoText}>
                      Enter the 6-digit OTP sent for GSTIN: <Text style={{ fontWeight: 'bold' }}>{gstin}</Text>
                    </Text>
                  </View>

                  <Text style={styles.label}>Enter 6-Digit OTP</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="••••••"
                    value={vendorOtp}
                    onChangeText={setVendorOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <TouchableOpacity style={styles.loginBtn} onPress={handleVendorVerifyOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Verify & Login</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.backLinkBtn} onPress={() => setVendorStep(1)}>
                    <Text style={styles.backLinkText}>← Change GSTIN / Phone</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            /* ── Inspector Login View ── */
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

              <View style={styles.labelRow}>
                <Text style={styles.label}>Password *</Text>
                <TouchableOpacity onPress={startReset}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

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
                <Text style={styles.demoFillText}>⚡ Use Demo Inspector (Rajesh Singh)</Text>
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
  container: { flexGrow: 1, backgroundColor: SAFFRON, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20 },
  logoContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  logoImage: { width: '80%', height: '80%' },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 2, opacity: 0.95 },
  headerSub2: { color: '#fff', fontSize: 11, marginTop: 1, opacity: 0.8 },

  tabContainer: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, padding: 4, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTabBtn: { backgroundColor: '#fff', elevation: 2 },
  tabBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  activeTabBtnText: { color: SAFFRON },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 22, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#666', marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  forgotText: { fontSize: 12, fontWeight: '700', color: SAFFRON },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#333', marginBottom: 14, backgroundColor: '#fafafa' },
  otpInput: { textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: 'bold', color: NAVY },
  stepInfoBox: { backgroundColor: '#fef3c7', padding: 10, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: '#fde68a' },
  stepInfoText: { fontSize: 12, color: '#92400e' },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  loginBtn: { backgroundColor: SAFFRON, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  demoFillBtn: { marginTop: 12, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff7ed', borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' },
  demoFillText: { color: '#c2410c', fontSize: 12, fontWeight: '600' },
  backLinkBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 6 },
  backLinkText: { color: '#666', fontSize: 13 },
  helpText: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 18 },
  footer: { color: '#fff', fontSize: 11, textAlign: 'center', marginTop: 20, opacity: 0.8 },

  resetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backBtn: { paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, backgroundColor: '#f0f4f8' },
  backBtnText: { color: NAVY, fontSize: 13, fontWeight: '700' }
});
