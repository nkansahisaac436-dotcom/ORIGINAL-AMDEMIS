import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

export default function HeadteacherProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Change PIN modal state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [changingPin, setChangingPin] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, schools(*, circuits(name))')
        .eq('id', user.id)
        .single();

      setProfile(prof);
      if (prof?.schools) {
        setSchool(prof.schools);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || !newPin || !confirmPin) {
      Alert.alert('Incomplete Fields', 'Please fill in all PIN fields.');
      return;
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'New PIN must be exactly 6 numeric digits.');
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and confirmation PIN do not match.');
      return;
    }

    setChangingPin(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPin,
      });

      if (error) throw error;

      // Update profile is_initial_pin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ is_initial_pin: false, pin_changed_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      Alert.alert('PIN Updated', 'Your 6-digit login PIN has been successfully changed.');
      setPinModalVisible(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not change PIN.');
    } finally {
      setChangingPin(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={THEME.colors.navy} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* School Overview Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="school" size={24} color={THEME.colors.navy} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.schoolName}>{school?.name || 'School Name'}</Text>
              <Text style={styles.circuitName}>
                {school?.circuits?.name || 'District'} Circuit &bull; {school?.status === 'public' ? 'Public' : 'Private'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>School Login ID</Text>
            <Text style={styles.infoValue}>{school?.school_login_id || 'AMD-XXXX'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>EMIS Code</Text>
            <Text style={styles.infoValue}>{school?.emis_code || 'Unassigned'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Town / Community</Text>
            <Text style={styles.infoValue}>{school?.town || 'Atwima Mponua District'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Headteacher on File</Text>
            <Text style={styles.infoValue}>{school?.headteacher_name || 'Not set'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Headteacher Phone</Text>
            <Text style={styles.infoValue}>{school?.headteacher_phone || 'Not set'}</Text>
          </View>
        </View>

        {/* Security & PIN Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Security & Account Access</Text>
          <Text style={styles.sectionDesc}>
            Manage the 6-digit access PIN assigned to this school's official account.
          </Text>

          <TouchableOpacity
            style={styles.changePinBtn}
            onPress={() => setPinModalVisible(true)}
          >
            <Ionicons name="key-outline" size={18} color={THEME.colors.navy} />
            <Text style={styles.changePinText}>Change 6-Digit Secret PIN</Text>
          </TouchableOpacity>
        </View>

        {/* Change PIN Modal */}
        <Modal
          visible={pinModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPinModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change 6-Digit PIN</Text>
              <Text style={styles.modalSub}>
                Enter your current PIN and choose a new 6-digit numeric PIN.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CURRENT PIN</Text>
                <TextInput
                  style={styles.modalInput}
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  placeholder="••••••"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NEW 6-DIGIT PIN</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  placeholder="••••••"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONFIRM NEW PIN</Text>
                <TextInput
                  style={styles.modalInput}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  placeholder="••••••"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setPinModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleChangePin}
                  disabled={changingPin}
                >
                  {changingPin ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Save New PIN</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  circuitName: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F8',
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: THEME.colors.text,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 16,
    lineHeight: 16,
  },
  changePinBtn: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1.5,
    borderColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changePinText: {
    color: THEME.colors.navy,
    fontWeight: 'bold',
    fontSize: 14,
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
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.colors.textMuted,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 4,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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
  confirmBtn: {
    flex: 1,
    backgroundColor: THEME.colors.navy,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
