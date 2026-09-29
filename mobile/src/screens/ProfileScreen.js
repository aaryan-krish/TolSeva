import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getMe, changePassword } from '../services/api';

const SAFFRON = '#FF9933';
const NAVY    = '#003087';
const GREEN   = '#138808';

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { auth, logout } = useAuth();
  const isInspector = auth?.role === 'inspector';

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Change-password form
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);

  useEffect(() => {
    getMe()
      .then(r => setProfile(r.data?.user || null))
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false));
  }, []);

  async function handleChangePassword() {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword({ current_password: currentPwd, new_password: newPwd });
      Alert.alert('Success', 'Password changed successfully. Please log in again.', [
        { text: 'OK', onPress: logout }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password.');
    } finally {
      setChangingPwd(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{isInspector ? '👮' : '🏪'}</Text>
          </View>
          <Text style={styles.displayName}>
            {auth?.user?.full_name || auth?.user?.business_name || 'My Profile'}
          </Text>
          <View style={[styles.rolePill, { backgroundColor: isInspector ? NAVY : SAFFRON }]}>
            <Text style={styles.rolePillText}>{isInspector ? '⚖️ Inspector' : '🏪 Vendor'}</Text>
          </View>
        </View>

        {/* Profile details from /auth/me */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          {loadingProfile ? (
            <ActivityIndicator color={SAFFRON} style={{ marginVertical: 16 }} />
          ) : profile ? (
            <>
              {isInspector ? (
                <>
                  <InfoRow label="Full Name"      value={profile.full_name} />
                  <InfoRow label="Government ID"  value={profile.gov_id} />
                  <InfoRow label="Zone"           value={profile.zone} />
                  <InfoRow label="Designation"    value={profile.designation} />
                  <InfoRow label="Department"     value={profile.department} />
                  <InfoRow label="Email"          value={profile.email} />
                  <InfoRow label="Phone"          value={profile.phone} />
                </>
              ) : (
                <>
                  <InfoRow label="Business Name"  value={profile.business_name} />
                  <InfoRow label="Owner Name"     value={profile.owner_name} />
                  <InfoRow label="GSTIN"          value={profile.gstin} />
                  <InfoRow label="Phone"          value={profile.phone} />
                  <InfoRow label="Email"          value={profile.email} />
                  <InfoRow label="Address"        value={profile.address} />
                  <InfoRow label="City"           value={profile.city} />
                  <InfoRow label="State"          value={profile.state} />
                </>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>Profile could not be loaded.</Text>
          )}
        </View>

        {/* Change Password */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPwdForm(v => !v)}
          >
            <Text style={styles.cardTitle}>🔑 Change Password</Text>
            <Text style={styles.chevron}>{showPwdForm ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPwdForm && (
            <>
              <Text style={styles.fieldLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Enter current password"
                value={currentPwd}
                onChangeText={setCurrentPwd}
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="At least 6 characters"
                value={newPwd}
                onChangeText={setNewPwd}
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="Repeat new password"
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.btn, changingPwd && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={changingPwd}
              >
                {changingPwd
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Update Password</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f4f8' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    elevation: 3, marginBottom: 10,
    borderWidth: 2, borderColor: SAFFRON
  },
  avatarText: { fontSize: 36 },
  displayName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 6 },
  rolePill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 99 },
  rolePillText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, marginBottom: 14,
    elevation: 2, borderWidth: 1, borderColor: '#e5e7eb'
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron: { fontSize: 13, color: '#9ca3af' },

  infoRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderColor: '#f3f4f6', gap: 8 },
  infoLabel: { width: 120, fontSize: 12, color: '#9ca3af', fontWeight: '600', flexShrink: 0 },
  infoValue: { flex: 1, fontSize: 13, color: '#1f2937', fontWeight: '500' },

  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, backgroundColor: '#fafafa', color: '#111'
  },
  btn: {
    backgroundColor: SAFFRON, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center', marginTop: 14
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  emptyText: { color: '#9ca3af', textAlign: 'center', paddingVertical: 8 },

  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#fca5a5', marginTop: 4
  },
  logoutBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 15 }
});
