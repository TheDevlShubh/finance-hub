import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Plus, X, CheckCircle, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useFinanceData } from '../../hooks/useFinanceData';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useHeroTheme } from '../../lib/themeContext';
import { Footer } from '../../components/Footer';

export default function LendBorrowScreen() {
  const { lendBorrows, accounts, email, isLoading } = useFinanceData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [type, setType] = useState<'lend' | 'borrow'>('lend');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const theme = useHeroTheme();

  const activeLends = lendBorrows.filter(lb => lb.type === 'lend' && lb.status === 'active');
  const activeBorrows = lendBorrows.filter(lb => lb.type === 'borrow' && lb.status === 'active');
  const settledItems = lendBorrows.filter(lb => lb.status === 'settled');

  const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN');

  const totalLent = activeLends.reduce((s, lb) => s + lb.amount, 0);
  const totalBorrowed = activeBorrows.reduce((s, lb) => s + lb.amount, 0);

  const handleAdd = async () => {
    if (!email || !person || !amount || !accountId) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const id = Math.random().toString(36).substring(2, 11);
    const lb = { type, person, amount: parseFloat(amount), date, status: 'active', accountId, createdAt: Date.now() };
    const tx = {
      type: type === 'lend' ? 'debit' : 'credit',
      amount: parseFloat(amount),
      accountId,
      category: type === 'lend' ? 'Lent Money' : 'Borrowed Money',
      sourceDest: person,
      date
    };
    const txId = Math.random().toString(36).substring(2, 11);
    try {
      await setDoc(doc(db, 'users', email, 'lendBorrows', id), lb);
      await setDoc(doc(db, 'users', email, 'transactions', txId), tx);
      setIsModalOpen(false);
      setPerson(''); setAmount('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save.');
    }
  };

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [itemToSettle, setItemToSettle] = useState<any>(null);
  const [settleAccountId, setSettleAccountId] = useState('');

  const handleSettle = (lb: any) => {
    setItemToSettle(lb);
    setSettleAccountId(lb.accountId || (accounts.length > 0 ? accounts[0].id : ''));
    setIsSettleModalOpen(true);
  };

  const confirmSettle = async () => {
    if (!email || !itemToSettle || !settleAccountId) return;
    
    const tx = {
      type: itemToSettle.type === 'lend' ? 'credit' : 'debit',
      amount: itemToSettle.amount,
      accountId: settleAccountId,
      category: itemToSettle.type === 'lend' ? 'Lend Received' : 'Borrow Returned',
      sourceDest: itemToSettle.person,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now()
    };
    const txId = Math.random().toString(36).substring(2, 11);
    
    try {
      await setDoc(doc(db, 'users', email, 'transactions', txId), tx);
      await setDoc(doc(db, 'users', email, 'lendBorrows', itemToSettle.id), { status: 'settled' }, { merge: true });
      setIsSettleModalOpen(false);
      setItemToSettle(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to settle.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!email) return;
    Alert.alert('Delete', 'Delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'users', email, 'lendBorrows', id));
      }}
    ]);
  };

  if (isLoading && email) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563eb" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.summaryLabel}>To Receive</Text>
            <Text style={[styles.summaryAmount, { color: '#16a34a' }]}>{formatCurrency(totalLent)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fef2f2' }]}>
            <Text style={styles.summaryLabel}>To Return</Text>
            <Text style={[styles.summaryAmount, { color: '#dc2626' }]}>{formatCurrency(totalBorrowed)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => {
          if (accounts.length === 0) { Alert.alert('No Accounts', 'Add a bank account first.'); return; }
          setAccountId(accounts[0].id);
          setIsModalOpen(true);
        }}>
          <Plus size={20} color="white" />
          <Text style={styles.addBtnText}>Add New Entry</Text>
        </TouchableOpacity>

        {/* Active Lends */}
        {activeLends.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💚 Money I Lent (To Receive)</Text>
            {activeLends.map(lb => <LendBorrowItem key={lb.id} lb={lb} onSettle={handleSettle} onDelete={handleDelete} formatCurrency={formatCurrency} />)}
          </View>
        )}

        {/* Active Borrows */}
        {activeBorrows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>❤️ Money I Borrowed (To Return)</Text>
            {activeBorrows.map(lb => <LendBorrowItem key={lb.id} lb={lb} onSettle={handleSettle} onDelete={handleDelete} formatCurrency={formatCurrency} />)}
          </View>
        )}

        {/* Settled */}
        {settledItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Settled</Text>
            {settledItems.map(lb => (
              <View key={lb.id} style={[styles.item, { opacity: 0.5 }]}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemPerson}>{lb.person}</Text>
                  <Text style={styles.itemMeta}>{lb.type === 'lend' ? 'Lent' : 'Borrowed'} • {lb.date}</Text>
                </View>
                <Text style={styles.itemAmount}>{formatCurrency(lb.amount)}</Text>
              </View>
            ))}
          </View>
        )}
        {lendBorrows.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No records yet. Add a lend or borrow!</Text>
          </View>
        )}
        <Footer />
      </ScrollView>

      {/* Modal */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Entry</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.typeToggle}>
                <TouchableOpacity style={[styles.toggleBtn, type === 'lend' && styles.toggleBtnActive]} onPress={() => setType('lend')}>
                  <Text style={[styles.toggleText, type === 'lend' && styles.toggleTextActive]}>I Lent Money</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, type === 'borrow' && styles.toggleBtnActive]} onPress={() => setType('borrow')}>
                  <Text style={[styles.toggleText, type === 'borrow' && styles.toggleTextActive]}>I Borrowed Money</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLabel}>Person Name</Text>
              <TextInput style={styles.modalInput} placeholder="e.g. Rahul" value={person} onChangeText={setPerson} />
              <Text style={styles.modalLabel}>Amount (₹)</Text>
              <TextInput style={styles.modalInput} placeholder="0.00" keyboardType="numeric" value={amount} onChangeText={setAmount} />
              <Text style={styles.modalLabel}>Account</Text>
              <View style={styles.accRow}>
                {accounts.map(acc => (
                  <TouchableOpacity key={acc.id} style={[styles.accBadge, accountId === acc.id && styles.accBadgeActive]} onPress={() => setAccountId(acc.id)}>
                    <Text style={[styles.accText, accountId === acc.id && styles.accTextActive]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Add Record</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Settle Modal */}
      <Modal visible={isSettleModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Settle Entry</Text>
                <Text style={styles.itemMeta}>Confirming ₹{itemToSettle?.amount} with {itemToSettle?.person}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSettleModalOpen(false)}><X size={24} color="#64748b" /></TouchableOpacity>
            </View>
            
            <Text style={styles.modalLabel}>Receive/Pay From Account</Text>
            <View style={styles.accRow}>
              {accounts.map(acc => (
                <TouchableOpacity key={acc.id} style={[styles.accBadge, settleAccountId === acc.id && styles.accBadgeActive]} onPress={() => setSettleAccountId(acc.id)}>
                  <Text style={[styles.accText, settleAccountId === acc.id && styles.accTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: '#16a34a', shadowColor: '#16a34a' }]} 
              onPress={confirmSettle}
            >
              <CheckCircle size={20} color="white" />
              <Text style={styles.saveBtnText}>Confirm Settlement</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function LendBorrowItem({ lb, onSettle, onDelete, formatCurrency }: any) {
  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemPerson}>{lb.person}</Text>
        <Text style={styles.itemMeta}>{lb.type === 'lend' ? 'Lent' : 'Borrowed'} • {lb.date}</Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.itemAmount, { color: lb.type === 'lend' ? '#16a34a' : '#dc2626' }]}>{formatCurrency(lb.amount)}</Text>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.settleBtn} onPress={() => onSettle(lb)}>
            <CheckCircle size={14} color="#16a34a" />
            <Text style={styles.settleBtnText}>Settle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(lb.id)}>
            <Trash2 size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  summaryCard: { flex: 1, padding: 20, borderRadius: 24 },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  summaryAmount: { fontSize: 24, fontWeight: '900' },
  addBtn: { backgroundColor: '#0f172a', padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  addBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 18, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  itemLeft: { flex: 1 },
  itemPerson: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  itemMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemAmount: { fontSize: 18, fontWeight: '900' },
  itemActions: { flexDirection: 'row', gap: 8 },
  settleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  settleBtnText: { color: '#16a34a', fontSize: 12, fontWeight: '800' },
  deleteBtn: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 10 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#f1f5f9', padding: 6, borderRadius: 16, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  toggleBtnActive: { backgroundColor: 'white', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  toggleTextActive: { color: '#0f172a' },
  modalLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 20 },
  accRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  accBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#f1f5f9' },
  accBadgeActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  accText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  accTextActive: { color: 'white' },
  saveBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 4, elevation: 4, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
