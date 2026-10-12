import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

export default function AdminCircuitsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [circuits, setCircuits] = useState<any[]>([]);

  // Add / Edit Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [circuitName, setCircuitName] = useState('');
  const [editingCircuit, setEditingCircuit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [expandedCircuitId, setExpandedCircuitId] = useState<string | null>(null);

  useEffect(() => {
    loadCircuits();
  }, []);

  const loadCircuits = async () => {
    try {
      const { data: circuitList } = await supabase
        .from('circuits')
        .select('*, schools(id, name, is_active, status)')
        .order('name');

      setCircuits(circuitList || []);
    } catch (err) {
      console.error('Error loading circuits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCircuit(null);
    setCircuitName('');
    setModalVisible(true);
  };

  const handleOpenEdit = (circuit: any) => {
    setEditingCircuit(circuit);
    setCircuitName(circuit.name);
    setModalVisible(true);
  };

  const handleSaveCircuit = async () => {
    const cleanName = circuitName.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
      Alert.alert('Validation Error', 'Circuit name must be between 2 and 60 characters.');
      return;
    }

    // Check case-insensitive uniqueness
    const exists = circuits.some(
      (c) =>
        c.name.toLowerCase() === cleanName.toLowerCase() &&
        (!editingCircuit || c.id !== editingCircuit.id)
    );
    if (exists) {
      Alert.alert('Already Exists', `A circuit named "${cleanName}" already exists in the district.`);
      return;
    }

    setSaving(true);
    try {
      if (editingCircuit) {
        const { error } = await supabase
          .from('circuits')
          .update({ name: cleanName, updated_at: new Date().toISOString() })
          .eq('id', editingCircuit.id);
        if (error) throw error;
        Alert.alert('Success', `Circuit renamed to "${cleanName}".`);
      } else {
        const { error } = await supabase
          .from('circuits')
          .insert({ name: cleanName, is_active: true, updated_at: new Date().toISOString() });
        if (error) throw error;
        Alert.alert('Success', `Circuit "${cleanName}" registered successfully.`);
      }

      setModalVisible(false);
      loadCircuits();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save circuit.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (circuit: any) => {
    const nextState = !circuit.is_active;
    const actionLabel = nextState ? 'Reactivate' : 'Deactivate';

    Alert.alert(
      `${actionLabel} Circuit`,
      nextState
        ? `Reactivate "${circuit.name}"? Schools in this circuit will be active.`
        : `Deactivate "${circuit.name}"? Deactivating will hide this circuit from new school registrations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabel,
          style: nextState ? 'default' : 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('circuits')
              .update({ is_active: nextState, updated_at: new Date().toISOString() })
              .eq('id', circuit.id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              loadCircuits();
            }
          },
        },
      ]
    );
  };

  const handleDeleteCircuit = (circuit: any) => {
    const schoolCount = circuit.schools?.length || 0;
    if (schoolCount > 0) {
      Alert.alert(
        'Cannot Delete Circuit',
        `This circuit contains ${schoolCount} registered school(s). Circuits with schools cannot be deleted. You can Deactivate it instead to archive it.`
      );
      return;
    }

    Alert.alert('Delete Circuit', `Are you sure you want to permanently delete "${circuit.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('circuits').delete().eq('id', circuit.id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            loadCircuits();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gold Add Circuit Button */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>District Circuits Directory</Text>
          <Text style={styles.headerSub}>
            Administrative clusters under the Atwima Mponua Education Directorate.
          </Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Ionicons name="add" size={18} color={THEME.colors.navy} />
          <Text style={styles.addBtnText}>Add Circuit</Text>
        </TouchableOpacity>
      </View>

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
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={THEME.colors.navy} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyBox}>
              <Ionicons name="map-outline" size={48} color={THEME.colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No circuits registered yet.</Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAdd}>
                <Ionicons name="add-circle" size={18} color={THEME.colors.navy} />
                <Text style={styles.emptyAddBtnText}>Add your first circuit</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const activeSchools = item.schools?.filter((s: any) => s.is_active) || [];
          const isExpanded = expandedCircuitId === item.id;

          return (
            <View style={[styles.card, !item.is_active && styles.inactiveCard]}>
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={0.7}
                onPress={() => setExpandedCircuitId(isExpanded ? null : item.id)}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="map" size={20} color={THEME.colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.circuitName}>{item.name}</Text>
                    {!item.is_active && (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Deactivated</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.circuitOfficer}>
                    {activeSchools.length} {activeSchools.length === 1 ? 'school' : 'schools'} registered
                  </Text>
                </View>

                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeSchools.length} Schools</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={THEME.colors.textMuted}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>

              {/* Action buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
                  <Ionicons name="pencil-outline" size={14} color={THEME.colors.navy} />
                  <Text style={styles.actionBtnText}>Rename</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleActive(item)}>
                  <Ionicons
                    name={item.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                    size={14}
                    color={item.is_active ? THEME.colors.warning : THEME.colors.success}
                  />
                  <Text style={[styles.actionBtnText, { color: item.is_active ? THEME.colors.warning : THEME.colors.success }]}>
                    {item.is_active ? 'Deactivate' : 'Reactivate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteCircuit(item)}>
                  <Ionicons name="trash-outline" size={14} color={THEME.colors.error} />
                  <Text style={[styles.actionBtnText, { color: THEME.colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>

              {/* Expanded schools list */}
              {isExpanded && (
                <View style={styles.schoolsListWrap}>
                  <Text style={styles.schoolsListTitle}>Schools in {item.name}:</Text>
                  {activeSchools.length === 0 ? (
                    <Text style={styles.noSchoolsText}>No active schools assigned to this circuit.</Text>
                  ) : (
                    activeSchools.map((s: any) => (
                      <View key={s.id} style={styles.schoolRow}>
                        <Ionicons name="school-outline" size={14} color={THEME.colors.navy} />
                        <Text style={styles.schoolRowText}>{s.name}</Text>
                        <Text style={styles.schoolRowStatus}>({s.status})</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Add / Edit Circuit Full-Screen Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.fullScreenModal}>
          {/* Top Header Bar with Close X */}
          <View style={styles.fullScreenHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.fullScreenTitle}>
                {editingCircuit ? 'Rename Circuit' : 'Add New District Circuit'}
              </Text>
              <Text style={styles.fullScreenSubtitle}>
                Educational cluster zone within Atwima Mponua District.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
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
              <Text style={styles.fieldLabel}>Circuit Name *</Text>
              <TextInput
                style={styles.fullScreenInput}
                placeholder="e.g. Nyinahin Circuit"
                placeholderTextColor={THEME.colors.textMuted}
                value={circuitName}
                onChangeText={setCircuitName}
                maxLength={60}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveCircuit}
              />
              <Text style={styles.inputHelper}>
                Must be between 2 and 60 characters and unique across the district.
              </Text>
            </ScrollView>

            {/* Sticky Action Footer Pinned Above Keyboard */}
            <View style={styles.fullScreenFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveCircuit}
                disabled={saving || !circuitName.trim()}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={THEME.colors.navy} />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingCircuit ? 'Save Changes' : 'Register Circuit'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  headerSub: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: THEME.colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.navy,
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
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  inactiveCard: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC',
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
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  circuitOfficer: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#EFF8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B2DDFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.colors.midBlue,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.navy,
  },
  schoolsListWrap: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  schoolsListTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.colors.navy,
    marginBottom: 6,
  },
  noSchoolsText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontStyle: 'italic',
  },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  schoolRowText: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.text,
    flex: 1,
  },
  schoolRowStatus: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'capitalize',
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
