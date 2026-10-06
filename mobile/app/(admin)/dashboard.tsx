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
import { DEMO_ACCOUNTS, getDemoSession } from '../../src/lib/demo-data';
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

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      // 1. Check demo session
      const demo = await getDemoSession();
      if (demo?.role === 'super_admin') {
        setActiveRound(DEMO_ACCOUNTS.activeRound);
        setStats({
          totalSchools: 24,
          totalCircuits: 3,
          submittedCount: 18,
          draftCount: 4,
          completionRate: 75,
        });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 2. Query active round from Supabase
      const { data: round } = await supabase
        .from('rounds')
        .select('*')
        .eq('is_active', true)
        .single();

      setActiveRound(round || DEMO_ACCOUNTS.activeRound);

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

      const total = schoolsCount || 2;
      const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;

      setStats({
        totalSchools: total,
        totalCircuits: circuitsCount || 3,
        submittedCount: submitted,
        draftCount: draft,
        completionRate: rate,
      });
    } catch (err) {
      console.error('Error loading admin stats:', err);
      // Demo Fallback
      setActiveRound(DEMO_ACCOUNTS.activeRound);
      setStats({
        totalSchools: 24,
        totalCircuits: 3,
        submittedCount: 18,
        draftCount: 4,
        completionRate: 75,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
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
                <Text style={styles.navSub}>Generate slips, reset PINs, view profiles</Text>
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
});
