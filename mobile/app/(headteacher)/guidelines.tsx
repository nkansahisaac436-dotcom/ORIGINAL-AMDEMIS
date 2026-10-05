import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { THEME } from '../../src/lib/theme';

export default function HeadteacherGuidelinesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>District Data Collection Guidelines</Text>
          <Text style={styles.headerSub}>
            Ministry of Education &bull; Atwima Mponua District Education Directorate
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={THEME.colors.navy} />
            <Text style={styles.sectionTitle}>1. Purpose of Annual EMIS Census</Text>
          </View>
          <Text style={styles.bodyText}>
            The annual data collection exercises provide authentic baseline statistics used for teacher rationalisation, capitation grant allocation, textbook and learning material distribution, and district infrastructural planning.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="school" size={20} color={THEME.colors.navy} />
            <Text style={styles.sectionTitle}>2. Enrolment & Curriculum Standards</Text>
          </View>
          <Text style={styles.bodyText}>
            • Record all active enrolments as of the census date.{'\n'}
            • Early Grade detail covers Basic 1 (BS1) through Basic 3 (BS3).{'\n'}
            • Upper Primary covers Basic 4 (BS4) through Basic 6 (BS6).{'\n'}
            • Junior High School (JHS1–JHS3) requires subject teacher allocations for key curriculum disciplines.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={20} color={THEME.colors.navy} />
            <Text style={styles.sectionTitle}>3. Classroom & Infrastructure Rule</Text>
          </View>
          <Text style={styles.bodyText}>
            Classroom counts are subjected to strict mathematical cross-validation. The sum of classrooms in Good Condition and classrooms In Need of Major Repair must never exceed the total Permanent Classrooms recorded.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={20} color={THEME.colors.navy} />
            <Text style={styles.sectionTitle}>4. Support & Contacts</Text>
          </View>
          <Text style={styles.bodyText}>
            For assistance with forgotten PINs or errors in school profile records, please contact the Planning & Statistics Unit officer in charge of your circuit.
          </Text>
        </View>
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
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.colors.navy,
  },
  bodyText: {
    fontSize: 13,
    color: THEME.colors.text,
    lineHeight: 18,
  },
});
