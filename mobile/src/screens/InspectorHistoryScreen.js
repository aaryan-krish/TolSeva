import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
  ScrollView, SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getInspectorHistory, getInspectorReports, fileEnforcementReport } from '../services/api';

const SAFFRON = '#FF9933';
const NAVY    = '#003087';
const GREEN   = '#138808';

const REPORT_CATEGORIES = [
  'UNVERIFIED_INSTRUMENT_IN_USE',
  'SHORT_WEIGHT_FRAUD',
  'TAMPERED_SEAL',
  'NON_STANDARD_UNITS',
  'PACKAGED_COMMODITY_VIOLATION',
  'OVERCHARGING_MRP',
  'OTHER'
];

function ResultBadge({ result }) {
  const colors = {
    PASS:             { bg: '#dcfce7', text: '#15803d' },
    CONDITIONAL_PASS: { bg: '#fef3c7', text: '#b45309' },
    FAIL:             { bg: '#fee2e2', text: '#b91c1c' }
  };
  const c = colors[result] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>
        {(result || 'N/A').replace('_', ' ')}
      </Text>
    </View>
  );
}

function HistoryCard({ item }) {
  const date = item.verified_at ? new Date(item.verified_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '—';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.make} {item.model}</Text>
          <Text style={styles.cardSub}>S/N: {item.serial_no} • {item.instrument_type}</Text>
        </View>
        <ResultBadge result={item.test_result} />
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>🏪 {item.business_name}</Text>
        {item.city ? <Text style={styles.detailText}>📍 {item.city}</Text> : null}
        <Text style={styles.detailText}>📅 Verified: {date}</Text>
        {item.certificate_no && (
          <Text style={[styles.detailText, { fontFamily: 'monospace', marginTop: 2 }]}>
            🏅 {item.certificate_no}
          </Text>
        )}
        {item.valid_until && (
          <Text style={styles.detailText}>
            ✅ Valid Until: {new Date(item.valid_until).toLocaleDateString('en-IN')}
          </Text>
        )}
      </View>
    </View>
  );
}

function ReportCard({ item }) {
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '—';
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { flex: 1 }]}>
          {item.category?.replace(/_/g, ' ')}
        </Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'OPEN' ? '#fef3c7' : '#dcfce7' }]}>
          <Text style={[styles.badgeText, { color: item.status === 'OPEN' ? '#b45309' : '#15803d' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.reportDesc}>{item.description}</Text>
      <Text style={[styles.detailText, { marginTop: 6 }]}>📅 Filed: {date}</Text>
    </View>
  );
}

