import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { THEME } from '../../src/lib/theme';

export default function AdminLayout() {
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Sign out of Admin Portal?', [
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
            <Text style={styles.headerTitleText}>AMDEMIS Directorate</Text>
            <Text style={styles.headerSubtitleText}>Planning & Statistics Unit</Text>
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
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: 'Schools & PINs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="circuits"
        options={{
          title: 'Circuits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    justifyContent: 'center',
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
