import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function HeadteacherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRound, setActiveRound] = useState<any>(null);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [reopenNote, setReopenNote] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, schools(*, circuits(name))')
        .eq('id', user.id)
        .single();

      if (profile?.schools) {
        setSchoolData(profile.schools);
      }

      // Query active round
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('is_active', true)
        .single();

      setActiveRound(round);

      if (round && profile?.school_id) {
        // Query submission
        const { data: sub } = await supabase
          .from('submissions')
          .select('*, submission_levels(level_key)')
          .eq('round_id', round.id)
          .eq('school_id', profile.school_id)
          .single();

        setCurrentSubmission(sub);

        // Check if reopened in audit log
        if (sub?.status === 'reopened') {
          const { data: log } = await supabase
            .from('audit_log')
            .select('details')
            .eq('target_id', sub.id)
            .eq('action', 'reopen_submission')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (log?.details?.reason) {
            setReopenNote(log.details.reason);
          }
        }
      }
    } catch (err) {
      console.error('Error loading mobile dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    if (!currentSubmission) {
      return { label: 'Not Started', bg: THEME.colors.warningBg, color: THEME.colors.warning };
    }
    switch (currentSubmission.status) {
      case 'submitted':
        return { label: 'Submitted & Locked', bg: THEME.colors.successBg, color: THEME.colors.success };
      case 'reopened':
        return { label: 'Reopened by Admin', bg: '#EFF8FF', color: THEME.colors.midBlue };
      case 'draft':
      default:
        return { label: 'Draft in Progress', bg: THEME.colors.warningBg, color: THEME.colors.warning };
    }
  };

  const status = getStatusBadge();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
            }}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={THEME.colors.navy} />
            <Text style={styles.loadingText}>Loading School Data...</Text>
          </View>
        ) : (
          <>
            {/* Active Collection Round Banner */}
            {activeRound ? (
              <View style={styles.roundCard}>
                <View style={styles.roundHeaderRow}>
                  <View style={styles.roundIconWrap}>
                    <Ionicons name="calendar" size={20} color={THEME.colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roundTag}>ACTIVE DATA COLLECTION ROUND</Text>
                    <Text style={styles.roundTitle}>{activeRound.title}</Text>
                  </View>
                </View>
                <View style={styles.deadlineContainer}>
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deadlineText}>
                    Deadline: {new Date(activeRound.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noRoundCard}>
                <Ionicons name="information-circle-outline" size={24} color={THEME.colors.textMuted} />
                <Text style={styles.noRoundText}>No active data collection round at this time.</Text>
              </View>
            )}

            {/* Reopened Alert */}
            {reopenNote ? (
              <View style={styles.reopenAlert}>
                <Ionicons name="alert-circle" size={22} color={THEME.colors.midBlue} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reopenTitle}>Submission Reopened by Directorate</Text>
                  <Text style={styles.reopenReason}>{reopenNote}</Text>
                </View>
              </View>
            ) : null}

            {/* Submission Status Action Card */}
            <View style={styles.actionCard}>
              <View style={styles.statusHeader}>
                <Text style={styles.cardHeaderTitle}>Your Annual Return Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <Text style={styles.cardBodyText}>
                {currentSubmission?.status === 'submitted'
                  ? 'Your submission is safely registered with the Planning & Statistics Unit. You can view your summary receipt at any time.'
                  : 'Complete your school statistics step by step. Your draft is automatically saved as you enter figures.'}
              </Text>

              {currentSubmission?.status === 'submitted' ? (
                <TouchableOpacity
                  style={styles.receiptBtn}
                  onPress={() => router.push('/(headteacher)/submissions')}
                >
                  <Ionicons name="receipt-outline" size={18} color={THEME.colors.navy} />
                  <Text style={styles.receiptBtnText}>View Official Receipt</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => router.push('/(headteacher)/form')}
                >
                  <Text style={styles.primaryActionText}>
                    {currentSubmission ? 'Continue Data Collection' : 'Start Annual Data Return'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>

            {/* School Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {schoolData?.status === 'public' ? 'Public' : 'Private'}
                </Text>
                <Text style={styles.statLbl}>School Status</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>
                  {currentSubmission?.submission_levels?.length || (schoolData?.levels?.length || 0)}
                </Text>
                <Text style={styles.statLbl}>Levels Run</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{schoolData?.emis_code || 'None'}</Text>
                <Text style={styles.statLbl}>EMIS Code</Text>
              </View>
            </View>

            {/* Offline Support Card */}
            <View style={styles.supportCard}>
              <Ionicons name="cloud-offline-outline" size={24} color={THEME.colors.midBlue} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.supportTitle}>Offline-Resilient System</Text>
                <Text style={styles.supportSub}>
                  You can fill the form in remote areas. Your figures are saved locally and synced once you connect.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.colors.textMuted,
  },
  roundCard: {
    backgroundColor: THEME.colors.navy,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: THEME.colors.gold,
  },
  roundHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roundTag: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.gold,
    letterSpacing: 0.5,
  },
  roundTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  deadlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noRoundCard: {
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  noRoundText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    flex: 1,
  },
  reopenAlert: {
    backgroundColor: '#EFF8FF',
    borderWidth: 1.5,
    borderColor: THEME.colors.midBlue,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reopenTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  reopenReason: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  actionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBodyText: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  primaryActionBtn: {
    backgroundColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: THEME.colors.gold,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  receiptBtn: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1.5,
    borderColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  receiptBtnText: {
    color: THEME.colors.navy,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  statLbl: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  supportCard: {
    backgroundColor: '#F0F5FF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E1FD',
  },
  supportTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  supportSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
});
