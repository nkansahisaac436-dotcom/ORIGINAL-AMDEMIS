import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { generateAndShareReceipt } from '../../src/lib/pdf-generator';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function HeadteacherSubmissionsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
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

      if (!profile?.school_id) return;
      setSchool(profile.schools);

      const { data: list } = await supabase
        .from('submissions')
        .select('*, rounds(title, deadline)')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false });

      setSubmissions(list || []);
    } catch (err) {
      console.error('Error loading submissions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      schoolName: school?.name || 'School',
      circuitName: school?.circuits?.name || 'Circuit',
      roundTitle: item.rounds?.title || 'Academic Year',
      headteacherName: data.headteacherName || school?.headteacher_name || 'Headteacher',
      phone: data.phone || school?.headteacher_phone || 'N/A',
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
      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSubmissions();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Submission History & Receipts</Text>
            <Text style={styles.headerSub}>
              All annual statistical filings registered by this school with the Directorate.
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={40} color={THEME.colors.textMuted} />
              <Text style={styles.emptyText}>No submissions found yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isSubmitted = item.status === 'submitted';
          return (
            <View style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roundTitle}>{item.rounds?.title || 'Collection Round'}</Text>
                  <Text style={styles.dateText}>
                    Last modified:{' '}
                    {new Date(item.updated_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
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
                    {isSubmitted ? 'Submitted' : item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.receiptActionBtn}
                onPress={() => handlePrintReceipt(item)}
              >
                <Ionicons name="receipt-outline" size={16} color={THEME.colors.navy} />
                <Text style={styles.receiptActionText}>Download / Share Receipt PDF</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  headerSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.colors.textMuted,
    marginTop: 10,
  },
  itemCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roundTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  dateText: {
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
  receiptActionBtn: {
    backgroundColor: THEME.colors.background,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.navy,
  },
  receiptActionText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
});
