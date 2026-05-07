import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useFinanceData() {
  const [email, setEmail] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any>({});
  const [lendBorrows, setLendBorrows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmail();
  }, []);

  const loadEmail = async () => {
    const savedEmail = await AsyncStorage.getItem('financehub_user_email');
    setEmail(savedEmail);
    if (!savedEmail) setIsLoading(false);
  };

  useEffect(() => {
    if (!email) return;

    setIsLoading(true);

    // Fetch User Profile (Hero, Name)
    const unsubUser = onSnapshot(doc(db, 'public_users', email), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    const unsubTxs = onSnapshot(
      collection(db, 'users', email, 'transactions'), 
      (snap) => {
        const txs: any[] = [];
        snap.forEach(d => txs.push({ id: d.id, ...d.data() }));
        // Sort by date (newest first), then by createdAt (newest first) for same-day entries
        txs.sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setTransactions(txs);
      }
    );

    const unsubAccounts = onSnapshot(collection(db, 'users', email, 'accounts'), (snap) => {
      const accs: any[] = [];
      snap.forEach(d => accs.push({ id: d.id, ...d.data() }));
      setAccounts(accs);
    });

    const unsubBudgets = onSnapshot(collection(db, 'users', email, 'budgets'), (snap) => {
      const bgts: any = {};
      snap.forEach(d => bgts[d.id] = d.data().limit);
      setBudgets(bgts);
    });

    const unsubLendBorrows = onSnapshot(
      collection(db, 'users', email, 'lendBorrows'),
      (snap: QuerySnapshot<DocumentData>) => {
        const lbs: any[] = [];
        snap.forEach((d: DocumentData) => lbs.push({ id: d.id, ...d.data() }));
        // Sort by date (newest first), then by createdAt (newest first) for same-day entries
        lbs.sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
        setLendBorrows(lbs);
        setIsLoading(false);
      }
    );

    return () => {
      unsubUser();
      unsubTxs();
      unsubAccounts();
      unsubBudgets();
      unsubLendBorrows();
    };
  }, [email]);

  const currentBalances = useMemo(() => {
    const balances: any = {};
    accounts.forEach(acc => balances[acc.id] = acc.initialBalance || 0);
    transactions.forEach(tx => {
      if (!balances[tx.accountId]) return;
      if (tx.type === 'credit') balances[tx.accountId] += tx.amount;
      if (tx.type === 'debit') balances[tx.accountId] -= tx.amount;
    });
    return balances;
  }, [accounts, transactions]);

  const totalBalance = useMemo(() => 
    Object.values(currentBalances).reduce((a: number, b: any) => a + (Number(b) || 0), 0), 
  [currentBalances]);

  const totals = useMemo(() => ({
    income: transactions.filter(t => t.type === 'credit').reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0),
    expenses: transactions.filter(t => t.type === 'debit').reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0),
  }), [transactions]);

  return {
    email,
    userData,
    transactions,
    accounts,
    budgets,
    lendBorrows,
    totalBalance,
    currentBalances,
    totals,
    isLoading
  };
}
