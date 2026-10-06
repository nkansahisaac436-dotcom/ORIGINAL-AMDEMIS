import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function HeadteacherLayout() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState('My School');
  const [circuitName, setCircuitName] = useState('');

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
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
        .select('school_id, full_name, schools(name, circuits(name))')
        .eq('id', user.id)
        .single();

      if (profile?.schools) {
        const sch: any = profile.schools;
        setSchoolName(sch.name || 'My School');
        if (sch.circuits?.name) {
          setCircuitName(sch.circuits.name);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.navy,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#FFFFFF',
        headerTitle: () => (
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              {schoolName}
            </Text>
            {circuitName ? (
              <Text style={styles.headerSubtitleText} numberOfLines={1}>
                {circuitName} Circuit &bull; AMDEMIS
              </Text>
            ) : null}
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: THEME.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: THEME.colors.navy,
        tabBarInactiveTintColor: THEME.colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="form"
        options={{
          title: 'Data Form',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="submissions"
        options={{
          title: 'Submissions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'School Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="guidelines"
        options={{
          title: 'Guidelines',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    justifyContent: 'center',
    maxWidth: 220,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  headerSubtitleText: {
    color: THEME.colors.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
