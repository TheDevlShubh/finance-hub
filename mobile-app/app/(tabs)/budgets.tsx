import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from 'react-native';
import { Sparkles, Bot, AlertCircle, Plus, X } from 'lucide-react-native';
import { useFinanceData } from '../../hooks/useFinanceData';
import { callGemini } from '../../lib/gemini';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Footer } from '../../components/Footer';

const CATEGORIES = ['Food', 'Rent', 'Salary', 'Entertainment', 'Utilities', 'Transportation', 'Shopping', 'Other'];

export default function BudgetsScreen() {
  const { budgets, transactions, email, isLoading } = useFinanceData();
  const [budgetAdvice, setBudgetAdvice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState('');

  const spent: any = {};
  transactions.filter(t => t.type === 'debit').forEach(tx => {
    spent[tx.category] = (spent[tx.category] || 0) + tx.amount;
  });

  const getSmartAdvice = async () => {
    setIsAnalyzing(true);
    const prompt = `User Budgets: ${JSON.stringify(budgets)}. Current Spending: ${JSON.stringify(spent)}. Provide a 2-sentence financial advice.`;
    const response = await callGemini(prompt);
    setBudgetAdvice(response || "AI is resting. Try again later!");
    setIsAnalyzing(false);
  };

  const handleAddBudget = async () => {
    if (!email || !limit) {
      Alert.alert('Error', 'Please enter a limit.');
      return;
    }

    try {
      await setDoc(doc(db, 'users', email, 'budgets', category), { limit: parseFloat(limit) });
      setIsModalOpen(false);
      setLimit('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save budget.');
    }
  };

  const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN');

  if (isLoading && email) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={getSmartAdvice} disabled={isAnalyzing}>
            {isAnalyzing ? <ActivityIndicator size="small" color="#2563eb" /> : <Sparkles size={16} color="#eab308" />}
            <Text style={styles.headerButtonText}>Smart Review</Text>
          </TouchableOpacity>
        </View>

        {budgetAdvice && (
          <View style={styles.aiCard}>
            <Bot size={28} color="#60a5fa" />
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>AI Budget Analysis</Text>
              <Text style={styles.aiText}>{budgetAdvice}</Text>
            </View>
          </View>
        )}

        <View style={styles.budgetList}>
          {Object.entries(budgets).map(([cat, lim]: [string, any]) => {
            const amountSpent = spent[cat] || 0;
            const percentage = Math.min((amountSpent / lim) * 100, 100);
            const isOver = amountSpent > lim;
            const isWarning = percentage >= 80 && !isOver;

            let barColor = '#3b82f6';
            if (isWarning) barColor = '#fbbf24';
            if (isOver) barColor = '#ef4444';

            return (
              <View key={cat} style={styles.budgetItem}>
                {isOver && (
                  <View style={styles.overBadge}>
                    <AlertCircle size={12} color="#dc2626"/>
                    <Text style={styles.overBadgeText}>Over limit</Text>
                  </View>
                )}
                <Text style={styles.categoryName}>{cat}</Text>
                <Text style={styles.spendingInfo}>
                  {formatCurrency(amountSpent)} / {formatCurrency(lim)}
                </Text>
                
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={[styles.percentageText, isOver && { color: '#dc2626' }]}>{percentage.toFixed(0)}% Used</Text>
                  <Text style={styles.leftText}>{formatCurrency(Math.max(lim - amountSpent, 0))} Left</Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.addCard} onPress={() => setIsModalOpen(true)}>
            <View style={styles.plusIconBg}>
               <Plus size={24} color="#64748b" />
            </View>
            <Text style={styles.addCardText}>Create New Budget</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </ScrollView>

      {/* ADD BUDGET MODAL */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Budget</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.modalLabel}>Category</Text>
              <View style={styles.typeGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.typeItem, category === cat && styles.typeItemActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.typeText, category === cat && styles.typeTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Monthly Limit</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="0.00" 
                keyboardType="numeric"
                value={limit}
                onChangeText={setLimit}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddBudget}>
                <Text style={styles.saveBtnText}>Save Budget</Text>
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4, fontWeight: '500' },
  headerButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  headerButtonText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  aiCard: { backgroundColor: '#0f172a', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 32 },
  aiContent: { flex: 1 },
  aiTitle: { fontSize: 18, fontWeight: '800', color: 'white', marginBottom: 4 },
  aiText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  budgetList: { gap: 16 },
  budgetItem: { backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', position: 'relative', overflow: 'hidden' },
  overBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  overBadgeText: { color: '#dc2626', fontSize: 11, fontWeight: '800' },
  categoryName: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  spendingInfo: { fontSize: 14, color: '#64748b', fontWeight: '600', marginTop: 4, marginBottom: 20 },
  progressBarBg: { width: '100%', height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  progressBarFill: { height: '100%', borderRadius: 6 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percentageText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  leftText: { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  addCard: { borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', padding: 32, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', marginTop: 8 },
  plusIconBg: { width: 48, height: 48, backgroundColor: 'white', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  addCardText: { fontSize: 17, fontWeight: '700', color: '#64748b' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  modalLabel: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 8, marginLeft: 4 },
  modalInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 20 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeItem: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#f1f5f9' },
  typeItemActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  typeTextActive: { color: 'white' },
  saveBtn: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '800' }
});
