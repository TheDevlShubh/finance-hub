import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, MailCheck, Sparkles, LogOut, Key } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFinanceData } from '../../hooks/useFinanceData';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { HeroIcon } from '../../components/HeroIcon';
import { encode as btoa } from 'base-64';
import { useHeroTheme } from '../../lib/themeContext';
import { HERO_THEMES } from '../../lib/heroThemes';
import { Footer } from '../../components/Footer';

const HEROES = [
  { id: 'ironman', name: 'Iron Man' },
  { id: 'cap', name: 'Cap. America' },
  { id: 'spidey', name: 'Spider-Man' },
  { id: 'thor', name: 'Thor' },
  { id: 'hulk', name: 'Hulk' },
  { id: 'panther', name: 'Black Panther' },
  { id: 'widow', name: 'Black Widow' },
  { id: 'strange', name: 'Dr. Strange' },
];

export default function ProfileScreen() {
  const { userData, email, isLoading } = useFinanceData();
  const [name, setName] = useState('');
  const [selectedHero, setSelectedHero] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const theme = useHeroTheme();

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setSelectedHero(userData.heroId || 'ironman');
    }
    loadLocalSettings();
  }, [userData]);

  const loadLocalSettings = async () => {
    const savedKey = await AsyncStorage.getItem('financehub_gemini_key');
    if (savedKey) setGeminiKey(savedKey);
  };

  const saveSettings = async () => {
    if (!email) return;
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    setIsSaving(true);
    try {
      const updateData: any = { name, heroId: selectedHero };
      if (newPassword) {
        updateData.password = btoa(newPassword);
      }
      await setDoc(doc(db, 'public_users', email), updateData, { merge: true });
      await AsyncStorage.setItem('financehub_gemini_key', geminiKey);
      Alert.alert('✅ Initiative Updated', 'Your identity and protocols have been synchronized.');
      setNewPassword('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update identity.');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('financehub_user_email');
        router.replace('/login');
      }}
    ]);
  };

  if (isLoading && !userData) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* HERO IDENTITY SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={20} color="#ef4444" />
            <Text style={styles.sectionTitle}>Avenger Identity</Text>
          </View>
          
          <Text style={styles.label}>Display Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your Alias" placeholderTextColor="#94a3b8" />

          <Text style={[styles.label, { marginTop: 16 }]}>Choose Your Hero</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heroPicker}>
            {HEROES.map((hero) => {
              const isSelected = selectedHero === hero.id;
              const heroColor = HERO_THEMES[hero.id]?.primary || '#2563eb';
              return (
                <TouchableOpacity 
                  key={hero.id} 
                  onPress={() => setSelectedHero(hero.id)}
                  style={[
                    styles.heroItem, 
                    isSelected && { transform: [{ scale: 1.15 }], zIndex: 10 }
                  ]}>
                  <View style={[
                    styles.heroRing,
                    isSelected && { borderColor: heroColor, borderWidth: 3, shadowColor: heroColor, shadowOpacity: 0.6, shadowRadius: 10, elevation: 12 }
                  ]}>
                    <HeroIcon heroId={hero.id} size={48} grayscale={!isSelected} />
                  </View>
                  <Text style={[styles.heroName, isSelected && { color: '#0f172a', fontWeight: '900' }]}>{hero.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* CLOUD SYNC */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MailCheck size={20} color="#2563eb" />
            <Text style={styles.sectionTitle}>Cloud Synchronization</Text>
          </View>
          <Text style={styles.label}>Registered Email</Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{email}</Text>
          </View>
        </View>

        {/* AI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color="#eab308" />
            <Text style={styles.sectionTitle}>AI Integration</Text>
          </View>
          <Text style={styles.label}>Gemini API Key</Text>
          <TextInput style={styles.input} value={geminiKey} onChangeText={setGeminiKey} placeholder="AIzaSy..." placeholderTextColor="#94a3b8" secureTextEntry />
          <Text style={styles.helperText}>Stored only on your device. Used to power AI insights.</Text>
        </View>

        {/* SECURITY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Key size={20} color="#64748b" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <Text style={styles.label}>New Password (leave blank to keep current)</Text>
          <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" placeholderTextColor="#94a3b8" secureTextEntry />
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary, shadowColor: theme.primary }, isSaving && { opacity: 0.7 }]} onPress={saveSettings} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout from Initiative</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.logoutButton, { marginTop: 10, opacity: 0.6 }]} 
          onPress={() => {
            Alert.alert(
              'Terminate Account', 
              'This will delete your identity from the Finance Hub. This action cannot be undone.', 
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete Forever', 
                  style: 'destructive', 
                  onPress: async () => {
                    if (!email) return;
                    try {
                      await deleteDoc(doc(db, 'public_users', email));
                      await AsyncStorage.removeItem('financehub_user_email');
                      router.replace('/login');
                    } catch (e) {
                      Alert.alert('Error', 'Failed to delete account.');
                    }
                  } 
                }
              ]
            );
          }}
        >
          <Shield size={18} color="#94a3b8" />
          <Text style={[styles.logoutText, { color: '#94a3b8', fontSize: 13 }]}>Terminate Account Identity</Text>
        </TouchableOpacity>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  scrollContent: { padding: 24, paddingTop: 20, paddingBottom: 100 },
  section: { backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  label: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '500', color: '#1e293b' },
  readOnlyInput: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  readOnlyText: { color: '#64748b', fontWeight: '600' },
  helperText: { fontSize: 12, color: '#94a3b8', marginTop: 8, fontWeight: '500' },
  heroPicker: { marginHorizontal: -4, marginTop: 10, paddingVertical: 10 },
  heroItem: { alignItems: 'center', marginRight: 24 },
  heroRing: { padding: 4, borderRadius: 32, backgroundColor: 'white', borderWidth: 2, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginTop: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroNameActive: { color: '#0f172a' },
  saveButton: { backgroundColor: '#2563eb', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, marginBottom: 20 },
  saveButtonText: { color: 'white', fontWeight: '800', fontSize: 18 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', padding: 10 },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 16 }
});
