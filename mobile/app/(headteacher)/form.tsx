import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EDUCATION_LEVELS, LevelKey } from '../../src/lib/levels-config';
import { generateAndShareReceipt } from '../../src/lib/pdf-generator';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';
import {
  getClassTotal,
  getCrecheTotals,
  getKGTotals,
  getPrimaryTotals,
  getJHSTotals,
  getSchoolTotals,
  safeNumber,
} from '../../src/lib/enrolment-totals';

export default function HeadteacherFormScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // School Context
  const [school, setSchool] = useState<any>(null);
  const [round, setRound] = useState<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // Form State
  const [chosenLevels, setChosenLevels] = useState<LevelKey[]>(['kg', 'primary']);
  const [headteacherName, setHeadteacherName] = useState('');
  const [phone, setPhone] = useState('');
  const [emisCode, setEmisCode] = useState('');

  // Overall Teachers (Step 0)
  const [teachersMaleTrained, setTeachersMaleTrained] = useState('0');
  const [teachersMaleUntrained, setTeachersMaleUntrained] = useState('0');
  const [teachersFemaleTrained, setTeachersFemaleTrained] = useState('0');
  const [teachersFemaleUntrained, setTeachersFemaleUntrained] = useState('0');

  // Creche Data
  const [crecheBoys, setCrecheBoys] = useState('0');
  const [crecheGirls, setCrecheGirls] = useState('0');
  const [crecheTeachers, setCrecheTeachers] = useState('0');

  // KG Data
  const [kg1Boys, setKg1Boys] = useState('0');
  const [kg1Girls, setKg1Girls] = useState('0');
  const [kg2Boys, setKg2Boys] = useState('0');
  const [kg2Girls, setKg2Girls] = useState('0');
  const [kgTeachers, setKgTeachers] = useState('0');

  // Primary Data
  const [p1Boys, setP1Boys] = useState('0');
  const [p1Girls, setP1Girls] = useState('0');
  const [p2Boys, setP2Boys] = useState('0');
  const [p2Girls, setP2Girls] = useState('0');
  const [p3Boys, setP3Boys] = useState('0');
  const [p3Girls, setP3Girls] = useState('0');
  const [p4Boys, setP4Boys] = useState('0');
  const [p4Girls, setP4Girls] = useState('0');
  const [p5Boys, setP5Boys] = useState('0');
  const [p5Girls, setP5Girls] = useState('0');
  const [p6Boys, setP6Boys] = useState('0');
  const [p6Girls, setP6Girls] = useState('0');
  const [primaryTeachers, setPrimaryTeachers] = useState('0');

  // JHS Data
  const [jhs1Boys, setJhs1Boys] = useState('0');
  const [jhs1Girls, setJhs1Girls] = useState('0');
  const [jhs2Boys, setJhs2Boys] = useState('0');
  const [jhs2Girls, setJhs2Girls] = useState('0');
  const [jhs3Boys, setJhs3Boys] = useState('0');
  const [jhs3Girls, setJhs3Girls] = useState('0');
  const [jhsTeachers, setJhsTeachers] = useState('0');

  // Infrastructure & Classrooms
  const [permClassrooms, setPermClassrooms] = useState('6');
  const [goodClassrooms, setGoodClassrooms] = useState('4');
  const [dilapClassrooms, setDilapClassrooms] = useState('2');
  const [tempClassrooms, setTempClassrooms] = useState('0');
  const [singleDesks, setSingleDesks] = useState('50');
  const [dualDesks, setDualDesks] = useState('80');
  const [hasWater, setHasWater] = useState(true);
  const [hasToilet, setHasToilet] = useState(true);
  const [hasElectricity, setHasElectricity] = useState(false);

  // Review & Submit certification
  const [certified, setCertified] = useState(false);

  useEffect(() => {
    loadFormContext();
  }, []);

  const loadFormContext = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id, schools(*, circuits(name))')
        .eq('id', user.id)
        .single();

      if (!profile?.school_id) {
        setLoading(false);
        return;
      }

      const schoolData: any = profile.schools;
      setSchool(schoolData);
      setHeadteacherName(schoolData?.headteacher_name || '');
      setPhone(schoolData?.headteacher_phone || '');
      setEmisCode(schoolData?.emis_code || '');

      const { data: activeRound } = await supabase
        .from('rounds')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      setRound(activeRound || null);

      if (activeRound) {
        const { data: sub } = await supabase
          .from('submissions')
          .select('*, submission_levels(level_key)')
          .eq('round_id', activeRound.id)
          .eq('school_id', profile.school_id)
          .maybeSingle();

        if (sub) {
          setSubmissionId(sub.id);
          if (sub.submission_levels && sub.submission_levels.length > 0) {
            setChosenLevels(sub.submission_levels.map((l: any) => l.level_key));
          }
          if (sub.form_data) {
            populateFormData(sub.form_data);
          }
        } else {
          // V2 cache key to clear out legacy demo drafts
          const localCache = await AsyncStorage.getItem(
            `amdemis_v2_form_${profile.school_id}_${activeRound.id}`
          );
          if (localCache) {
            populateFormData(JSON.parse(localCache));
          } else if (schoolData?.default_levels && schoolData.default_levels.length > 0) {
            setChosenLevels(schoolData.default_levels);
          }
        }
      }
    } catch (err) {
      console.error('Error loading form context:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (data: any) => {
    if (data.levels) setChosenLevels(data.levels);
    if (data.teachersMaleTrained !== undefined) setTeachersMaleTrained(String(data.teachersMaleTrained));
    if (data.teachersMaleUntrained !== undefined) setTeachersMaleUntrained(String(data.teachersMaleUntrained));
    if (data.teachersFemaleTrained !== undefined) setTeachersFemaleTrained(String(data.teachersFemaleTrained));
    if (data.teachersFemaleUntrained !== undefined) setTeachersFemaleUntrained(String(data.teachersFemaleUntrained));

    // Creche
    if (data.crecheBoys !== undefined) setCrecheBoys(String(data.crecheBoys));
    if (data.crecheGirls !== undefined) setCrecheGirls(String(data.crecheGirls));
    if (data.crecheTeachers !== undefined) setCrecheTeachers(String(data.crecheTeachers));

    // KG
    if (data.kg1Boys !== undefined) setKg1Boys(String(data.kg1Boys));
    if (data.kg1Girls !== undefined) setKg1Girls(String(data.kg1Girls));
    if (data.kg2Boys !== undefined) setKg2Boys(String(data.kg2Boys));
    if (data.kg2Girls !== undefined) setKg2Girls(String(data.kg2Girls));
    if (data.kgTeachers !== undefined) setKgTeachers(String(data.kgTeachers));

    // Primary
    if (data.p1Boys !== undefined) setP1Boys(String(data.p1Boys));
    if (data.p1Girls !== undefined) setP1Girls(String(data.p1Girls));
    if (data.p2Boys !== undefined) setP2Boys(String(data.p2Boys));
    if (data.p2Girls !== undefined) setP2Girls(String(data.p2Girls));
    if (data.p3Boys !== undefined) setP3Boys(String(data.p3Boys));
    if (data.p3Girls !== undefined) setP3Girls(String(data.p3Girls));
    if (data.p4Boys !== undefined) setP4Boys(String(data.p4Boys));
    if (data.p4Girls !== undefined) setP4Girls(String(data.p4Girls));
    if (data.p5Boys !== undefined) setP5Boys(String(data.p5Boys));
    if (data.p5Girls !== undefined) setP5Girls(String(data.p5Girls));
    if (data.p6Boys !== undefined) setP6Boys(String(data.p6Boys));
    if (data.p6Girls !== undefined) setP6Girls(String(data.p6Girls));
    if (data.primaryTeachers !== undefined) setPrimaryTeachers(String(data.primaryTeachers));

    // JHS
    if (data.jhs1Boys !== undefined) setJhs1Boys(String(data.jhs1Boys));
    if (data.jhs1Girls !== undefined) setJhs1Girls(String(data.jhs1Girls));
    if (data.jhs2Boys !== undefined) setJhs2Boys(String(data.jhs2Boys));
    if (data.jhs2Girls !== undefined) setJhs2Girls(String(data.jhs2Girls));
    if (data.jhs3Boys !== undefined) setJhs3Boys(String(data.jhs3Boys));
    if (data.jhs3Girls !== undefined) setJhs3Girls(String(data.jhs3Girls));
    if (data.jhsTeachers !== undefined) setJhsTeachers(String(data.jhsTeachers));

    // Infrastructure
    if (data.permClassrooms !== undefined) setPermClassrooms(String(data.permClassrooms));
    if (data.goodClassrooms !== undefined) setGoodClassrooms(String(data.goodClassrooms));
    if (data.dilapClassrooms !== undefined) setDilapClassrooms(String(data.dilapClassrooms));
    if (data.tempClassrooms !== undefined) setTempClassrooms(String(data.tempClassrooms));
    if (data.singleDesks !== undefined) setSingleDesks(String(data.singleDesks));
    if (data.dualDesks !== undefined) setDualDesks(String(data.dualDesks));
    if (data.hasWater !== undefined) setHasWater(data.hasWater);
    if (data.hasToilet !== undefined) setHasToilet(data.hasToilet);
    if (data.hasElectricity !== undefined) setHasElectricity(data.hasElectricity);
  };

  const getFormPayload = () => ({
    levels: chosenLevels,
    headteacherName,
    phone,
    emisCode,
    teachersMaleTrained: Number(teachersMaleTrained) || 0,
    teachersMaleUntrained: Number(teachersMaleUntrained) || 0,
    teachersFemaleTrained: Number(teachersFemaleTrained) || 0,
    teachersFemaleUntrained: Number(teachersFemaleUntrained) || 0,
    crecheBoys: Number(crecheBoys) || 0,
    crecheGirls: Number(crecheGirls) || 0,
    crecheTeachers: Number(crecheTeachers) || 0,
    kg1Boys: Number(kg1Boys) || 0,
    kg1Girls: Number(kg1Girls) || 0,
    kg2Boys: Number(kg2Boys) || 0,
    kg2Girls: Number(kg2Girls) || 0,
    kgTeachers: Number(kgTeachers) || 0,
    p1Boys: Number(p1Boys) || 0,
    p1Girls: Number(p1Girls) || 0,
    p2Boys: Number(p2Boys) || 0,
    p2Girls: Number(p2Girls) || 0,
    p3Boys: Number(p3Boys) || 0,
    p3Girls: Number(p3Girls) || 0,
    p4Boys: Number(p4Boys) || 0,
    p4Girls: Number(p4Girls) || 0,
    p5Boys: Number(p5Boys) || 0,
    p5Girls: Number(p5Girls) || 0,
    p6Boys: Number(p6Boys) || 0,
    p6Girls: Number(p6Girls) || 0,
    primaryTeachers: Number(primaryTeachers) || 0,
    jhs1Boys: Number(jhs1Boys) || 0,
    jhs1Girls: Number(jhs1Girls) || 0,
    jhs2Boys: Number(jhs2Boys) || 0,
    jhs2Girls: Number(jhs2Girls) || 0,
    jhs3Boys: Number(jhs3Boys) || 0,
    jhs3Girls: Number(jhs3Girls) || 0,
    jhsTeachers: Number(jhsTeachers) || 0,
    permClassrooms: Number(permClassrooms) || 0,
    goodClassrooms: Number(goodClassrooms) || 0,
    dilapClassrooms: Number(dilapClassrooms) || 0,
    tempClassrooms: Number(tempClassrooms) || 0,
    singleDesks: Number(singleDesks) || 0,
    dualDesks: Number(dualDesks) || 0,
    hasWater,
    hasToilet,
    hasElectricity,
  });

  // Dynamic Steps Definition
  const steps: { id: string; title: string; short: string }[] = [
    { id: 'school', title: 'School Details & Levels', short: 'School' },
  ];
  if (chosenLevels.includes('creche')) {
    steps.push({ id: 'creche', title: 'Crèche / Nursery', short: 'Crèche' });
  }
  if (chosenLevels.includes('kg')) {
    steps.push({ id: 'kg', title: 'Kindergarten (KG)', short: 'KG' });
  }
  if (chosenLevels.includes('primary')) {
    steps.push({ id: 'primary', title: 'Primary School', short: 'Primary' });
  }
  if (chosenLevels.includes('jhs')) {
    steps.push({ id: 'jhs', title: 'Junior High School', short: 'JHS' });
  }
  steps.push({ id: 'infra', title: 'Infrastructure & WASH', short: 'Facilities' });
  steps.push({ id: 'review', title: 'Review & Submit', short: 'Review' });

  // Math Computations using shared totals helper
  const crecheTotals = getCrecheTotals({ boys: crecheBoys, girls: crecheGirls });
  const kgTotals = getKGTotals({
    kg1_boys: kg1Boys,
    kg1_girls: kg1Girls,
    kg2_boys: kg2Boys,
    kg2_girls: kg2Girls,
  });
  const primaryTotals = getPrimaryTotals({
    bs1_boys: p1Boys,
    bs1_girls: p1Girls,
    bs2_boys: p2Boys,
    bs2_girls: p2Girls,
    bs3_boys: p3Boys,
    bs3_girls: p3Girls,
    bs4_boys: p4Boys,
    bs4_girls: p4Girls,
    bs5_boys: p5Boys,
    bs5_girls: p5Girls,
    bs6_boys: p6Boys,
    bs6_girls: p6Girls,
  });
  const jhsTotals = getJHSTotals({
    jhs1_boys: jhs1Boys,
    jhs1_girls: jhs1Girls,
    jhs2_boys: jhs2Boys,
    jhs2_girls: jhs2Girls,
    jhs3_boys: jhs3Boys,
    jhs3_girls: jhs3Girls,
  });

  const totalBoys =
    (chosenLevels.includes('creche') ? crecheTotals.boys : 0) +
    (chosenLevels.includes('kg') ? kgTotals.boys : 0) +
    (chosenLevels.includes('primary') ? primaryTotals.boys : 0) +
    (chosenLevels.includes('jhs') ? jhsTotals.boys : 0);

  const totalGirls =
    (chosenLevels.includes('creche') ? crecheTotals.girls : 0) +
    (chosenLevels.includes('kg') ? kgTotals.girls : 0) +
    (chosenLevels.includes('primary') ? primaryTotals.girls : 0) +
    (chosenLevels.includes('jhs') ? jhsTotals.girls : 0);

  const grandTotalPupils = totalBoys + totalGirls;

  const totalOverallTeachers =
    safeNumber(teachersMaleTrained) +
    safeNumber(teachersMaleUntrained) +
    safeNumber(teachersFemaleTrained) +
    safeNumber(teachersFemaleUntrained);

  const handleSaveDraft = async () => {
    setSaving(true);
    const payload = getFormPayload();

    try {
      if (school?.id && round?.id) {
        await AsyncStorage.setItem(
          `amdemis_v2_form_${school.id}_${round.id}`,
          JSON.stringify(payload)
        );

        let sid = submissionId;
        if (!sid) {
          const { data: newSub } = await supabase
            .from('submissions')
            .upsert(
              {
                school_id: school.id,
                round_id: round.id,
                status: 'draft',
                form_data: payload,
              },
              { onConflict: 'school_id,round_id' }
            )
            .select('id')
            .single();

          if (newSub?.id) {
            sid = newSub.id;
            setSubmissionId(newSub.id);
          }
        } else {
          await supabase
            .from('submissions')
            .update({
              status: 'draft',
              form_data: payload,
            })
            .eq('id', sid);
        }

        if (sid) {
          await supabase.from('submission_levels').delete().eq('submission_id', sid);
          const levelRows = chosenLevels.map((l) => ({
            submission_id: sid,
            level_key: l,
          }));
          await supabase.from('submission_levels').insert(levelRows);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Draft Saved', 'Your data has been securely saved.');
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Could not sync draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!certified) {
      Alert.alert('Certification Required', 'Please confirm that all figures are true and correct.');
      return;
    }

    if (safeNumber(goodClassrooms) + safeNumber(dilapClassrooms) > safeNumber(permClassrooms)) {
      Alert.alert(
        'Validation Error',
        `Classrooms in Good Condition (${goodClassrooms}) + In Need of Major Repair (${dilapClassrooms}) exceeds Total Permanent Classrooms (${permClassrooms}).`
      );
      return;
    }

    setSaving(true);
    const payload = getFormPayload();

    try {
      let sid = submissionId;
      if (!sid && school?.id && round?.id) {
        const { data: newSub } = await supabase
          .from('submissions')
          .insert({
            school_id: school.id,
            round_id: round.id,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            form_data: payload,
          })
          .select('id')
          .single();
        sid = newSub?.id || null;
      } else if (sid) {
        await supabase
          .from('submissions')
          .update({
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            form_data: payload,
          })
          .eq('id', sid);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Submission Successful!',
        'Your annual school data has been submitted to the Planning & Statistics Directorate.',
        [
          {
            text: 'Generate Official Receipt',
            onPress: () =>
              generateAndShareReceipt({
                receiptNumber: `AMD-${Math.floor(100000 + Math.random() * 900000)}`,
                schoolName: school?.name || 'School',
                circuitName: school?.circuits?.name || 'Circuit',
                roundTitle: round?.title || 'Academic Year',
                headteacherName: headteacherName || 'Headteacher',
                phone: phone || 'N/A',
                submittedAt: new Date().toLocaleString('en-GB'),
                totalBoys,
                totalGirls,
                totalTeachers: totalOverallTeachers,
              }),
          },
          {
            text: 'Return to Dashboard',
            onPress: () => router.replace('/(headteacher)/dashboard'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Error completing submission.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLevel = (key: LevelKey) => {
    if (chosenLevels.includes(key)) {
      if (chosenLevels.length === 1) {
        Alert.alert('Required', 'Your school must select at least one active educational level.');
        return;
      }
      setChosenLevels(chosenLevels.filter((k) => k !== key));
    } else {
      setChosenLevels([...chosenLevels, key]);
    }
    Haptics.selectionAsync();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={THEME.colors.navy} />
          <Text style={styles.loadingText}>Loading EMIS Census Form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const activeStep = steps[currentStepIndex] || steps[0];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Horizontal Step Nav */}
        <View style={styles.stepperContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepperScroll}>
            {steps.map((st, idx) => {
              const isCurrent = idx === currentStepIndex;
              const isDone = idx < currentStepIndex;
              return (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.stepBadge,
                    isCurrent && styles.stepBadgeCurrent,
                    isDone && styles.stepBadgeCompleted,
                  ]}
                  onPress={() => {
                    setCurrentStepIndex(idx);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.stepNum, isCurrent && styles.stepNumActive]}>{idx + 1}</Text>
                  <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>{st.short}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          {/* Active Step Header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>{activeStep.title}</Text>
            <Text style={styles.stepCounter}>
              Step {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>

          {/* STEP: SCHOOL DETAILS */}
          {activeStep.id === 'school' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Active Educational Levels</Text>
              <Text style={styles.fieldHelp}>
                Select the levels operational in your school this academic year:
              </Text>

              {Object.values(EDUCATION_LEVELS).map((lvl) => {
                const isSelected = chosenLevels.includes(lvl.key);
                return (
                  <TouchableOpacity
                    key={lvl.key}
                    style={[styles.levelOption, isSelected && styles.levelOptionActive]}
                    onPress={() => toggleLevel(lvl.key)}
                  >
                    <View style={styles.levelInfo}>
                      <Text style={[styles.levelTitle, isSelected && styles.levelTitleActive]}>
                        {lvl.label}
                      </Text>
                      <Text style={styles.levelDesc}>{lvl.description}</Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={isSelected ? THEME.colors.navy : THEME.colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}

              <View style={styles.divider} />

              <Text style={styles.sectionHeading}>School Contact & EMIS</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Headteacher Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={headteacherName}
                  onChangeText={setHeadteacherName}
                  placeholder="Full Name"
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Mobile Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="024XXXXXXX"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionHeading}>Overall Staff Summary</Text>
              <View style={styles.grid2}>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Male Trained</Text>
                  <TextInput
                    style={styles.numInput}
                    value={teachersMaleTrained}
                    onChangeText={setTeachersMaleTrained}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Male Untrained</Text>
                  <TextInput
                    style={styles.numInput}
                    value={teachersMaleUntrained}
                    onChangeText={setTeachersMaleUntrained}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Female Trained</Text>
                  <TextInput
                    style={styles.numInput}
                    value={teachersFemaleTrained}
                    onChangeText={setTeachersFemaleTrained}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Female Untrained</Text>
                  <TextInput
                    style={styles.numInput}
                    value={teachersFemaleUntrained}
                    onChangeText={setTeachersFemaleUntrained}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalText}>Total Staff: {totalOverallTeachers}</Text>
              </View>
            </View>
          )}

          {/* STEP: CRECHE */}
          {activeStep.id === 'creche' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Crèche / Nursery Enrolment</Text>
              <View style={styles.grid3}>
                <View style={styles.gridItem3}>
                  <Text style={styles.inputLabel}>Boys</Text>
                  <TextInput
                    style={styles.numInput}
                    value={crecheBoys}
                    onChangeText={setCrecheBoys}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem3}>
                  <Text style={styles.inputLabel}>Girls</Text>
                  <TextInput
                    style={styles.numInput}
                    value={crecheGirls}
                    onChangeText={setCrecheGirls}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem3}>
                  <Text style={styles.totalBoxLabel}>Crèche Total</Text>
                  <View style={styles.classTotalBox}>
                    <Text style={styles.classTotalNum}>{crecheTotals.total}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.levelSummaryRow}>
                <Text style={styles.levelSummaryText}>Total Boys: <Text style={styles.boldNum}>{crecheTotals.boys}</Text></Text>
                <Text style={styles.levelSummaryText}>Total Girls: <Text style={styles.boldNum}>{crecheTotals.girls}</Text></Text>
                <Text style={[styles.levelSummaryText, styles.boldNum]}>Total Pupils: {crecheTotals.total}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Assigned Daycare Teachers / Attendants</Text>
                <TextInput
                  style={styles.numInput}
                  value={crecheTeachers}
                  onChangeText={setCrecheTeachers}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* STEP: KG */}
          {activeStep.id === 'kg' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Kindergarten Enrolment by Class</Text>

              {/* KG 1 */}
              <View style={styles.classCard}>
                <Text style={styles.classCardTitle}>Class KG 1</Text>
                <View style={styles.grid3}>
                  <View style={styles.gridItem3}>
                    <Text style={styles.inputLabel}>KG1 Boys</Text>
                    <TextInput
                      style={styles.numInput}
                      value={kg1Boys}
                      onChangeText={setKg1Boys}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.gridItem3}>
                    <Text style={styles.inputLabel}>KG1 Girls</Text>
                    <TextInput
                      style={styles.numInput}
                      value={kg1Girls}
                      onChangeText={setKg1Girls}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.gridItem3}>
                    <Text style={styles.totalBoxLabel}>KG1 Total</Text>
                    <View style={styles.classTotalBox}>
                      <Text style={styles.classTotalNum}>{kgTotals.kg1.total}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* KG 2 */}
              <View style={styles.classCard}>
                <Text style={styles.classCardTitle}>Class KG 2</Text>
                <View style={styles.grid3}>
                  <View style={styles.gridItem3}>
                    <Text style={styles.inputLabel}>KG2 Boys</Text>
                    <TextInput
                      style={styles.numInput}
                      value={kg2Boys}
                      onChangeText={setKg2Boys}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.gridItem3}>
                    <Text style={styles.inputLabel}>KG2 Girls</Text>
                    <TextInput
                      style={styles.numInput}
                      value={kg2Girls}
                      onChangeText={setKg2Girls}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.gridItem3}>
                    <Text style={styles.totalBoxLabel}>KG2 Total</Text>
                    <View style={styles.classTotalBox}>
                      <Text style={styles.classTotalNum}>{kgTotals.kg2.total}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.levelSummaryRow}>
                <Text style={styles.levelSummaryText}>Total KG Boys: <Text style={styles.boldNum}>{kgTotals.boys}</Text></Text>
                <Text style={styles.levelSummaryText}>Total KG Girls: <Text style={styles.boldNum}>{kgTotals.girls}</Text></Text>
                <Text style={[styles.levelSummaryText, styles.boldNum]}>Total KG Pupils: {kgTotals.total}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Assigned KG Teachers</Text>
                <TextInput
                  style={styles.numInput}
                  value={kgTeachers}
                  onChangeText={setKgTeachers}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* STEP: PRIMARY */}
          {activeStep.id === 'primary' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Primary School Enrolment (BS1 to BS6)</Text>

              {([
                { name: 'BS1', b: p1Boys, setB: setP1Boys, g: p1Girls, setG: setP1Girls, tot: primaryTotals.bs1.total },
                { name: 'BS2', b: p2Boys, setB: setP2Boys, g: p2Girls, setG: setP2Girls, tot: primaryTotals.bs2.total },
                { name: 'BS3', b: p3Boys, setB: setP3Boys, g: p3Girls, setG: setP3Girls, tot: primaryTotals.bs3.total },
                { name: 'BS4', b: p4Boys, setB: setP4Boys, g: p4Girls, setG: setP4Girls, tot: primaryTotals.bs4.total },
                { name: 'BS5', b: p5Boys, setB: setP5Boys, g: p5Girls, setG: setP5Girls, tot: primaryTotals.bs5.total },
                { name: 'BS6', b: p6Boys, setB: setP6Boys, g: p6Girls, setG: setP6Girls, tot: primaryTotals.bs6.total },
              ] as const).map((item) => (
                <View key={item.name} style={styles.classCard}>
                  <Text style={styles.classCardTitle}>Class {item.name}</Text>
                  <View style={styles.grid3}>
                    <View style={styles.gridItem3}>
                      <Text style={styles.inputLabel}>Boys</Text>
                      <TextInput
                        style={styles.numInput}
                        value={item.b}
                        onChangeText={item.setB}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.gridItem3}>
                      <Text style={styles.inputLabel}>Girls</Text>
                      <TextInput
                        style={styles.numInput}
                        value={item.g}
                        onChangeText={item.setG}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.gridItem3}>
                      <Text style={styles.totalBoxLabel}>{item.name} Total</Text>
                      <View style={styles.classTotalBox}>
                        <Text style={styles.classTotalNum}>{item.tot}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.levelSummaryRow}>
                <Text style={styles.levelSummaryText}>Total Primary Boys: <Text style={styles.boldNum}>{primaryTotals.boys}</Text></Text>
                <Text style={styles.levelSummaryText}>Total Primary Girls: <Text style={styles.boldNum}>{primaryTotals.girls}</Text></Text>
                <Text style={[styles.levelSummaryText, styles.boldNum]}>Total Primary: {primaryTotals.total}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Assigned Primary Teachers</Text>
                <TextInput
                  style={styles.numInput}
                  value={primaryTeachers}
                  onChangeText={setPrimaryTeachers}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* STEP: JHS */}
          {activeStep.id === 'jhs' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Junior High School Enrolment (JHS1 to JHS3)</Text>

              {([
                { name: 'JHS1', b: jhs1Boys, setB: setJhs1Boys, g: jhs1Girls, setG: setJhs1Girls, tot: jhsTotals.jhs1.total },
                { name: 'JHS2', b: jhs2Boys, setB: setJhs2Boys, g: jhs2Girls, setG: setJhs2Girls, tot: jhsTotals.jhs2.total },
                { name: 'JHS3', b: jhs3Boys, setB: setJhs3Boys, g: jhs3Girls, setG: setJhs3Girls, tot: jhsTotals.jhs3.total },
              ] as const).map((item) => (
                <View key={item.name} style={styles.classCard}>
                  <Text style={styles.classCardTitle}>Class {item.name}</Text>
                  <View style={styles.grid3}>
                    <View style={styles.gridItem3}>
                      <Text style={styles.inputLabel}>Boys</Text>
                      <TextInput
                        style={styles.numInput}
                        value={item.b}
                        onChangeText={item.setB}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.gridItem3}>
                      <Text style={styles.inputLabel}>Girls</Text>
                      <TextInput
                        style={styles.numInput}
                        value={item.g}
                        onChangeText={item.setG}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.gridItem3}>
                      <Text style={styles.totalBoxLabel}>{item.name} Total</Text>
                      <View style={styles.classTotalBox}>
                        <Text style={styles.classTotalNum}>{item.tot}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.levelSummaryRow}>
                <Text style={styles.levelSummaryText}>Total JHS Boys: <Text style={styles.boldNum}>{jhsTotals.boys}</Text></Text>
                <Text style={styles.levelSummaryText}>Total JHS Girls: <Text style={styles.boldNum}>{jhsTotals.girls}</Text></Text>
                <Text style={[styles.levelSummaryText, styles.boldNum]}>Total JHS: {jhsTotals.total}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>Assigned JHS Subject Teachers</Text>
                <TextInput
                  style={styles.numInput}
                  value={jhsTeachers}
                  onChangeText={setJhsTeachers}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          )}

          {/* STEP: INFRASTRUCTURE & FACILITIES */}
          {activeStep.id === 'infra' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>Classrooms Condition</Text>
              <Text style={styles.fieldHelp}>
                Condition rule: Good Condition + In Need of Major Repair ≤ Total Permanent.
              </Text>
              <View style={styles.grid2}>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Permanent Classrooms</Text>
                  <TextInput
                    style={styles.numInput}
                    value={permClassrooms}
                    onChangeText={setPermClassrooms}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Good Condition</Text>
                  <TextInput
                    style={styles.numInput}
                    value={goodClassrooms}
                    onChangeText={setGoodClassrooms}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>In Major Disrepair</Text>
                  <TextInput
                    style={styles.numInput}
                    value={dilapClassrooms}
                    onChangeText={setDilapClassrooms}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Temporary Structures</Text>
                  <TextInput
                    style={styles.numInput}
                    value={tempClassrooms}
                    onChangeText={setTempClassrooms}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionHeading}>Furniture & Desks</Text>
              <View style={styles.grid2}>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Single Desks</Text>
                  <TextInput
                    style={styles.numInput}
                    value={singleDesks}
                    onChangeText={setSingleDesks}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.inputLabel}>Dual Desks</Text>
                  <TextInput
                    style={styles.numInput}
                    value={dualDesks}
                    onChangeText={setDualDesks}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionHeading}>WASH & Utilities</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Potable Drinking Water Source</Text>
                <Switch
                  value={hasWater}
                  onValueChange={setHasWater}
                  trackColor={{ false: '#D0D5DD', true: THEME.colors.navy }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Functioning Toilet / Urinal</Text>
                <Switch
                  value={hasToilet}
                  onValueChange={setHasToilet}
                  trackColor={{ false: '#D0D5DD', true: THEME.colors.navy }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Electricity / Solar Power Grid</Text>
                <Switch
                  value={hasElectricity}
                  onValueChange={setHasElectricity}
                  trackColor={{ false: '#D0D5DD', true: THEME.colors.navy }}
                />
              </View>
            </View>
          )}

          {/* STEP: REVIEW & SUBMIT */}
          {activeStep.id === 'review' && (
            <View style={styles.card}>
              <Text style={styles.sectionHeading}>School-Wide Summary Verification</Text>
              <View style={styles.summaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{totalBoys}</Text>
                  <Text style={styles.summaryLbl}>Total Boys</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{totalGirls}</Text>
                  <Text style={styles.summaryLbl}>Total Girls</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{grandTotalPupils}</Text>
                  <Text style={styles.summaryLbl}>Grand Enrolment</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryVal}>{totalOverallTeachers}</Text>
                  <Text style={styles.summaryLbl}>Total Teachers</Text>
                </View>
              </View>

              {/* Per-Level Summary Breakdown in Review */}
              <Text style={[styles.sectionHeading, { fontSize: 13, marginTop: 8 }]}>Breakdown by Section</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {chosenLevels.includes('creche') && (
                  <View style={styles.reviewLevelRow}>
                    <Text style={styles.reviewLevelName}>Crèche / Nursery</Text>
                    <Text style={styles.reviewLevelVal}>{crecheTotals.total} Pupils ({crecheTotals.boys}B / {crecheTotals.girls}G)</Text>
                  </View>
                )}
                {chosenLevels.includes('kg') && (
                  <View style={styles.reviewLevelRow}>
                    <Text style={styles.reviewLevelName}>Kindergarten (KG)</Text>
                    <Text style={styles.reviewLevelVal}>{kgTotals.total} Pupils (KG1: {kgTotals.kg1.total}, KG2: {kgTotals.kg2.total})</Text>
                  </View>
                )}
                {chosenLevels.includes('primary') && (
                  <View style={styles.reviewLevelRow}>
                    <Text style={styles.reviewLevelName}>Primary (BS1–BS6)</Text>
                    <Text style={styles.reviewLevelVal}>{primaryTotals.total} Pupils ({primaryTotals.boys}B / {primaryTotals.girls}G)</Text>
                  </View>
                )}
                {chosenLevels.includes('jhs') && (
                  <View style={styles.reviewLevelRow}>
                    <Text style={styles.reviewLevelName}>Junior High (JHS)</Text>
                    <Text style={styles.reviewLevelVal}>{jhsTotals.total} Pupils ({jhsTotals.boys}B / {jhsTotals.girls}G)</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.certifyRow}
                onPress={() => setCertified(!certified)}
              >
                <Ionicons
                  name={certified ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={certified ? THEME.colors.navy : THEME.colors.textMuted}
                />
                <Text style={styles.certifyText}>
                  I hereby declare that the statistical data provided above is an accurate representation of this school's records for district educational planning.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Action Controls */}
          <View style={styles.bottomBar}>
            {currentStepIndex > 0 ? (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={() => {
                  setCurrentStepIndex(currentStepIndex - 1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="arrow-back" size={18} color={THEME.colors.navy} />
                <Text style={styles.prevBtnText}>Previous</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.saveDraftBtn}
              onPress={handleSaveDraft}
              disabled={saving}
            >
              <Ionicons name="save-outline" size={18} color={THEME.colors.navy} />
              <Text style={styles.saveDraftText}>Save Draft</Text>
            </TouchableOpacity>

            {currentStepIndex < steps.length - 1 ? (
              <TouchableOpacity
                style={styles.nextBtn}
                onPress={() => {
                  setCurrentStepIndex(currentStepIndex + 1);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.nextBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitFinalBtn}
                onPress={handleSubmitFinal}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitFinalText}>Submit Final Return</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  stepperContainer: {
    backgroundColor: THEME.colors.navy,
    paddingVertical: 10,
  },
  stepperScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  stepBadgeCurrent: {
    backgroundColor: THEME.colors.gold,
  },
  stepBadgeCompleted: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
  stepNumActive: {
    color: THEME.colors.navy,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  stepLabelActive: {
    color: THEME.colors.navy,
  },
  formScroll: {
    padding: 16,
    paddingBottom: 60,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  stepCounter: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: 6,
  },
  fieldHelp: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginBottom: 14,
    lineHeight: 16,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginBottom: 10,
    backgroundColor: '#FAFCFF',
  },
  levelOptionActive: {
    borderColor: THEME.colors.navy,
    backgroundColor: '#F0F5FF',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  levelTitleActive: {
    color: THEME.colors.navy,
  },
  levelDesc: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: THEME.colors.text,
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  gridItem: {
    width: '48%',
  },
  grid3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'flex-end',
  },
  gridItem3: {
    flex: 1,
  },
  classCard: {
    backgroundColor: '#FAFCFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 12,
  },
  classCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.navy,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  totalBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.midBlue,
    marginBottom: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  classTotalBox: {
    backgroundColor: '#EEF3FB',
    borderWidth: 1.5,
    borderColor: '#B2DDFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTotalNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  levelSummaryRow: {
    backgroundColor: '#EEF3FB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#B2DDFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  levelSummaryText: {
    fontSize: 12,
    color: THEME.colors.navy,
    fontWeight: '600',
  },
  boldNum: {
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  numInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.colors.navy,
    textAlign: 'center',
  },
  totalBadge: {
    backgroundColor: THEME.colors.background,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  totalText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F8',
  },
  switchLabel: {
    fontSize: 13,
    color: THEME.colors.text,
    fontWeight: '500',
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.background,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  summaryLbl: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  reviewLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#FAFCFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  reviewLevelName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  reviewLevelVal: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  certifyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    borderRadius: 8,
  },
  certifyText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.text,
    lineHeight: 16,
  },
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  prevBtn: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  prevBtnText: {
    color: THEME.colors.navy,
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveDraftBtn: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  saveDraftText: {
    color: THEME.colors.navy,
    fontWeight: 'bold',
    fontSize: 13,
  },
  nextBtn: {
    backgroundColor: THEME.colors.navy,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  submitFinalBtn: {
    backgroundColor: '#027A48',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  submitFinalText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
