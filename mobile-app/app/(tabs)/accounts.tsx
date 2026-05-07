import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import Svg, { Circle, Polygon, Rect, Path, Ellipse, Line } from 'react-native-svg';
import { Plus, CreditCard, Wallet, Trash2, X } from 'lucide-react-native';
import { useFinanceData } from '../../hooks/useFinanceData';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useHeroTheme } from '../../lib/themeContext';
import { HeroIcon } from '../../components/HeroIcon';
import { Footer } from '../../components/Footer';

const ACCOUNT_TYPES = ['Savings', 'Checking / Current', 'Credit Card', 'Digital Wallet', 'Cash'];

const HEROES = [
  { id: 'ironman', name: 'Iron Man', colors: ['#991b1b', '#7f1d1d'] },
  { id: 'cap', name: 'Captain America', colors: ['#1d4ed8', '#1e3a8a'] },
  { id: 'spidey', name: 'Spider-Man', colors: ['#ef4444', '#2563eb'] },
  { id: 'thor', name: 'Thor', colors: ['#475569', '#1e293b'] },
  { id: 'hulk', name: 'Hulk', colors: ['#16a34a', '#14532d'] },
  { id: 'panther', name: 'Black Panther', colors: ['#18181b', '#09090b'] },
  { id: 'widow', name: 'Black Widow', colors: ['#18181b', '#450a0a'] },
  { id: 'strange', name: 'Dr. Strange', colors: ['#92400e', '#7c2d12'] },
];

export default function AccountsScreen() {
  const { accounts, transactions, email, isLoading } = useFinanceData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const theme = useHeroTheme();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [type, setType] = useState(ACCOUNT_TYPES[0]);
  const [themeId, setThemeId] = useState('cap');

  const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN');

  const getHeroColors = (heroId: string) => HEROES.find(h => h.id === heroId)?.colors || ['#1d4ed8', '#1e3a8a'];

  const calculateBalance = (accountId: string, initialBalance: number) => {
    return transactions.filter(t => t.accountId === accountId).reduce((bal, tx) => {
      return tx.type === 'credit' ? bal + tx.amount : bal - tx.amount;
    }, initialBalance);
  };

  const handleDelete = async (id: string) => {
    if (!email) return;
    Alert.alert('Delete Account', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', email, 'accounts', id));
      }}
    ]);
  };

  const handleAddAccount = async () => {
    if (!email || !name || !initialBalance) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const id = Math.random().toString(36).substring(2, 11);
    try {
      await setDoc(doc(db, 'users', email, 'accounts', id), {
        name, type, initialBalance: parseFloat(initialBalance), themeId
      });
      setIsModalOpen(false);
      setName(''); setInitialBalance('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save account.');
    }
  };

  if (isLoading && email) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primaryDark }]} onPress={() => setIsModalOpen(true)}>
          <Plus size={20} color="white" />
          <Text style={styles.addBtnText}>Add New Account</Text>
        </TouchableOpacity>

        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No accounts found</Text>
            <Text style={styles.emptySubtitle}>Add a bank account to start tracking your money.</Text>
          </View>
        ) : (
          <View style={styles.cardGrid}>
            {accounts.map(acc => {
              const colors = getHeroColors(acc.themeId || 'cap');
              const currentBal = calculateBalance(acc.id, acc.initialBalance || 0);
              const hero = HEROES.find(h => h.id === acc.themeId);
              return (
                <View key={acc.id} style={[styles.accountCard, { backgroundColor: colors[0] }]}>
                  <View style={styles.heroIconBg}>
                    <HeroIcon heroId={acc.themeId || 'cap'} size={200} />
                  </View>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.heroEdition}>{hero?.name || 'Avenger'} Edition</Text>
                    <CreditCard size={20} color="rgba(255,255,255,0.8)" />
                  </View>
                  <Text style={styles.cardName}>{acc.name}</Text>
                  <Text style={styles.cardType}>{acc.type}</Text>
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.cardBalanceLabel}>Available Balance</Text>
                      <Text style={styles.cardBalance}>{formatCurrency(currentBal)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(acc.id)} style={styles.deleteCardBtn}>
                      <Trash2 size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <Footer />
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Bank Account</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.modalLabel}>Bank Name</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. HDFC, SBI, ICICI" value={name} onChangeText={setName} />

              <Text style={styles.modalLabel}>Account Type</Text>
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.typeItem, type === cat && styles.typeItemActive]} onPress={() => setType(cat)}>
                    <Text style={[styles.typeText, type === cat && styles.typeTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Initial Balance (₹)</Text>
              <TextInput style={styles.modalInput} placeholder="0.00" keyboardType="numeric" value={initialBalance} onChangeText={setInitialBalance} />

              <Text style={styles.modalLabel}>Card Theme (Avenger)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heroScroll}>
                {HEROES.map(hero => (
                  <TouchableOpacity key={hero.id} onPress={() => setThemeId(hero.id)}
                    style={[styles.heroItem, themeId === hero.id && { borderColor: '#2563eb', borderWidth: 2, backgroundColor: '#eff6ff' }]}>
                    <HeroIcon heroId={hero.id} size={40} />
                    <Text style={[styles.heroItemName, themeId === hero.id && { color: '#2563eb' }]}>{hero.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleAddAccount}>
                <Text style={styles.saveBtnText}>Add Account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  addBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  emptyState: { alignItems: 'center', padding: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  cardGrid: { gap: 20 },
  accountCard: { borderRadius: 28, padding: 24, height: 200, justifyContent: 'space-between', position: 'relative', overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
  heroIconBg: { position: 'absolute', right: -40, top: -40, opacity: 0.12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEdition: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1 },
  cardName: { fontSize: 24, fontWeight: '900', color: 'white' },
  cardType: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardBalanceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cardBalance: { fontSize: 28, fontWeight: '900', color: 'white' },
  deleteCardBtn: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  modalLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeItem: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#f1f5f9' },
  typeItemActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  typeTextActive: { color: 'white' },
  heroScroll: { marginBottom: 24 },
  heroItem: { alignItems: 'center', padding: 10, borderRadius: 16, backgroundColor: '#f8fafc', marginRight: 10, width: 80, borderWidth: 2, borderColor: '#f8fafc' },
  heroItemName: { fontSize: 9, fontWeight: '800', color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  saveBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 4, elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
