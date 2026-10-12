import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateAndSharePinSlip } from '../../src/lib/pdf-generator';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function AdminSchoolsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [circuits, setCircuits] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Filters
  const [circuitFilter, setCircuitFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'public' | 'private'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'never_logged_in' | 'active' | 'locked'>('all');

  // Add School Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addName, setAddName] = useState('');
  const [addStatus, setAddStatus] = useState<'public' | 'private'>('public');
  const [addCircuitId, setAddCircuitId] = useState('');
  const [addTown, setAddTown] = useState('');
  const [addEmisCode, setAddEmisCode] = useState('');
  const [addHtName, setAddHtName] = useState('');
  const [addHtPhone, setAddHtPhone] = useState('');
  const [addLevels, setAddLevels] = useState<string[]>(['primary', 'jhs']);
  const [isSubmittingSchool, setIsSubmittingSchool] = useState(false);

  // School Created (PIN Shown Once) Modal
  const [createdModalVisible, setCreatedModalVisible] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    schoolName: string;
    circuitName: string;
    loginId: string;
    pin: string;
  } | null>(null);

  // Reset PIN modal
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [newGeneratedPin, setNewGeneratedPin] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schRes, cirRes] = await Promise.all([
        supabase.from('schools').select('*, circuits(name)').order('name'),
        supabase.from('circuits').select('id, name, is_active').order('name'),
      ]);

      setSchools(schRes.data || []);
      setCircuits(cirRes.data || []);
      if (cirRes.data && cirRes.data.length > 0 && !addCircuitId) {
        setAddCircuitId(cirRes.data[0].id);
      }
    } catch (err) {
      console.error('Error loading schools and circuits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredSchools = schools.filter((s) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.school_login_id.toLowerCase().includes(q) ||
      (s.circuits?.name && s.circuits.name.toLowerCase().includes(q));

    const matchesCircuit = circuitFilter === 'all' || s.circuit_id === circuitFilter;
    const matchesType = typeFilter === 'all' || s.status === typeFilter;

    let matchesStatus = true;
    if (statusFilter === 'locked') {
      matchesStatus = s.is_locked === true;
    } else if (statusFilter === 'active') {
      matchesStatus = s.is_active === true && !s.is_locked;
    } else if (statusFilter === 'never_logged_in') {
      matchesStatus = !s.last_login_at;
    }

    return matchesSearch && matchesCircuit && matchesType && matchesStatus;
  });

  const handleOpenAddSchool = () => {
    if (circuits.length === 0) {
      Alert.alert(
        'Add a circuit first',
        'You must register at least one district circuit before adding schools. Go to the Circuits tab to add one.',
        [{ text: 'OK' }]
      );
      return;
    }

    setAddName('');
    setAddStatus('public');
    setAddCircuitId(circuits[0]?.id || '');
    setAddTown('');
    setAddEmisCode('');
    setAddHtName('');
    setAddHtPhone('');
    setAddLevels(['primary', 'jhs']);
    setAddModalVisible(true);
  };

  const toggleLevel = (lvl: string) => {
    setAddLevels((prev) =>
      prev.includes(lvl) ? prev.filter((x) => x !== lvl) : [...prev, lvl]
    );
  };

  const handleSaveNewSchool = async () => {
    const name = addName.trim();
    if (!name) {
      Alert.alert('Validation Error', 'School name is required.');
      return;
    }
    if (!addCircuitId) {
      Alert.alert('Validation Error', 'Please select an assigned district circuit.');
      return;
    }

    setIsSubmittingSchool(true);
    try {
      // 1. Generate next sequential AMD-XXXX ID
      const { data: existingSchools } = await supabase.from('schools').select('school_login_id');
      let maxNum = 0;
      existingSchools?.forEach((s: any) => {
        const match = s.school_login_id?.match(/AMD-(\d+)/i);
        if (match) {
          const n = parseInt(match[1], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const nextId = `AMD-${String(maxNum + 1).padStart(4, '0')}`;

      // 2. Generate secure random 6-digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      // 3. Insert school record
      const { data: newSchool, error: schError } = await supabase
        .from('schools')
        .insert({
          name,
          status: addStatus,
          circuit_id: addCircuitId,
          community: addTown.trim() || null,
          emis_code: addEmisCode.trim() || null,
          headteacher_name: addHtName.trim() || null,
          headteacher_phone: addHtPhone.trim() || null,
          school_login_id: nextId,
          default_levels: addLevels,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .select('*, circuits(name)')
        .single();

      if (schError) throw schError;

      const selectedCirc = circuits.find((c) => c.id === addCircuitId);
      const circName = selectedCirc?.name || 'District Circuit';

      setCreatedResult({
        schoolName: name,
        circuitName: circName,
        loginId: nextId,
        pin,
      });

      setAddModalVisible(false);
      setCreatedModalVisible(true);
      loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not register school.');
    } finally {
      setIsSubmittingSchool(false);
    }
  };

  const handleCopyReadyMessage = async (item: {
    schoolName: string;
    loginId: string;
    pin: string;
  }) => {
    const text = `AMDEMIS login. School: ${item.schoolName}. Login ID: ${item.loginId}. PIN: ${item.pin}. Sign in at https://amdemis.local. Please change your PIN after you sign in.`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Ready-to-send login message copied to clipboard.');
  };

  const handleShareMessage = async (item: {
    schoolName: string;
    loginId: string;
    pin: string;
  }) => {
    const text = `AMDEMIS login. School: ${item.schoolName}. Login ID: ${item.loginId}. PIN: ${item.pin}. Sign in at https://amdemis.local. Please change your PIN after you sign in.`;
    try {
      await Share.share({ message: text });
    } catch {
      // User cancelled
    }
  };

  const handleResetPin = async (sch: any) => {
    setSelectedSchool(sch);
    setNewGeneratedPin('');
    setResetModalVisible(true);
  };

  const executeResetPin = async () => {
    if (!selectedSchool) return;
    setResetting(true);
    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      // Look up headteacher profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('id')
        .eq('school_id', selectedSchool.id)
        .maybeSingle();

      if (prof) {
        await supabase
          .from('profiles')
          .update({ is_initial_pin: true, failed_attempts: 0, locked_until: null })
          .eq('id', prof.id);
      }

      setNewGeneratedPin(pin);
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Could not reset PIN.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input & Add School Button */}
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={THEME.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search school name, circuit, or AMD-XXXX..."
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.addSchoolBtn} onPress={handleOpenAddSchool}>
          <Ionicons name="add" size={18} color={THEME.colors.navy} />
          <Text style={styles.addSchoolBtnText}>Add School</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text style={[styles.filterChipText, typeFilter === 'all' && styles.filterChipTextActive]}>
              All Schools ({schools.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'public' && styles.filterChipActive]}
            onPress={() => setTypeFilter('public')}
          >
            <Text style={[styles.filterChipText, typeFilter === 'public' && styles.filterChipTextActive]}>
              Public
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, typeFilter === 'private' && styles.filterChipActive]}
            onPress={() => setTypeFilter('private')}
          >
            <Text style={[styles.filterChipText, typeFilter === 'private' && styles.filterChipTextActive]}>
              Private
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'locked' && styles.filterChipActive]}
            onPress={() => setStatusFilter(statusFilter === 'locked' ? 'all' : 'locked')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'locked' && styles.filterChipTextActive]}>
              Locked Accounts
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
              loadData();
            }}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="school-outline" size={48} color={THEME.colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No matching schools found.</Text>
              {!search && (
                <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddSchool}>
                  <Ionicons name="add-circle" size={18} color={THEME.colors.navy} />
                  <Text style={styles.emptyAddBtnText}>Add a school</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.schoolCard}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolName}>{item.name}</Text>
                <Text style={styles.circuitName}>
                  {item.circuits?.name || 'Unassigned'} Circuit &bull; {item.status?.toUpperCase()}
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

      {/* Add School Modal (Full-Screen Form) */}
      <Modal visible={addModalVisible} animationType="slide">
        <SafeAreaView style={styles.formContainer}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setAddModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color={THEME.colors.navy} />
            </TouchableOpacity>
            <Text style={styles.formHeaderTitle}>Add School & Issue PIN</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.formScroll}>
            {/* School Name */}
            <Text style={styles.fieldLabel}>School Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Nyinahin D/A J.H.S."
              value={addName}
              onChangeText={setAddName}
            />

            {/* Public vs Private Status (Two Big Buttons) */}
            <Text style={styles.fieldLabel}>Institution Status *</Text>
            <View style={styles.statusButtonsRow}>
              <TouchableOpacity
                style={[styles.statusBigBtn, addStatus === 'public' && styles.statusBigBtnActive]}
                onPress={() => setAddStatus('public')}
              >
                <Ionicons
                  name="business"
                  size={20}
                  color={addStatus === 'public' ? '#FFFFFF' : THEME.colors.navy}
                />
                <Text
                  style={[styles.statusBigBtnText, addStatus === 'public' && styles.statusBigBtnTextActive]}
                >
                  Public School
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusBigBtn, addStatus === 'private' && styles.statusBigBtnActive]}
                onPress={() => setAddStatus('private')}
              >
                <Ionicons
                  name="shield"
                  size={20}
                  color={addStatus === 'private' ? '#FFFFFF' : THEME.colors.navy}
                />
                <Text
                  style={[styles.statusBigBtnText, addStatus === 'private' && styles.statusBigBtnTextActive]}
                >
                  Private Institution
                </Text>
              </TouchableOpacity>
            </View>

            {/* Circuit Selector */}
            <Text style={styles.fieldLabel}>Assigned Circuit *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {circuits.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.circuitPill, addCircuitId === c.id && styles.circuitPillActive]}
                  onPress={() => setAddCircuitId(c.id)}
                >
                  <Text style={[styles.circuitPillText, addCircuitId === c.id && styles.circuitPillTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Town / Community */}
            <Text style={styles.fieldLabel}>Town / Community (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Nyinahin"
              value={addTown}
              onChangeText={setAddTown}
            />

            {/* EMIS Code */}
            <Text style={styles.fieldLabel}>EMIS Code (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 1066320001"
              value={addEmisCode}
              onChangeText={setAddEmisCode}
              keyboardType="numeric"
            />

            {/* Headteacher Name & Phone */}
            <Text style={styles.fieldLabel}>Headteacher Full Name (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Samuel Boateng"
              value={addHtName}
              onChangeText={setAddHtName}
            />

            <Text style={styles.fieldLabel}>Headteacher Phone Number (Optional)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 0244123456"
              value={addHtPhone}
              onChangeText={setAddHtPhone}
              keyboardType="phone-pad"
            />

            {/* Starting Levels */}
            <Text style={styles.fieldLabel}>Education Levels at this School</Text>
            <View style={styles.levelsGrid}>
              {[
                { id: 'creche', label: 'Crèche / Nursery' },
                { id: 'kg', label: 'Kindergarten (KG)' },
                { id: 'primary', label: 'Primary School' },
                { id: 'jhs', label: 'Junior High (JHS)' },
              ].map((lvl) => {
                const checked = addLevels.includes(lvl.id);
                return (
                  <TouchableOpacity
                    key={lvl.id}
                    style={[styles.levelCheckItem, checked && styles.levelCheckItemActive]}
                    onPress={() => toggleLevel(lvl.id)}
                  >
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={checked ? THEME.colors.navy : THEME.colors.textMuted}
                    />
                    <Text style={styles.levelCheckLabel}>{lvl.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveSchoolBtn}
              onPress={handleSaveNewSchool}
              disabled={isSubmittingSchool}
            >
              {isSubmittingSchool ? (
                <ActivityIndicator color={THEME.colors.navy} />
              ) : (
                <Text style={styles.saveSchoolBtnText}>Create School & Issue PIN</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* School Created Screen (PIN Shown Only Once!) */}
      <Modal visible={createdModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.createdSuccessIcon}>
              <Ionicons name="checkmark-circle" size={48} color={THEME.colors.success} />
            </View>

            <Text style={styles.modalTitle}>School Created Successfully!</Text>
            <Text style={styles.createdSchoolName}>{createdResult?.schoolName}</Text>
            <Text style={styles.createdCircuit}>{createdResult?.circuitName} &bull; {createdResult?.loginId}</Text>

            <View style={styles.onceNotice}>
              <Ionicons name="warning" size={16} color={THEME.colors.warning} />
              <Text style={styles.onceNoticeText}>This PIN is shown only once. Write it down or share now.</Text>
            </View>

            <View style={styles.pinDisplayCard}>
              <Text style={styles.pinDisplayLabel}>HEADTEACHER 6-DIGIT PIN</Text>
              <Text style={styles.pinDisplayVal}>{createdResult?.pin}</Text>
            </View>

            <View style={styles.createdActionsRow}>
              <TouchableOpacity
                style={styles.createdActionBtn}
                onPress={() => createdResult && handleCopyReadyMessage(createdResult)}
              >
                <Ionicons name="copy-outline" size={18} color={THEME.colors.navy} />
                <Text style={styles.createdActionText}>Copy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createdActionBtn}
                onPress={() => createdResult && handleShareMessage(createdResult)}
              >
                <Ionicons name="share-social-outline" size={18} color={THEME.colors.navy} />
                <Text style={styles.createdActionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createdActionBtn}
                onPress={() => {
                  if (createdResult) {
                    generateAndSharePinSlip({
                      schoolName: createdResult.schoolName,
                      circuitName: createdResult.circuitName,
                      loginId: createdResult.loginId,
                      pin: createdResult.pin,
                    });
                  }
                }}
              >
                <Ionicons name="print-outline" size={18} color={THEME.colors.navy} />
                <Text style={styles.createdActionText}>Print Slip</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setCreatedModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              This will stop the old PIN working immediately, clear locks, and issue a new secure 6-digit PIN.
            </Text>

            {newGeneratedPin ? (
              <View style={styles.newPinBox}>
                <Text style={styles.newPinLbl}>NEW 6-DIGIT PIN (SHOWN ONCE)</Text>
                <Text style={styles.newPinVal}>{newGeneratedPin}</Text>

                <View style={styles.createdActionsRow}>
                  <TouchableOpacity
                    style={styles.createdActionBtn}
                    onPress={() =>
                      handleCopyReadyMessage({
                        schoolName: selectedSchool.name,
                        loginId: selectedSchool.school_login_id,
                        pin: newGeneratedPin,
                      })
                    }
                  >
                    <Ionicons name="copy-outline" size={16} color={THEME.colors.navy} />
                    <Text style={styles.createdActionText}>Copy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createdActionBtn}
                    onPress={() =>
                      handleShareMessage({
                        schoolName: selectedSchool.name,
                        loginId: selectedSchool.school_login_id,
                        pin: newGeneratedPin,
                      })
                    }
                  >
                    <Ionicons name="share-social-outline" size={16} color={THEME.colors.navy} />
                    <Text style={styles.createdActionText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.createdActionBtn}
                    onPress={() => {
                      generateAndSharePinSlip({
                        schoolName: selectedSchool.name,
                        circuitName: selectedSchool.circuits?.name || 'District',
                        loginId: selectedSchool.school_login_id,
                        pin: newGeneratedPin,
                      });
                    }}
                  >
                    <Ionicons name="print-outline" size={16} color={THEME.colors.navy} />
                    <Text style={styles.createdActionText}>Print Slip</Text>
                  </TouchableOpacity>
                </View>
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
                  <Text style={styles.confirmResetText}>Confirm & Issue New PIN</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setResetModalVisible(false)}
            >
              <Text style={styles.closeModalText}>{newGeneratedPin ? 'Done' : 'Cancel'}</Text>
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
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.text,
  },
  addSchoolBtn: {
    backgroundColor: THEME.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addSchoolBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  filterBar: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: THEME.colors.navy,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
    marginBottom: 12,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  schoolCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  idBadge: {
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  idBadgeText: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.navy,
  },
  resetBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF5F5',
  },
  formContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  formHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  formScroll: {
    padding: 16,
    paddingBottom: 50,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.text,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statusBigBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  statusBigBtnActive: {
    backgroundColor: THEME.colors.navy,
    borderColor: THEME.colors.navy,
  },
  statusBigBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  statusBigBtnTextActive: {
    color: '#FFFFFF',
  },
  circuitPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  circuitPillActive: {
    backgroundColor: THEME.colors.navy,
    borderColor: THEME.colors.navy,
  },
  circuitPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  circuitPillTextActive: {
    color: '#FFFFFF',
  },
  levelsGrid: {
    gap: 8,
    marginBottom: 20,
  },
  levelCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  levelCheckItemActive: {
    borderColor: THEME.colors.navy,
    backgroundColor: '#EFF6FF',
  },
  levelCheckLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.text,
  },
  saveSchoolBtn: {
    backgroundColor: THEME.colors.gold,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveSchoolBtnText: {
    fontSize: 15,
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
    backgroundColor: THEME.colors.surface,
    borderRadius: 18,
    padding: 20,
  },
  createdSuccessIcon: {
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: THEME.colors.navy,
    textAlign: 'center',
  },
  createdSchoolName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  createdCircuit: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  onceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 14,
  },
  onceNoticeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
  },
  pinDisplayCard: {
    backgroundColor: THEME.colors.background,
    borderWidth: 2,
    borderColor: THEME.colors.gold,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  pinDisplayLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
  },
  pinDisplayVal: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 8,
    color: THEME.colors.navy,
    marginVertical: 6,
  },
  createdActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  createdActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: '#F8FAFC',
  },
  createdActionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  doneBtn: {
    backgroundColor: THEME.colors.navy,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalSchool: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
    marginTop: 2,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 14,
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
