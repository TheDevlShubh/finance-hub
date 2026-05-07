import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Modal, TextInput, Alert, Animated } from 'react-native';
import { Plus, X, Trash2, Download, Search, Lock, GraduationCap, ListOrdered, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFinanceData } from '../../hooks/useFinanceData';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useHeroTheme } from '../../lib/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Footer } from '../../components/Footer';

const CATEGORIES = ['Food', 'Rent', 'Salary', 'Entertainment', 'Utilities', 'Transportation', 'Shopping', 'Canteen', 'Stationery', 'Other'];
const SEMESTERS = ['None', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

export default function TransactionsScreen() {
  const { transactions, accounts, currentBalances, email, isLoading } = useFinanceData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useHeroTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSemester, setFilterSemester] = useState('All');

  // Form state
  const [amount, setAmount] = useState('');
  const [sourceDest, setSourceDest] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState('debit');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSem, setSelectedSem] = useState('None');

  useEffect(() => {
    loadLastSemester();
  }, []);

  const loadLastSemester = async () => {
    const lastSem = await AsyncStorage.getItem('financehub_last_sem');
    if (lastSem) setSelectedSem(lastSem);
  };

  const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN');

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = !searchTerm || 
      tx.sourceDest?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tx.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSem = filterSemester === 'All' || tx.semester === filterSemester;
    return matchesSearch && matchesType && matchesSem;
  });

  const handleDelete = async (id: string) => {
    if (!email) return;
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', email, 'transactions', id));
      }}
    ]);
  };

  const handleAdd = async () => {
    if (!email || !amount || !sourceDest || !accountId) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    if (type === 'debit') {
      const currentBalance = currentBalances[accountId] || 0;
      if (numericAmount > currentBalance) {
        Alert.alert('Insufficient Funds', `You only have ${formatCurrency(currentBalance)} in this account.`);
        return;
      }
    }

    const id = Math.random().toString(36).substring(2, 11);
    try {
      const txData: any = {
        amount: numericAmount, sourceDest, category, type, accountId, date, createdAt: Date.now()
      };
      if (selectedSem !== 'None') txData.semester = selectedSem;

      await setDoc(doc(db, 'users', email, 'transactions', id), txData);
      
      // Save last selected semester for future
      await AsyncStorage.setItem('financehub_last_sem', selectedSem);
      
      setIsModalOpen(false);
      setAmount(''); setSourceDest('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save.');
    }
  };

  if (isLoading && email) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Download size={18} color="#475569" />
            <Text style={styles.secondaryBtnText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={() => {
            if (accounts.length === 0) { Alert.alert('No Accounts', 'Add a bank account first.'); return; }
            setAccountId(accounts[0].id);
            setIsModalOpen(true);
          }}>
            <Plus size={18} color="white" />
            <Text style={styles.primaryBtnText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Filter Chips */}
        {/* Filter Center */}
        <View style={styles.filterCenter}>
          <View style={styles.typeSegment}>
            {[
              { id: 'all', label: 'All', icon: <ListOrdered size={16} /> },
              { id: 'credit', label: 'Income', icon: <ArrowUpRight size={16} /> },
              { id: 'debit', label: 'Expenses', icon: <ArrowDownRight size={16} /> }
            ].map(f => (
              <TouchableOpacity 
                key={f.id} 
                style={[
                  styles.segmentBtn, 
                  filterType === f.id && { backgroundColor: theme.accent, shadowColor: theme.accent, elevation: 4 }
                ]} 
                onPress={() => setFilterType(f.id)}
              >
                {React.cloneElement(f.icon as React.ReactElement, { color: filterType === f.id ? 'white' : '#64748b' })}
                <Text style={[styles.segmentText, filterType === f.id && styles.segmentTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.semFilterRow}>
            <Text style={styles.semFilterLabel}>Campus Mode:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semStrip}>
              <TouchableOpacity 
                style={[styles.semPill, filterSemester === 'All' && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                onPress={() => setFilterSemester('All')}
              >
                <Text style={[styles.semPillText, filterSemester === 'All' && styles.semPillTextActive]}>Off</Text>
              </TouchableOpacity>
              {SEMESTERS.filter(s => s !== 'None').map(s => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.semPill, filterSemester === s && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                  onPress={() => setFilterSemester(s)}
                >
                  <GraduationCap size={12} color={filterSemester === s ? 'white' : '#94a3b8'} />
                  <Text style={[styles.semPillText, filterSemester === s && styles.semPillTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Transaction List */}
        <GestureHandlerRootView>
          <View style={styles.listCard}>
            {filteredTxs.length > 0 ? filteredTxs.map((tx, i) => {
              const acc = accounts.find((a: any) => a.id === tx.accountId);
              const isDeletable = i < 5; // Recently expanded deletable range

              const renderRightActions = () => (
                <TouchableOpacity style={styles.swipeDeleteBtn} onPress={() => handleDelete(tx.id)}>
                  <Trash2 size={22} color="white" />
                  <Text style={styles.swipeDeleteText}>Delete</Text>
                </TouchableOpacity>
              );

              const row = (
                <View style={[styles.txItem, i === filteredTxs.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.txColorBar, { backgroundColor: tx.type === 'credit' ? '#16a34a' : '#ef4444' }]} />
                  <View style={styles.txMain}>
                    <View style={styles.txTitleRow}>
                      <Text style={styles.txName}>{tx.sourceDest}</Text>
                      {tx.semester && (
                        <View style={[styles.semTag, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '30' }]}>
                          <GraduationCap size={10} color={theme.accent} />
                          <Text style={[styles.semTagText, { color: theme.accent }]}>{tx.semester}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.txMeta}>{tx.category}{acc ? ` • ${acc.name}` : ''}</Text>
                    <Text style={styles.txDate}>{tx.date}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#16a34a' : '#ef4444' }]}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                    {!isDeletable && (
                      <View style={styles.lockedBadge}><Lock size={11} color="#94a3b8" /></View>
                    )}
                  </View>
                </View>
              );

              return isDeletable ? (
                <Swipeable key={tx.id} renderRightActions={renderRightActions} overshootRight={false}>{row}</Swipeable>
              ) : (
                <View key={tx.id}>{row}</View>
              );
            }) : (
              <Text style={styles.emptyText}>No transactions found.</Text>
            )}
          </View>
        </GestureHandlerRootView>

        <Footer />
      </ScrollView>

      {/* Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Transaction</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.typeToggle}>
                <TouchableOpacity style={[styles.toggleBtn, type === 'debit' && styles.toggleBtnActive]} onPress={() => setType('debit')}>
                  <Text style={[styles.toggleText, type === 'debit' && styles.toggleTextActive]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, type === 'credit' && styles.toggleBtnActive]} onPress={() => setType('credit')}>
                  <Text style={[styles.toggleText, type === 'credit' && styles.toggleTextActive]}>Income</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Campus Semester (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.semScroll}>
                {SEMESTERS.map(s => (
                  <TouchableOpacity 
                    key={s} 
                    style={[styles.semBadge, selectedSem === s && { backgroundColor: theme.accent, borderColor: theme.accent }]} 
                    onPress={() => setSelectedSem(s)}
                  >
                    <Text style={[styles.semText, selectedSem === s && styles.semTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.modalLabel}>Amount (₹)</Text>
              <TextInput style={styles.modalInput} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />

              <Text style={styles.modalLabel}>{type === 'debit' ? 'Description' : 'Source'}</Text>
              <TextInput style={styles.modalInput} placeholder={type === 'debit' ? 'e.g. Lunch, Books' : 'e.g. Pocket Money'} value={sourceDest} onChangeText={setSourceDest} />

              <Text style={styles.modalLabel}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.catBadge, category === cat && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Account</Text>
              <View style={styles.catGrid}>
                {accounts.map((acc: any) => (
                  <TouchableOpacity 
                    key={acc.id} 
                    style={[styles.catBadge, accountId === acc.id && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
                    onPress={() => setAccountId(acc.id)}
                  >
                    <Text style={[styles.catText, accountId === acc.id && styles.catTextActive]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
                onPress={handleAdd}
              >
                <Text style={styles.saveBtnText}>Log Transaction</Text>
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
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  primaryBtn: { flex: 1, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  primaryBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  secondaryBtn: { flex: 1, backgroundColor: 'white', paddingVertical: 14, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  warningBanner: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d', padding: 14, borderRadius: 16, marginBottom: 16 },
  warningText: { color: '#92400e', fontWeight: '600', fontSize: 13 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1e293b' },
  filterCenter: { marginBottom: 20, gap: 12 },
  typeSegment: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 4, borderRadius: 14 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  segmentBtnActive: { backgroundColor: '#2563eb', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  segmentTextActive: { color: 'white' },
  semFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  semFilterLabel: { fontSize: 12, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  semStrip: { flex: 1 },
  semPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'white', borderSize: 1, borderColor: '#e2e8f0', marginRight: 8, borderStyle: 'solid', borderWidth: 1 },
  semPillActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  semPillText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  semPillTextActive: { color: 'white' },
  listCard: { backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  txItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txColorBar: { width: 4, height: '100%', borderRadius: 2, marginRight: 14, minHeight: 50 },
  txMain: { flex: 1 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  semTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 0.5, borderColor: '#c7d2fe' },
  semTagText: { fontSize: 10, fontWeight: '800', color: '#6366f1' },
  txMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  txDate: { fontSize: 11, color: '#cbd5e1', marginTop: 2, fontWeight: '600' },
  txRight: { alignItems: 'flex-end', gap: 8 },
  txAmount: { fontSize: 17, fontWeight: '900' },
  deleteBtn: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 10 },
  swipeDeleteBtn: { backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', width: 80, borderTopRightRadius: 0, borderBottomRightRadius: 0, gap: 4 },
  swipeDeleteText: { color: 'white', fontSize: 11, fontWeight: '800' },
  lockedBadge: { backgroundColor: '#f1f5f9', padding: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 6, borderRadius: 16, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#0f172a' },
  modalLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 20 },
  semScroll: { marginBottom: 20, marginHorizontal: -4 },
  semBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  semBadgeActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  semText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  semTextActive: { color: 'white' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catBadge: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#f1f5f9' },
  catBadgeActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  catText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  catTextActive: { color: 'white' },
  saveBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 4, elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
