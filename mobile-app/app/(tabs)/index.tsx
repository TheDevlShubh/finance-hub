import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native';
import { Bot, Sparkles, Wallet, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react-native';
import { useFinanceData } from '../../hooks/useFinanceData';
import { callGemini } from '../../lib/gemini';
import { useRouter } from 'expo-router';
import { HeroIcon } from '../../components/HeroIcon';
import { useHeroTheme } from '../../lib/themeContext';
import { Footer } from '../../components/Footer';

export default function DashboardScreen() {
  const { totalBalance, totals, transactions, accounts, email, userData, isLoading } = useFinanceData();
  const [aiInsight, setAiInsight] = useState('System standby. Awaiting command to analyze financial vectors.');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const theme = useHeroTheme();

  useEffect(() => {
    if (!isLoading && !email) router.replace('/login');
  }, [isLoading, email]);

  const generateInsight = async () => {
    setIsAnalyzing(true);
    const heroName = userData?.heroId || 'Iron Man';
    const recentTxs = transactions.slice(0, 5).map((t: any) => `₹${t.amount} on ${t.category}`).join(', ');
    const prompt = `You are ${heroName} from Marvel, a financial advisor. The user has total balance ₹${totalBalance}, income ₹${totals.income}, expenses ₹${totals.expenses}. Recent: ${recentTxs}. Give a short 2-sentence funny, encouraging financial tip in character. No markdown.`;
    const response = await callGemini(prompt);
    setAiInsight(response || 'Unable to connect to AI mainframe.');
    setIsAnalyzing(false);
  };

  const formatCurrency = (val: number) => "₹" + val.toLocaleString('en-IN');

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Initializing Secure Link...</Text>
      </View>
    );
  }
  if (!email) return <View style={styles.container} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Footer />
        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome back,</Text>
            <Text style={[styles.welcomeName, { color: theme.primary }]}>{userData?.name || 'Avenger'} 👋</Text>
            <Text style={styles.welcomeSub}>Here's your financial overview for today.</Text>
          </View>
        </View>

        {/* AI Insight Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiInner}>
            <View style={[styles.aiBotIcon, { backgroundColor: theme.primary }]}>
              <Bot size={24} color="white" />
            </View>
            <View style={styles.flex1}>
              <View style={styles.row}>
                <Text style={styles.aiTitle}>{userData?.heroId === 'ironman' ? 'Iron Man' : userData?.heroId === 'cap' ? 'Cap' : 'Avenger'} AI Protocol</Text>
                <Sparkles size={16} color={theme.accent} />
              </View>
              <Text style={styles.aiText}>{aiInsight}</Text>
              <TouchableOpacity style={[styles.aiBtn, isAnalyzing && { opacity: 0.6 }]} onPress={generateInsight} disabled={isAnalyzing}>
                {isAnalyzing ? <ActivityIndicator size="small" color="white" /> : <Sparkles size={14} color="white" />}
                <Text style={styles.aiBtnText}>{isAnalyzing ? 'Analyzing...' : 'Generate AI Insight ✨'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Summary Row */}
        <View style={styles.statsRow}>
          <View style={[styles.balanceCard, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
            <View style={styles.walletBg}><Wallet size={90} color="white" opacity={0.2} /></View>
            <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
          </View>
        </View>
        
        <View style={styles.miniStatsRow}>
          <View style={styles.miniCard}>
            <View style={[styles.miniIconCircle, { backgroundColor: '#f0fdf4' }]}>
              <ArrowUpRight size={18} color="#16a34a" />
            </View>
            <Text style={styles.miniLabel}>Total Income</Text>
            <Text style={[styles.miniAmount, { color: '#16a34a' }]}>{formatCurrency(totals.income)}</Text>
          </View>
          <View style={styles.miniCard}>
            <View style={[styles.miniIconCircle, { backgroundColor: '#fef2f2' }]}>
              <ArrowDownRight size={18} color="#dc2626" />
            </View>
            <Text style={styles.miniLabel}>Total Expenses</Text>
            <Text style={[styles.miniAmount, { color: '#dc2626' }]}>{formatCurrency(totals.expenses)}</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {transactions.slice(0, 5).map((tx: any) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#f0fdf4' : '#f1f5f9' }]}>
                {tx.type === 'credit' ? <ArrowUpRight size={18} color="#16a34a" /> : <ArrowDownRight size={18} color="#64748b" />}
              </View>
              <View style={styles.flex1}>
                <Text style={styles.txName} numberOfLines={1}>{tx.sourceDest}</Text>
                <Text style={styles.txMeta}>{tx.category} • {tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === 'credit' ? '#16a34a' : '#dc2626' }]}>
                {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && <Text style={styles.emptyText}>No transactions yet. Add one to see it here.</Text>}
        </View>

        {/* My Accounts */}
        {accounts.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>My Accounts</Text>
            {accounts.map((acc: any) => (
              <View key={acc.id} style={styles.accItem}>
                <View style={styles.accIcon}>
                  <HeroIcon heroId={acc.themeId || 'cap'} size={40} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.accName}>{acc.name}</Text>
                  <Text style={styles.accType}>{acc.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 16, fontSize: 15, fontWeight: '700', color: '#64748b' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  welcomeRow: { marginBottom: 24 },
  welcomeTitle: { fontSize: 18, fontWeight: '600', color: '#64748b' },
  welcomeName: { fontSize: 30, fontWeight: '900', color: '#0f172a', marginTop: 2 },
  welcomeSub: { fontSize: 15, color: '#64748b', marginTop: 4, fontWeight: '500' },
  aiCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12 },
  aiInner: { flexDirection: 'row', gap: 14 },
  aiBotIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  aiTitle: { fontSize: 16, fontWeight: '800', color: 'white' },
  aiText: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  aiBtn: { backgroundColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  aiBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  statsRow: { marginBottom: 16 },
  balanceCard: { borderRadius: 28, padding: 28, position: 'relative', overflow: 'hidden', elevation: 8, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16 },
  walletBg: { position: 'absolute', bottom: -20, right: -20 },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  balanceAmount: { color: 'white', fontSize: 40, fontWeight: '900' },
  miniStatsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  miniCard: { flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  miniIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  miniLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  miniAmount: { fontSize: 20, fontWeight: '900' },
  sectionCard: { backgroundColor: 'white', borderRadius: 28, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewAllText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  txName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  txMeta: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '900' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: 20 },
  accItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  accIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  accName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  accType: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
});