export default function InspectorHistoryScreen() {
  const { auth } = useAuth();
  const [activeTab, setActiveTab]       = useState('history'); // 'history' | 'reports'
  const [history, setHistory]           = useState([]);
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showReportModal, setShowReportModal] = useState(false);

  // New report form
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORIES[0]);
  const [reportDesc, setReportDesc]         = useState('');
  const [reportVendorId, setReportVendorId] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [hRes, rRes] = await Promise.all([
        getInspectorHistory().catch(() => ({ data: { history: [] } })),
        getInspectorReports().catch(() => ({ data: { complaints: [] } }))
      ]);
      setHistory(hRes.data?.history || []);
      setReports(rRes.data?.complaints || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  async function handleFileReport() {
    if (!reportDesc.trim()) {
      Alert.alert('Required', 'Please describe the violation.');
      return;
    }
    setSubmittingReport(true);
    try {
      await fileEnforcementReport({
        category: reportCategory,
        description: reportDesc.trim(),
        vendorId: reportVendorId.trim() || undefined
      });
      Alert.alert('Report Filed', 'Enforcement report submitted for supervisory review.');
      setShowReportModal(false);
      setReportDesc('');
      setReportVendorId('');
      fetchAll();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  }

  // Filtered history by search
  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.make || '').toLowerCase().includes(q) ||
      (item.model || '').toLowerCase().includes(q) ||
      (item.serial_no || '').toLowerCase().includes(q) ||
      (item.business_name || '').toLowerCase().includes(q) ||
      (item.certificate_no || '').toLowerCase().includes(q) ||
      (item.city || '').toLowerCase().includes(q)
    );
  });

  // KPI stats derived from history
  const totalCerts  = history.filter(h => ['PASS', 'CONDITIONAL_PASS'].includes(h.test_result)).length;
  const failedInsp  = history.filter(h => h.test_result === 'FAIL').length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{history.length}</Text>
          <Text style={styles.statLabel}>Inspections</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={[styles.statVal, { color: GREEN }]}>{totalCerts}</Text>
          <Text style={styles.statLabel}>Certs Issued</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={[styles.statVal, { color: '#dc2626' }]}>{failedInsp}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={[styles.statVal, { color: '#b45309' }]}>{reports.length}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'history' && styles.activeTabItem]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            🏅 Certificates ({history.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'reports' && styles.activeTabItem]}
          onPress={() => setActiveTab('reports')}
        >
          <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
            📋 Reports ({reports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar (history tab only) */}
      {activeTab === 'history' && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by instrument, business, certificate…"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={SAFFRON} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : activeTab === 'history' ? (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matches found' : 'No inspections yet'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <HistoryCard item={item} />}
        />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id || item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.fileReportBtn}
              onPress={() => setShowReportModal(true)}
            >
              <Text style={styles.fileReportBtnText}>+ File Enforcement Report</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No enforcement reports filed</Text>
            </View>
          }
          renderItem={({ item }) => <ReportCard item={item} />}
        />
      )}

      {/* File Report Modal */}
      <Modal visible={showReportModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>File Enforcement Report</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.fieldLabel}>Violation Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {REPORT_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, reportCategory === cat && styles.catChipActive]}
                      onPress={() => setReportCategory(cat)}
                    >
                      <Text style={[styles.catChipText, reportCategory === cat && styles.catChipTextActive]}>
                        {cat.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Vendor ID (optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. vend-123 or GSTIN"
                value={reportVendorId}
                onChangeText={setReportVendorId}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Description of Violation *</Text>
              <TextInput
                style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Describe the violation observed during field inspection…"
                value={reportDesc}
                onChangeText={setReportDesc}
                multiline
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submittingReport && { opacity: 0.5 }]}
                onPress={handleFileReport}
                disabled={submittingReport}
              >
                {submittingReport
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitBtnText}>Submit Report</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },

  statsBar: {
    flexDirection: 'row', backgroundColor: SAFFRON,
    paddingVertical: 12, paddingHorizontal: 8
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginTop: 1 },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#e5e7eb',
    margin: 12, borderRadius: 8, padding: 3
  },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeTabItem: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontSize: 12, color: '#6b7280', fontWeight: '600' },
  activeTabText: { color: NAVY, fontWeight: 'bold' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 4, gap: 6
  },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 13,
    backgroundColor: '#fff', color: '#1f2937'
  },
  clearBtn: { padding: 6 },
  clearBtnText: { color: '#9ca3af', fontWeight: 'bold' },

  list: { padding: 12, paddingTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#666' },

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  cardSub: { fontSize: 11, color: '#666', marginTop: 2 },
  cardDetails: { gap: 3 },
  detailText: { fontSize: 12, color: '#555' },
  reportDesc: { fontSize: 13, color: '#374151', marginTop: 4, lineHeight: 18 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  emptyBox: { alignItems: 'center', paddingTop: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: 'bold', color: '#374151' },

  fileReportBtn: {
    backgroundColor: NAVY, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginBottom: 12
  },
  fileReportBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 16 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 8 },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: NAVY, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 10 },
  modalInput: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, backgroundColor: '#fafafa'
  },
  catChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb'
  },
  catChipActive: { backgroundColor: NAVY, borderColor: NAVY },
  catChipText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 8,
    borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center'
  },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  submitBtn: {
    flex: 1, backgroundColor: NAVY,
    paddingVertical: 11, borderRadius: 8, alignItems: 'center'
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold' }
});
