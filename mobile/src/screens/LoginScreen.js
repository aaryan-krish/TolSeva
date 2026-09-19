import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { inspectorLogin, requestPasswordResetOtp, verifyPasswordReset } from '../services/api';

export default function LoginScreen() {
  const [govId, setGovId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetShowPwd, setResetShowPwd] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');

  const { login } = useAuth();

  async function handleLogin() {
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
      Alert.alert('OTP Dispatched', `A 6-digit verification code has been sent to your registered mobile number ending in ${res.data.phone_masked?.slice(-4) || '****'}.`);
    } catch (err) {
      Alert.alert('Request Failed', err.response?.data?.error || 'Failed to send OTP. Verify your ID/phone.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyResetPassword() {
    if (!resetOtp || resetOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
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
      Alert.alert('Reset Failed', err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerSub}>Legal Metrology Department</Text>
          <Text style={styles.headerSub2}>Government of India</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {!isResetting ? (
            /* ── Normal Login View ── */
            <>
              <Text style={styles.cardTitle}>Inspector Login</Text>
              <Text style={styles.cardSub}>Use your Government-issued credentials</Text>

              <Text style={styles.label}>Government ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. LMI-MH-001"
                value={govId}
                onChangeText={setGovId}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={startReset}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
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

              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
              </TouchableOpacity>

              <Text style={styles.helpText}>Official portal for authorized Legal Metrology Officers</Text>
            </>
          ) : (
            /* ── Reset Password View ── */
            <>
              <View style={styles.resetHeader}>
                <TouchableOpacity
                  onPress={() => { setIsResetting(false); setResetStep(1); }}
                  style={styles.backBtn}
                >
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.cardTitle}>Reset Password</Text>
              </View>
              <Text style={styles.cardSub}>Inspector Account Verification via Mobile OTP</Text>

              {resetStep === 1 ? (
                /* Step 1: Input ID / Mobile */
                <View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>
                      Enter your Government ID (e.g. LMI-MH-001) or registered mobile number to receive a 6-digit verification code.
                    </Text>
                  </View>

                  <Text style={styles.label}>Government ID or Registered Mobile</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. LMI-MH-001 or 9876500001"
                    value={resetIdentifier}
                    onChangeText={setResetIdentifier}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleRequestResetOtp}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Send Reset OTP</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsResetting(false)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel and return to Login</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Step 2: Enter OTP & New Password */
                <View>
                  <View style={styles.otpNoticeBox}>
                    <Text style={styles.otpNoticeTitle}>Code sent to registered mobile ending in:</Text>
                    <Text style={styles.otpNoticePhone}>+91 {maskedPhone || '******'}</Text>
                    <TouchableOpacity onPress={() => setResetStep(1)}>
                      <Text style={styles.changeLink}>Change ID or Phone</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Enter 6-Digit OTP</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />

                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.pwdRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!resetShowPwd}
                      autoCorrect={false}
                    />
                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setResetShowPwd(p => !p)}>
                      <Text style={styles.eyeText}>{resetShowPwd ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!resetShowPwd}
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={styles.loginBtn}
                    onPress={handleVerifyResetPassword}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Set New Password</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { setIsResetting(false); setResetStep(1); }}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel and return to Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        <Text style={styles.footer}>© 2026 Government of India | Ministry of Consumer Affairs</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const NAVY = '#FF9933'; // Saffron
const GOLD = '#138808'; // India Green

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#FF9933', justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  emblem: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#138808', marginBottom: 12 },
  emblemText: { color: NAVY, fontWeight: 'bold', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: GOLD, fontSize: 13, fontWeight: '600', marginTop: 2 },
  headerSub2: { color: '#bcd4f7', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: NAVY, marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#666', marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  forgotText: { fontSize: 12, fontWeight: '700', color: NAVY },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#333', marginBottom: 16, backgroundColor: '#fafafa' },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  loginBtn: { backgroundColor: NAVY, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  helpText: { color: '#999', fontSize: 11, textAlign: 'center', marginTop: 16 },
  footer: { color: '#9ab5d9', fontSize: 11, textAlign: 'center', marginTop: 24 },

  // Reset password specific styles
  resetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backBtn: { paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, backgroundColor: '#f0f4f8' },
  backBtnText: { color: NAVY, fontSize: 13, fontWeight: '700' },
  infoBox: { backgroundColor: '#fff8e6', borderColor: '#ffd166', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  infoBoxText: { color: '#7a5200', fontSize: 12, lineHeight: 17 },
  otpNoticeBox: { backgroundColor: '#eef4ff', borderColor: '#bcd4f7', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  otpNoticeTitle: { color: '#333', fontSize: 12 },
  otpNoticePhone: { color: NAVY, fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  changeLink: { color: NAVY, fontSize: 12, textDecorationLine: 'underline', marginTop: 6, fontWeight: '600' },
  otpInput: { textAlign: 'center', fontSize: 22, fontWeight: 'bold', letterSpacing: 8 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#666', fontSize: 13, textDecorationLine: 'underline' }
});
