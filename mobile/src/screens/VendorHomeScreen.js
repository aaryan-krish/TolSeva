import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getMachines, getAppointments, addMachine, bookAppointment } from '../services/api';

const SAFFRON = '#FF9933';
const GREEN = '#138808';
const NAVY = '#003087';

const INSTRUMENT_TYPES = [
  'Electronic Platform Scale', 'Mechanical Platform Scale', 'Counter Scale',
  'Bench Scale', 'Floor Scale', 'Truck Weighbridge', 'Retail Weighing Scale',
  'Weighing Balance', 'Fuel Dispenser', 'Other'
];

export default function VendorHomeScreen() {
  const navigation = useNavigation();
  const { auth, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('machines'); // 'machines' | 'appointments'
  const [machines, setMachines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Machine Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachine, setNewMachine] = useState({
    make: '', model: '', serial_no: '', instrument_type: 'Electronic Platform Scale',
    capacity: '', unit: 'kg', manufacture_year: '2025'
  });
  const [submittingMachine, setSubmittingMachine] = useState(false);

  // Book Appointment Modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [newAppt, setNewAppt] = useState({
    instrument_id: '', purpose: 'RENEWAL', preferred_date: '', preferred_time: '11:00 AM', vendor_notes: ''
  });
  const [submittingAppt, setSubmittingAppt] = useState(false);

  const fetchAllData = useCallback(async () => {
    try {
      const [mRes, aRes] = await Promise.all([
        getMachines().catch(() => ({ data: { machines: [] } })),
        getAppointments().catch(() => ({ data: { appointments: [] } }))
      ]);
      setMachines(mRes.data?.machines || []);
      setAppointments(aRes.data?.appointments || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout }
    ]);
  }

  // Register Instrument
  async function handleAddMachine() {
    if (!newMachine.make || !newMachine.model || !newMachine.serial_no) {
      Alert.alert('Missing Fields', 'Make, model, and serial number are required.');
      return;
    }
    setSubmittingMachine(true);
    try {
      await addMachine(newMachine);
      Alert.alert('Success', 'Instrument registered successfully!');
      setShowAddModal(false);
      setNewMachine({
        make: '', model: '', serial_no: '', instrument_type: 'Electronic Platform Scale',
        capacity: '', unit: 'kg', manufacture_year: '2025'
      });
      fetchAllData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to register instrument.');
    } finally {
      setSubmittingMachine(false);
    }
  }

  // Book Appointment
  async function handleBookAppointment() {
    if (!newAppt.preferred_date) {
      Alert.alert('Missing Date', 'Please enter a preferred date (YYYY-MM-DD).');
      return;
    }
    setSubmittingAppt(true);
    try {
      await bookAppointment(newAppt);
      Alert.alert('Success', 'Inspection appointment booked successfully!');
      setShowBookModal(false);
      setNewAppt({
        instrument_id: '', purpose: 'RENEWAL', preferred_date: '', preferred_time: '11:00 AM', vendor_notes: ''
      });
      fetchAllData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to book appointment.');
    } finally {
      setSubmittingAppt(false);
    }
  }

  const expiredCount = machines.filter(m => m.expiry_status === 'EXPIRED').length;
  const expiringCount = machines.filter(m => m.expiry_status === 'EXPIRING_SOON').length;

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerRole}>🏪 VENDOR SERVICES / व्यापारी पोर्टल</Text>
          <Text style={styles.bizName} numberOfLines={1}>
            {auth?.user?.business_name || 'My Business'}
          </Text>
          <Text style={styles.gstinText}>GSTIN: {auth?.user?.gstin || '—'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Expiry Alert */}
      {expiredCount > 0 && (
        <View style={styles.alertBanner}>
          <Text style={styles.alertText}>
            ⚠️ {expiredCount} instrument(s) expired! Book renewal visit immediately.
          </Text>
        </View>
      )}

      {/* Summary KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>⚖️</Text>
          <Text style={styles.kpiVal}>{machines.length}</Text>
          <Text style={styles.kpiLabel}>Total</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>✅</Text>
          <Text style={[styles.kpiVal, { color: GREEN }]}>
            {machines.filter(m => m.status === 'ACTIVE').length}
          </Text>
          <Text style={styles.kpiLabel}>Active</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>⚠️</Text>
          <Text style={[styles.kpiVal, { color: '#b91c1c' }]}>{expiredCount}</Text>
          <Text style={styles.kpiLabel}>Expired</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiIcon}>📅</Text>
          <Text style={[styles.kpiVal, { color: NAVY }]}>{appointments.length}</Text>
          <Text style={styles.kpiLabel}>Visits</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'machines' && styles.activeTabItem]}
          onPress={() => setActiveTab('machines')}
        >
          <Text style={[styles.tabText, activeTab === 'machines' && styles.activeTabText]}>
            ⚖️ Instruments ({machines.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'appointments' && styles.activeTabItem]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
            📅 Appointments ({appointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={SAFFRON} />
          <Text style={{ marginTop: 8, color: '#666' }}>Loading vendor data...</Text>
        </View>
      ) : activeTab === 'machines' ? (
        <FlatList
          data={machines}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.actionAddBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.actionAddBtnText}>+ Register New Machine</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>⚖️</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>No Instruments Found</Text>
              <Text style={{ color: '#777', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Register your weighing balances and scales to receive legal metrology verification.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExp = item.expiry_status === 'EXPIRED';
            const isSoon = item.expiry_status === 'EXPIRING_SOON';
            return (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.machineTitle}>{item.make} {item.model}</Text>
                    <Text style={styles.machineSub}>S/N: {item.serial_no} • {item.instrument_type}</Text>
                  </View>
                  <View style={[
                    styles.badge,
                    isExp ? styles.badgeExpired :
                    isSoon ? styles.badgeSoon :
                    item.status === 'ACTIVE' ? styles.badgeActive : styles.badgePending
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      isExp ? styles.textExpired :
                      isSoon ? styles.textSoon :
                      item.status === 'ACTIVE' ? styles.textActive : styles.textPending
                    ]}>
                      {item.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Capacity: <Text style={{ fontWeight: 'bold' }}>{item.capacity || '—'} {item.unit || 'kg'}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    Expiry:{' '}
                    <Text style={{ fontWeight: 'bold', color: isExp ? '#dc2626' : '#333' }}>
                      {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('en-IN') : 'Not Verified'}
                    </Text>
                  </Text>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.btnRow}>
                  {item.certificate?.certificate_no ? (
                    <TouchableOpacity
                      style={styles.qrBtn}
                      onPress={() => navigation.navigate('Certificate', {
                        cert: {
                          certificate_no: item.certificate.certificate_no,
                          valid_until: item.certificate.valid_until,
                          qr_data_url: item.certificate.qr_data_url,
                          log: { test_result: item.certificate.test_result, qr_payload: item.certificate.qr_payload }
                        }
                      })}
                    >
                      <Text style={styles.qrBtnText}>🔍 QR Certificate</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.renewBtn}
                    onPress={() => {
                      setNewAppt(a => ({ ...a, instrument_id: item.id || item._id }));
                      setShowBookModal(true);
                    }}
                  >
                    <Text style={styles.renewBtnText}>📅 Book Inspection</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <TouchableOpacity
              style={[styles.actionAddBtn, { backgroundColor: GREEN }]}
              onPress={() => setShowBookModal(true)}
            >
              <Text style={styles.actionAddBtnText}>+ Book New Inspection</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📅</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>No Appointments Booked</Text>
              <Text style={{ color: '#777', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                Schedule a field visit for an inspector to verify and stamp your weighing instruments.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.machineTitle}>
                    {item.make ? `${item.make} ${item.model}` : 'General Verification'}
                  </Text>
                  <Text style={styles.machineSub}>Purpose: {item.purpose?.replace('_', ' ')}</Text>
                </View>
                <View style={[styles.badge, styles.badgePending]}>
                  <Text style={[styles.badgeText, styles.textPending]}>{item.status || 'PENDING'}</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <Text style={styles.detailText}>
                  Date: <Text style={{ fontWeight: 'bold' }}>{item.preferred_date || '—'}</Text>
                </Text>
                <Text style={styles.detailText}>
                  Slot: <Text style={{ fontWeight: 'bold' }}>{item.preferred_time || 'Morning'}</Text>
                </Text>
                <Text style={styles.detailText}>
                  Inspector:{' '}
                  <Text style={{ fontWeight: 'bold', color: item.inspector_name ? NAVY : '#888' }}>
                    {item.inspector_name || 'Pending Assignment'}
                  </Text>
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal: Register New Machine */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Register New Instrument</Text>

            <ScrollView style={{ maxHeight: 380 }}>
              <Text style={styles.fieldLabel}>Make / Brand *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Essae, Avery, Crown"
                value={newMachine.make}
                onChangeText={t => setNewMachine(m => ({ ...m, make: t }))}
              />

              <Text style={styles.fieldLabel}>Model *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. DS-852, WT-50"
                value={newMachine.model}
                onChangeText={t => setNewMachine(m => ({ ...m, model: t }))}
              />

              <Text style={styles.fieldLabel}>Serial Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Unique equipment S/N"
                value={newMachine.serial_no}
                onChangeText={t => setNewMachine(m => ({ ...m, serial_no: t }))}
              />

              <Text style={styles.fieldLabel}>Capacity</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 50"
                keyboardType="numeric"
                value={newMachine.capacity}
                onChangeText={t => setNewMachine(m => ({ ...m, capacity: t }))}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleAddMachine}
                disabled={submittingMachine}
              >
                {submittingMachine ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitModalText}>Save Instrument</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Book Appointment */}
      <Modal visible={showBookModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Book Inspection Visit</Text>

            <ScrollView style={{ maxHeight: 360 }}>
              <Text style={styles.fieldLabel}>Preferred Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 2026-09-25"
                value={newAppt.preferred_date}
                onChangeText={t => setNewAppt(a => ({ ...a, preferred_date: t }))}
              />

              <Text style={styles.fieldLabel}>Preferred Slot</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 10:00 AM - 1:00 PM"
                value={newAppt.preferred_time}
                onChangeText={t => setNewAppt(a => ({ ...a, preferred_time: t }))}
              />

              <Text style={styles.fieldLabel}>Notes for Inspector</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Shop location or special instructions"
                multiline
                value={newAppt.vendor_notes}
                onChangeText={t => setNewAppt(a => ({ ...a, vendor_notes: t }))}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowBookModal(false)}
              >
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleBookAppointment}
                disabled={submittingAppt}
              >
                {submittingAppt ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitModalText}>Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: SAFFRON,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerRole: { color: '#fff', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  bizName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  gstinText: { color: '#fff', fontSize: 12, marginTop: 1, opacity: 0.9 },
  logoutBtn: { backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  logoutBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  alertBanner: { backgroundColor: '#fee2e2', borderBottomWidth: 1, borderColor: '#fca5a5', padding: 10, alignItems: 'center' },
  alertText: { color: '#991b1b', fontSize: 12, fontWeight: 'bold' },

  kpiRow: { flexDirection: 'row', padding: 12, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 10, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#e5e7eb' },
  kpiIcon: { fontSize: 16, marginBottom: 2 },
  kpiVal: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  kpiLabel: { fontSize: 10, color: '#666', fontWeight: '600' },

  tabBar: { flexDirection: 'row', backgroundColor: '#e5e7eb', marginHorizontal: 12, borderRadius: 8, padding: 3 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTabItem: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  activeTabText: { color: SAFFRON, fontWeight: 'bold' },

  actionAddBtn: { backgroundColor: SAFFRON, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  actionAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  machineTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  machineSub: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeSoon: { backgroundColor: '#fef3c7' },
  badgeExpired: { backgroundColor: '#fee2e2' },
  badgePending: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  textActive: { color: '#15803d' },
  textSoon: { color: '#b45309' },
  textExpired: { color: '#b91c1c' },
  textPending: { color: '#475569' },

  cardDetails: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#f1f5f9', gap: 3 },
  detailText: { fontSize: 12, color: '#555' },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  qrBtn: { flex: 1, backgroundColor: '#e0f2fe', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bae6fd' },
  qrBtnText: { color: '#0369a1', fontSize: 12, fontWeight: 'bold' },
  renewBtn: { flex: 1, backgroundColor: '#f0fdf4', paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  renewBtnText: { color: GREEN, fontSize: 12, fontWeight: 'bold' },

  emptyBox: { backgroundColor: '#fff', borderRadius: 12, padding: 32, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: SAFFRON, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelModalBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  cancelModalText: { color: '#666', fontWeight: 'bold' },
  submitModalBtn: { flex: 1, backgroundColor: SAFFRON, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  submitModalText: { color: '#fff', fontWeight: 'bold' }
});
