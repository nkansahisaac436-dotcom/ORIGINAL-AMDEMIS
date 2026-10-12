import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalCircuits: 0,
    submittedCount: 0,
    draftCount: 0,
    completionRate: 0,
  });
  const [activeRound, setActiveRound] = useState<any>(null);

  // Create / Edit Collection Round Modal
  const [roundModalVisible, setRoundModalVisible] = useState(false);
  const [roundTitle, setRoundTitle] = useState('');
  const [roundYear, setRoundYear] = useState('2025/2026');
  const [roundTerm, setRoundTerm] = useState('Term 1');
  const [roundDeadline, setRoundDeadline] = useState('');
  const [savingRound, setSavingRound] = useState(false);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      // 1. Query active round from Supabase
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      setActiveRound(round || null);

      // Counts
      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: circuitsCount } = await supabase
        .from('circuits')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      let submitted = 0;
      let draft = 0;

      if (round) {
        const { count: subCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('round_id', round.id)
          .eq('status', 'submitted');

        const { count: drfCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('round_id', round.id)
          .eq('status', 'draft');

        submitted = subCount || 0;
        draft = drfCount || 0;
      }

      const total = schoolsCount || 0;
      const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

      setStats({
        totalSchools: total,
        totalCircuits: circuitsCount || 0,
        submittedCount: submitted,
        draftCount: draft,
        completionRate: rate,
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenRoundModal = () => {
    if (activeRound) {
      setRoundTitle(activeRound.title || '');
      setRoundYear(activeRound.academic_year || '2025/2026');
      setRoundTerm(activeRound.term || 'Term 1');
      setRoundDeadline(
        activeRound.deadline ? new Date(activeRound.deadline).toISOString().split('T')[0] : ''
      );
    } else {
      setRoundTitle('2025/2026 Annual School Census');
      setRoundYear('2025/2026');
      setRoundTerm('Term 1');
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setRoundDeadline(d.toISOString().split('T')[0]);
    }
    setRoundModalVisible(true);
  };

  const handleSaveRound = async () => {
    if (!roundTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the collection round.');
      return;
    }
    setSavingRound(true);
    try {
      if (activeRound) {
        const { error } = await supabase
          .from('rounds')
          .update({
            title: roundTitle.trim(),
            academic_year: roundYear.trim(),
            term: roundTerm.trim(),
            deadline: roundDeadline ? new Date(roundDeadline).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeRound.id);
        if (error) throw error;
        Alert.alert('Success', 'Collection round updated.');
      } else {
        await supabase.from('rounds').update({ is_active: false }).eq('is_active', true);
        const { error } = await supabase.from('rounds').insert({
          title: roundTitle.trim(),
          academic_year: roundYear.trim(),
          term: roundTerm.trim(),
          deadline: roundDeadline ? new Date(roundDeadline).toISOString() : null,
          is_active: true,
          start_date: new Date().toISOString(),
        });
        if (error) throw error;
        Alert.alert('Success', 'New collection round activated!');
      }
      setRoundModalVisible(false);
      loadAdminStats();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save collection round.');
    } finally {
      setSavingRound(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAdminStats();
            }}
          />
        }
      >
        {/* Active Round Banner */}
        <View style={styles.roundBanner}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.bannerTag}>ACTIVE COLLECTION ROUND</Text>
              <Text style={styles.bannerTitle}>
                {activeRound?.title || 'No Active Collection Round'}
              </Text>
              {activeRound?.deadline && (
                <Text style={styles.bannerDeadline}>
                  Deadline: {new Date(activeRound.deadline).toLocaleDateString('en-GB')}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.roundActionBtn}
              onPress={handleOpenRoundModal}
            >
              <Ionicons
                name={activeRound ? 'create-outline' : 'add'}
                size={16}
                color={THEME.colors.navy}
              />
              <Text style={styles.roundActionBtnText}>
                {activeRound ? 'Edit Round' : 'New Round'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 30 }} />
        ) : (
          <>
            {/* KPI Progress Card */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <Text style={styles.kpiTitle}>District Return Rate</Text>
                <Text style={styles.kpiPercent}>{stats.completionRate}%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${stats.completionRate}%` }]} />
              </View>
              <Text style={styles.kpiSub}>
                {stats.submittedCount} of {stats.totalSchools} schools have finalized their annual return.
              </Text>
            </View>

            {/* Quick Metrics Grid */}
            <View style={styles.grid2}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{stats.totalSchools}</Text>
                <Text style={styles.metricLbl}>Active Schools</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{stats.totalCircuits}</Text>
                <Text style={styles.metricLbl}>Circuits</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: THEME.colors.success }]}>
                  {stats.submittedCount}
                </Text>
                <Text style={styles.metricLbl}>Submitted</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={[styles.metricVal, { color: THEME.colors.warning }]}>
                  {stats.draftCount}
                </Text>
                <Text style={styles.metricLbl}>Drafts in Progress</Text>
              </View>
            </View>

            {/* Quick Shortcuts */}
            <Text style={styles.sectionHeading}>District Management</Text>
            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/(admin)/schools')}
            >
              <View style={styles.navIconWrap}>
                <Ionicons name="school" size={20} color={THEME.colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navTitle}>Schools & Login PINs</Text>
                <Text style={styles.navSub}>Add schools, issue PINs, reset PINs</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/(admin)/submissions')}
            >
              <View style={styles.navIconWrap}>
                <Ionicons name="document-text" size={20} color={THEME.colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navTitle}>Review Submissions</Text>
                <Text style={styles.navSub}>Verify returns, reopen forms for correction</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navCard}
              onPress={() => router.push('/(admin)/circuits')}
            >
              <View style={styles.navIconWrap}>
                <Ionicons name="map" size={20} color={THEME.colors.navy} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navTitle}>Circuits Directory</Text>
                <Text style={styles.navSub}>District administrative clusters</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Create / Edit Collection Round Modal */}
      <Modal
        visible={roundModalVisible}
        animationType="slide"
        onRequestClose={() => setRoundModalVisible(false)}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          <View style={styles.fullScreenHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.fullScreenTitle}>
                {activeRound ? 'Edit Collection Round' : 'Create Collection Round'}
              </Text>
              <Text style={styles.fullScreenSubtitle}>
                Annual census cycle for Atwima Mponua District schools.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setRoundModalVisible(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={24} color={THEME.colors.navy} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.fullScreenBody}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>Round Title *</Text>
              <TextInput
                style={styles.fullScreenInput}
                placeholder="e.g. 2025/2026 Annual School Census"
                placeholderTextColor={THEME.colors.textMuted}
                value={roundTitle}
                onChangeText={setRoundTitle}
                autoFocus
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Academic Year *</Text>
              <TextInput
                style={styles.fullScreenInput}
                placeholder="e.g. 2025/2026"
                placeholderTextColor={THEME.colors.textMuted}
                value={roundYear}
                onChangeText={setRoundYear}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>School Term *</Text>
              <TextInput
                style={styles.fullScreenInput}
                placeholder="e.g. Term 1"
                placeholderTextColor={THEME.colors.textMuted}
                value={roundTerm}
                onChangeText={setRoundTerm}
                returnKeyType="next"
              />

              <Text style={styles.fieldLabel}>Submission Deadline (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fullScreenInput}
                placeholder="e.g. 2026-11-30"
                placeholderTextColor={THEME.colors.textMuted}
                value={roundDeadline}
                onChangeText={setRoundDeadline}
                returnKeyType="done"
                onSubmitEditing={handleSaveRound}
              />
              <Text style={styles.inputHelper}>
                After this deadline, schools cannot submit without an administrator extension.
              </Text>
            </ScrollView>

            <View style={styles.fullScreenFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRoundModalVisible(false)}
                disabled={savingRound}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveRound}
                disabled={savingRound || !roundTitle.trim()}
              >
                {savingRound ? (
                  <ActivityIndicator size="small" color={THEME.colors.navy} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {activeRound ? 'Save Changes' : 'Activate Round'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  roundBanner: {
    backgroundColor: THEME.colors.navy,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: THEME.colors.gold,
  },
  bannerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.gold,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  bannerDeadline: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  kpiCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  kpiPercent: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.navy,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.goldDark,
  },
  kpiSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    width: '48%',
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.navy,
  },
  metricLbl: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  navCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  navIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  navSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  roundActionBtn: {
    backgroundColor: THEME.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  roundActionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  fullScreenSubtitle: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  fullScreenBody: {
    padding: 16,
    paddingBottom: 140,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.navy,
    marginBottom: 8,
    marginTop: 10,
  },
  fullScreenInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    color: THEME.colors.text,
  },
  inputHelper: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  fullScreenFooter: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: '#F8FAFC',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: THEME.colors.gold,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#B8860B',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
});
