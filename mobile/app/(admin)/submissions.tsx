import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateAndShareReceipt } from '../../src/lib/pdf-generator';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function AdminSubmissionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'draft'>('all');

  // Reopen Modal
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [reopenModalVisible, setReopenModalVisible] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data } = await supabase
        .from('submissions')
        .select('*, schools(name, circuits(name), headteacher_name, headteacher_phone), rounds(title)')
        .order('updated_at', { ascending: false });

      setSubmissions(data || []);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredList = submissions.filter((s) => {
    if (statusFilter === 'all') return true;
    return s.status === statusFilter;
  });

  const handleOpenReopen = (sub: any) => {
    setSelectedSubmission(sub);
    setReopenReason('');
    setReopenModalVisible(true);
  };

  const executeReopen = async () => {
    if (!reopenReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for reopening this submission.');
      return;
    }

    setReopening(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'reopened' })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Log in audit log
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await supabase.from('audit_log').insert({
        user_id: user?.id,
        action: 'reopen_submission',
        target_id: selectedSubmission.id,
        details: {
          school_name: selectedSubmission.schools?.name,
          reason: reopenReason.trim(),
        },
      });

      Alert.alert('Submission Reopened', 'The school can now edit and re-submit their form.');
      setReopenModalVisible(false);
      loadSubmissions();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not reopen submission.');
    } finally {
      setReopening(false);
    }
  };

  const handlePrintReceipt = (item: any) => {
    const data = item.form_data || {};
    const totalBoys =
      (data.crecheBoys || 0) +
      (data.kg1Boys || 0) +
      (data.kg2Boys || 0) +
      (data.p1Boys || 0) +
      (data.p2Boys || 0) +
      (data.p3Boys || 0) +
      (data.p4Boys || 0) +
      (data.p5Boys || 0) +
      (data.p6Boys || 0) +
      (data.jhs1Boys || 0) +
      (data.jhs2Boys || 0) +
      (data.jhs3Boys || 0);

    const totalGirls =
      (data.crecheGirls || 0) +
      (data.kg1Girls || 0) +
      (data.kg2Girls || 0) +
      (data.p1Girls || 0) +
      (data.p2Girls || 0) +
      (data.p3Girls || 0) +
      (data.p4Girls || 0) +
      (data.p5Girls || 0) +
      (data.p6Girls || 0) +
      (data.jhs1Girls || 0) +
      (data.jhs2Girls || 0) +
      (data.jhs3Girls || 0);

    const totalTeachers =
      (data.teachersMaleTrained || 0) +
      (data.teachersMaleUntrained || 0) +
      (data.teachersFemaleTrained || 0) +
      (data.teachersFemaleUntrained || 0);

    generateAndShareReceipt({
      receiptNumber: `AMD-${item.id.substring(0, 8).toUpperCase()}`,
      schoolName: item.schools?.name || 'School',
      circuitName: item.schools?.circuits?.name || 'Circuit',
      roundTitle: item.rounds?.title || 'Academic Year',
      headteacherName: item.schools?.headteacher_name || 'Headteacher',
      phone: item.schools?.headteacher_phone || 'N/A',
      submittedAt: item.submitted_at
        ? new Date(item.submitted_at).toLocaleString('en-GB')
        : new Date(item.updated_at).toLocaleString('en-GB'),
      totalBoys,
      totalGirls,
      totalTeachers,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.filterTab, statusFilter === 'all' && styles.filterTabActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text
            style={[styles.filterTabText, statusFilter === 'all' && styles.filterTabTextActive]}
          >
            All Submissions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, statusFilter === 'submitted' && styles.filterTabActive]}
          onPress={() => setStatusFilter('submitted')}
        >
          <Text
            style={[
              styles.filterTabText,
              statusFilter === 'submitted' && styles.filterTabTextActive,
            ]}
          >
            Submitted
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, statusFilter === 'draft' && styles.filterTabActive]}
          onPress={() => setStatusFilter('draft')}
        >
          <Text
            style={[styles.filterTabText, statusFilter === 'draft' && styles.filterTabTextActive]}
          >
            Drafts
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSubmissions();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No matching submissions.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isSubmitted = item.status === 'submitted';
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schoolName}>{item.schools?.name}</Text>
                  <Text style={styles.circuitName}>
                    {item.schools?.circuits?.name || 'District'} Circuit &bull; {item.rounds?.title}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isSubmitted
                        ? THEME.colors.successBg
                        : THEME.colors.warningBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isSubmitted ? THEME.colors.success : THEME.colors.warning,
                      },
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handlePrintReceipt(item)}
                >
                  <Ionicons name="receipt-outline" size={16} color={THEME.colors.navy} />
                  <Text style={styles.actionBtnText}>Receipt PDF</Text>
                </TouchableOpacity>

                {isSubmitted && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.reopenBtn]}
                    onPress={() => handleOpenReopen(item)}
                  >
                    <Ionicons name="lock-open-outline" size={16} color={THEME.colors.warning} />
                    <Text style={[styles.actionBtnText, { color: THEME.colors.warning }]}>
                      Reopen
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Reopen Modal */}
      <Modal
        visible={reopenModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReopenModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reopen Submission Form</Text>
            <Text style={styles.modalSchool}>{selectedSubmission?.schools?.name}</Text>
            <Text style={styles.modalSub}>
              Enter the reason or instruction for the headteacher. They will be notified to make corrections and re-submit.
            </Text>

            <TextInput
              style={styles.reasonInput}
              multiline
              numberOfLines={3}
              placeholder="e.g. Please verify JHS3 Mathematics teacher count and classroom repair numbers..."
              value={reopenReason}
              onChangeText={setReopenReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReopenModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmReopenBtn}
                onPress={executeReopen}
                disabled={reopening}
              >
                {reopening ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmReopenText}>Reopen Form</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: THEME.colors.navy,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schoolName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  circuitName: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F3F8',
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.navy,
  },
  reopenBtn: {
    borderColor: THEME.colors.warning,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  modalSchool: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.midBlue,
    marginTop: 2,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    lineHeight: 16,
    marginBottom: 14,
  },
  reasonInput: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: THEME.colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  confirmReopenBtn: {
    flex: 1,
    backgroundColor: THEME.colors.warning,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmReopenText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
