import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { inspectorLogin } from '../services/api';

export default function LoginScreen() {
  const [govId, setGovId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
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

        {/* Login Card */}
        <View style={styles.card}>
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

          <Text style={styles.label}>Password</Text>
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

          <Text style={styles.helpText}>Having trouble? Contact admin at lmd.admin@gov.in</Text>
        </View>

        <Text style={styles.footer}>© 2026 Government of India | Ministry of Consumer Affairs</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const NAVY = '#003087';
const GOLD = '#C8960C';

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#003087', justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  emblem: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: GOLD, marginBottom: 12 },
  emblemText: { color: NAVY, fontWeight: 'bold', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: GOLD, fontSize: 13, fontWeight: '600', marginTop: 2 },
  headerSub2: { color: '#bcd4f7', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: NAVY, marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#666', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#333', marginBottom: 16, backgroundColor: '#fafafa' },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  eyeBtn: { padding: 10 },
  eyeText: { fontSize: 18 },
  loginBtn: { backgroundColor: NAVY, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  helpText: { color: '#999', fontSize: 11, textAlign: 'center', marginTop: 16 },
  footer: { color: '#9ab5d9', fontSize: 11, textAlign: 'center', marginTop: 24 }
});
