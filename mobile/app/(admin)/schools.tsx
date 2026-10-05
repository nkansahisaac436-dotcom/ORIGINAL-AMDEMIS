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
import { generateAndSharePinSlip } from '../../src/lib/pdf-generator';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function AdminSchoolsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Reset PIN modal
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [newGeneratedPin, setNewGeneratedPin] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const { data } = await supabase
        .from('schools')
        .select('*, circuits(name)')
        .order('name');

      setSchools(data || []);
    } catch (err) {
      console.error('Error loading schools:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school_login_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.circuits?.name && s.circuits.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleResetPin = async (sch: any) => {
    setSelectedSchool(sch);
    setResetModalVisible(true);
    setNewGeneratedPin('');
  };

  const executeResetPin = async () => {
    if (!selectedSchool) return;
    setResetting(true);
    try {
      // Generate 6-digit random PIN
      const randomPin = Math.floor(100000 + Math.random() * 900000).toString();

      // Look up headteacher profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', selectedSchool.id)
        .single();

      if (!prof) {
        throw new Error('No headteacher account found for this school.');
      }

      // Call supabase function or update profile
      const { error } = await supabase.auth.admin.updateUserById(prof.id, {
        password: randomPin,
      });

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ is_initial_pin: true, failed_login_attempts: 0, locked_until: null })
        .eq('id', prof.id);

      setNewGeneratedPin(randomPin);
    } catch (err: any) {
      // Fallback: If service role is required, advise officer
      Alert.alert(
        'PIN Reset Info',
        err.message ||
          'Reset initiated. Ensure service role privileges are active or perform reset in Web Admin.'
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search school name, circuit, or AMD ID..."
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredSchools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSchools();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No matching schools found.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.schoolCard}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolName}>{item.name}</Text>
                <Text style={styles.circuitName}>
                  {item.circuits?.name || 'Unassigned'} Circuit &bull; {item.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>{item.school_login_id}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  generateAndSharePinSlip({
                    schoolName: item.name,
                    circuitName: item.circuits?.name || 'District',
                    loginId: item.school_login_id,
                    pin: '••••••',
                  })
                }
              >
                <Ionicons name="print-outline" size={16} color={THEME.colors.navy} />
                <Text style={styles.actionBtnText}>PIN Slip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.resetBtn]}
                onPress={() => handleResetPin(item)}
              >
                <Ionicons name="refresh-outline" size={16} color={THEME.colors.error} />
                <Text style={[styles.actionBtnText, { color: THEME.colors.error }]}>Reset PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Reset PIN Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset School Login PIN</Text>
            <Text style={styles.modalSchool}>{selectedSchool?.name}</Text>
            <Text style={styles.modalSub}>
              This will immediately invalidate the headteacher's current PIN and generate a new 6-digit PIN.
            </Text>

            {newGeneratedPin ? (
              <View style={styles.newPinBox}>
                <Text style={styles.newPinLbl}>NEW 6-DIGIT PIN</Text>
                <Text style={styles.newPinVal}>{newGeneratedPin}</Text>
                <TouchableOpacity
                  style={styles.printSlipBtn}
                  onPress={() => {
                    generateAndSharePinSlip({
                      schoolName: selectedSchool.name,
                      circuitName: selectedSchool.circuits?.name || 'District',
                      loginId: selectedSchool.school_login_id,
                      pin: newGeneratedPin,
                    });
                  }}
                >
                  <Ionicons name="print" size={18} color="#FFFFFF" />
                  <Text style={styles.printSlipText}>Print Official Slip</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.confirmResetBtn}
                onPress={executeResetPin}
                disabled={resetting}
              >
                {resetting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmResetText}>Generate New PIN</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setResetModalVisible(false)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.text,
  },
  list: {
    paddingHorizontal: 16,
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
  schoolCard: {
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
  idBadge: {
    backgroundColor: '#EFF8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B2DDFF',
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.midBlue,
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
  resetBtn: {
    borderColor: THEME.colors.error,
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
    marginBottom: 16,
  },
  newPinBox: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1.5,
    borderColor: THEME.colors.navy,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  newPinLbl: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
  },
  newPinVal: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: THEME.colors.navy,
    marginVertical: 8,
  },
  printSlipBtn: {
    backgroundColor: THEME.colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  printSlipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  confirmResetBtn: {
    backgroundColor: THEME.colors.error,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmResetText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeModalText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
