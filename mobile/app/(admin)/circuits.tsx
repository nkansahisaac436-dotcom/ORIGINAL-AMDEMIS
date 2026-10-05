import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function AdminCircuitsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [circuits, setCircuits] = useState<any[]>([]);

  useEffect(() => {
    loadCircuits();
  }, []);

  const loadCircuits = async () => {
    try {
      const { data: circuitList } = await supabase
        .from('circuits')
        .select('*, schools(id, is_active)')
        .order('name');

      setCircuits(circuitList || []);
    } catch (err) {
      console.error('Error loading circuits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={circuits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCircuits();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>District Circuits Directory</Text>
            <Text style={styles.headerSub}>
              Administrative clusters under the Atwima Mponua Education Directorate.
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No circuits registered yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const activeSchools =
            item.schools?.filter((s: any) => s.is_active).length || 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name="map" size={20} color={THEME.colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.circuitName}>{item.name}</Text>
                  <Text style={styles.circuitOfficer}>
                    Officer: {item.officer_name || 'Planning Directorate'}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeSchools} Schools</Text>
                </View>
              </View>
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
  list: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  circuitName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  circuitOfficer: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EFF8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B2DDFF',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.midBlue,
  },
});
