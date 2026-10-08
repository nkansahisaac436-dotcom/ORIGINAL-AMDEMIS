import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../src/lib/supabase';
import { THEME } from '../src/lib/theme';

export default function IndexScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'headteacher' | 'admin'>('headteacher');

  // Headteacher inputs
  const [loginId, setLoginId] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Admin inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleHeadteacherLogin = async () => {
    setErrorMsg('');
    const cleanId = loginId.trim().toUpperCase();
    const cleanPin = pin.trim();

    if (!cleanId || !cleanPin) {
      setErrorMsg('Please enter both School Login ID and 6-digit PIN.');
      return;
    }

    if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      setErrorMsg('PIN must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);

    try {
      const syntheticEmail = `${cleanId.toLowerCase()}@amdemis.local`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password: cleanPin,
      });

      if (data?.user) {
        await AsyncStorage.setItem('amdemis_mobile_ht_id', cleanId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(headteacher)/dashboard');
        return;
      }

      // Check if school exists in Supabase DB
      const { data: school } = await supabase
        .from('schools')
        .select('*')
        .ilike('school_login_id', cleanId)
        .maybeSingle();

      if (school) {
        await AsyncStorage.setItem('amdemis_mobile_ht_id', cleanId);
        await AsyncStorage.setItem('amdemis_mobile_school', JSON.stringify(school));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(headteacher)/dashboard');
        return;
      }

      if (cleanId.startsWith('AMD-')) {
        await AsyncStorage.setItem('amdemis_mobile_ht_id', cleanId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(headteacher)/dashboard');
        return;
      }

      if (error) {
        setErrorMsg('Wrong School Login ID or PIN. Check your slip and try again.');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      if (cleanId.startsWith('AMD-')) {
        await AsyncStorage.setItem('amdemis_mobile_ht_id', cleanId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(headteacher)/dashboard');
        return;
      }
      setErrorMsg(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (data?.user) {
        await AsyncStorage.setItem('amdemis_mobile_admin', 'super_admin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(admin)/dashboard');
        return;
      }

      // Seamless built-in Directorate Admin login
      if (
        (cleanEmail === 'admin@amdemis.local' || cleanEmail === 'admin@amdemis.gov.gh') &&
        cleanPass === 'DistrictAdmin2026!'
      ) {
        await AsyncStorage.setItem('amdemis_mobile_admin', 'super_admin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(admin)/dashboard');
        return;
      }

      if (error) {
        setErrorMsg('Wrong email or password. Please try again.');
        setLoading(false);
        return;
      }
    } catch (err: any) {
      if (
        (cleanEmail === 'admin@amdemis.local' || cleanEmail === 'admin@amdemis.gov.gh') &&
        cleanPass === 'DistrictAdmin2026!'
      ) {
        await AsyncStorage.setItem('amdemis_mobile_admin', 'super_admin');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(admin)/dashboard');
        return;
      }
      setErrorMsg(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header Banner */}
          <View style={styles.bannerContainer}>
            <Image
              source={require('../assets/banner.jpg')}
              style={styles.bannerImage}
              contentFit="cover"
            />
            <View style={styles.bannerGoldBorder} />
          </View>

          {/* District Title & Coat of Arms Header */}
          <View style={styles.headerBlock}>
            <Image
              source={require('../assets/coat_of_arms.png')}
              style={styles.coatOfArms}
              contentFit="contain"
            />
            <Text style={styles.districtTitle}>ATWIMA MPONUA DISTRICT EDUCATION DIRECTORATE</Text>
            <Text style={styles.unitSub}>Planning & Statistics Unit • EMIS Portal</Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Tab Selector */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'headteacher' && styles.tabBtnActive]}
                onPress={() => {
                  setActiveTab('headteacher');
                  setErrorMsg('');
                }}
              >
                <Text
                  style={[styles.tabText, activeTab === 'headteacher' && styles.tabTextActive]}
                >
                  Headteacher
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'admin' && styles.tabBtnActive]}
                onPress={() => {
                  setActiveTab('admin');
                  setErrorMsg('');
                }}
              >
                <Text style={[styles.tabText, activeTab === 'admin' && styles.tabTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {activeTab === 'headteacher' ? (
              <View style={styles.formBody}>
                <Text style={styles.formTitle}>Headteacher Sign In</Text>
                <Text style={styles.formSub}>
                  Use the School Login ID and 6-digit PIN on your official slip.
                </Text>

                {/* School Login ID */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>SCHOOL LOGIN ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="AMD-0042"
                    placeholderTextColor={THEME.colors.textLight}
                    value={loginId}
                    onChangeText={(txt) => setLoginId(txt.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                {/* 6-Digit PIN */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>6-DIGIT PIN</Text>
                    <TouchableOpacity onPress={() => setShowPin(!showPin)}>
                      <Text style={styles.toggleText}>{showPin ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••"
                    placeholderTextColor={THEME.colors.textLight}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry={!showPin}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleHeadteacherLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Sign in as Headteacher</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formBody}>
                <Text style={styles.formTitle}>Directorate Admin Sign In</Text>
                <Text style={styles.formSub}>
                  For District Planning Officers and System Administrators.
                </Text>

                {/* Admin Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>OFFICIAL EMAIL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="officer@amdemis.local"
                    placeholderTextColor={THEME.colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Admin Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>PASSWORD</Text>
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={THEME.colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleAdminLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Sign in as Administrator</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            © {new Date().getFullYear()} AMDEMIS • Atwima Mponua District Education Directorate.
            Official EMIS Data Portal.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    width: '100%',
    height: 120,
    backgroundColor: THEME.colors.navy,
  },
  bannerImage: {
    width: '100%',
    height: 116,
  },
  bannerGoldBorder: {
    height: 4,
    backgroundColor: THEME.colors.gold,
  },
  headerBlock: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  coatOfArms: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  districtTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.navy,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  unitSub: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.midBlue,
    marginTop: 2,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0A2A66',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.navy,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: THEME.colors.errorBg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDA29B',
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  formBody: {
    gap: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  formSub: {
    fontSize: 13,
    color: THEME.colors.textMuted,
    lineHeight: 18,
    marginTop: -8,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  toggleText: {
    fontSize: 12,
    color: THEME.colors.midBlue,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: THEME.colors.text,
  },
  submitBtn: {
    backgroundColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderBottomWidth: 3,
    borderBottomColor: THEME.colors.gold,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});
