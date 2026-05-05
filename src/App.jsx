import React, { useState, useMemo, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Download, 
  LogOut, 
  LayoutDashboard, 
  ListOrdered, 
  Target, 
  Building2,
  AlertCircle,
  Shield,
  CreditCard,
  ChevronRight,
  Loader2,
  MailCheck,
  Sparkles,
  Bot
} from 'lucide-react';

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- GEMINI API HELPER ---
const callGemini = async (prompt) => {
  // Uses Vite environment variable, fallback to empty string
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 
  
  if (!apiKey) {
    return "Please set your VITE_GEMINI_API_KEY in the .env file to enable AI insights!";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (err) {
      if (attempt === 4) return "Error: Failed to connect to the AI mainframe. Please try again.";
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
};

// --- CONSTANTS ---
const CATEGORIES = ['Food', 'Rent', 'Salary', 'Entertainment', 'Utilities', 'Transportation', 'Shopping', 'Other'];

const HEROES = {
  ironman: { id: 'ironman', name: 'Iron Man', icon: '🤖', bg: 'bg-red-600', text: 'text-white', accent: 'text-yellow-400', border: 'border-red-500', gradient: 'from-red-600 to-red-800' },
  cap: { id: 'cap', name: 'Captain America', icon: '🛡️', bg: 'bg-blue-600', text: 'text-white', accent: 'text-red-300', border: 'border-blue-500', gradient: 'from-blue-600 to-blue-800' },
  spidey: { id: 'spidey', name: 'Spider-Man', icon: '🕸️', bg: 'bg-red-500', text: 'text-white', accent: 'text-blue-200', border: 'border-red-400', gradient: 'from-red-500 to-blue-600' },
  thor: { id: 'thor', name: 'Thor', icon: '⚡', bg: 'bg-slate-700', text: 'text-white', accent: 'text-yellow-300', border: 'border-slate-600', gradient: 'from-slate-600 to-slate-800' },
  hulk: { id: 'hulk', name: 'Hulk', icon: '✊', bg: 'bg-green-600', text: 'text-white', accent: 'text-purple-300', border: 'border-green-500', gradient: 'from-green-500 to-green-700' },
  panther: { id: 'panther', name: 'Black Panther', icon: '🐾', bg: 'bg-zinc-900', text: 'text-white', accent: 'text-purple-400', border: 'border-zinc-700', gradient: 'from-zinc-800 to-black' },
  widow: { id: 'widow', name: 'Black Widow', icon: '🕷️', bg: 'bg-black', text: 'text-white', accent: 'text-red-500', border: 'border-zinc-800', gradient: 'from-zinc-900 to-black' },
  strange: { id: 'strange', name: 'Doctor Strange', icon: '👁️', bg: 'bg-orange-800', text: 'text-white', accent: 'text-yellow-400', border: 'border-orange-700', gradient: 'from-orange-700 to-red-900' },
};

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [user, setUser] = useState(null); // Contains profile: { email, name, heroId }
  const [currentView, setCurrentView] = useState('dashboard');
  
  // App State
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState({});

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // --- FIREBASE DATA SYNC ---
  useEffect(() => {
    // Check if previously logged in via local storage just for session persistence
    const savedUser = localStorage.getItem('financehub_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Setup real-time listeners to Firestore when user is logged in
    const userEmail = user.email;

    const unsubAccounts = onSnapshot(collection(db, 'users', userEmail, 'accounts'), (snap) => {
      const accs = [];
      snap.forEach(d => accs.push({ id: d.id, ...d.data() }));
      setAccounts(accs);
    });

    const unsubTxs = onSnapshot(collection(db, 'users', userEmail, 'transactions'), (snap) => {
      const txs = [];
      snap.forEach(d => txs.push({ id: d.id, ...d.data() }));
      setTransactions(txs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    const unsubBudgets = onSnapshot(collection(db, 'users', userEmail, 'budgets'), (snap) => {
      const bgts = {};
      snap.forEach(d => bgts[d.id] = d.data().limit);
      setBudgets(bgts);
    });

    return () => {
      unsubAccounts();
      unsubTxs();
      unsubBudgets();
    };
  }, [user]);

  // --- DERIVED STATE ---
  const currentBalances = useMemo(() => {
    const balances = {};
    accounts.forEach(acc => balances[acc.id] = acc.initialBalance);
    transactions.forEach(tx => {
      if (!balances[tx.accountId]) return;
      if (tx.type === 'credit') balances[tx.accountId] += tx.amount;
      if (tx.type === 'debit') balances[tx.accountId] -= tx.amount;
    });
    return balances;
  }, [accounts, transactions]);

  const totalBalance = Object.values(currentBalances).reduce((a, b) => a + b, 0);

  const calculateTotal = (type) => {
    return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
  };

  // --- ACTIONS ---
  const handleLogin = (userData) => {
    localStorage.setItem('financehub_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => { 
    localStorage.removeItem('financehub_user');
    setUser(null); 
    setCurrentView('dashboard'); 
    setAccounts([]);
    setTransactions([]);
    setBudgets({});
  };

  const addTransaction = async (tx) => {
    const id = Math.random().toString(36).substring(2, 11);
    await setDoc(doc(db, 'users', user.email, 'transactions', id), tx);
    setIsTxModalOpen(false);
  };

  const addAccount = async (acc) => {
    const id = Math.random().toString(36).substring(2, 11);
    await setDoc(doc(db, 'users', user.email, 'accounts', id), acc);
    setIsAccountModalOpen(false);
  };

  const addBudget = async (bgt) => {
    await setDoc(doc(db, 'users', user.email, 'budgets', bgt.category), { limit: bgt.limit });
    setIsBudgetModalOpen(false);
  };

  // --- RENDER ---
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase">Initializing Secure Link...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const userTheme = HEROES[user.heroId] || HEROES.cap;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex relative selection:bg-blue-200">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 p-6 flex-col hidden md:flex shadow-sm z-10">
        <div className="flex items-center gap-3 text-slate-900 font-black text-2xl mb-10 tracking-tight">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${userTheme.gradient} flex items-center justify-center text-white shadow-md`}>
            <Shield className="w-6 h-6" />
          </div>
          <span>Finance<span className="text-blue-600">Hub</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" isActive={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={<Building2 />} label="Bank Accounts" isActive={currentView === 'accounts'} onClick={() => setCurrentView('accounts')} />
          <NavItem icon={<ListOrdered />} label="Transactions" isActive={currentView === 'transactions'} onClick={() => setCurrentView('transactions')} />
          <NavItem icon={<Target />} label="Budgets" isActive={currentView === 'budget'} onClick={() => setCurrentView('budget')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${userTheme.gradient} flex items-center justify-center text-2xl shadow-sm`}>
              {userTheme.icon}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-slate-900 text-sm font-bold truncate">{user.name}</p>
              <p className="text-slate-500 text-xs truncate">Avenger ID: {user.heroId}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 p-3 rounded-xl transition-colors text-sm w-full font-semibold">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-h-screen overflow-hidden bg-slate-50/50 relative">
        <header className="md:hidden bg-white p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-20">
          <div className="flex items-center gap-2 text-slate-900 font-black text-xl">
             <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${userTheme.gradient} flex items-center justify-center text-white`}>
              <Shield className="w-5 h-5" />
            </div>
            Finance<span className="text-blue-600">Hub</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-24 md:pb-10">
          {currentView === 'dashboard' && (
            <Dashboard 
              totalBalance={totalBalance} 
              income={calculateTotal('credit')} 
              expenses={calculateTotal('debit')}
              transactions={transactions}
              accounts={accounts}
              userTheme={userTheme}
            />
          )}
          {currentView === 'accounts' && (
            <Accounts 
              accounts={accounts} 
              currentBalances={currentBalances}
              onOpenAdd={() => setIsAccountModalOpen(true)}
            />
          )}
          {currentView === 'transactions' && (
            <Transactions 
              transactions={transactions} 
              accounts={accounts}
              onOpenAdd={() => setIsTxModalOpen(true)}
            />
          )}
          {currentView === 'budget' && (
            <Budgets 
              budgets={budgets} 
              transactions={transactions} 
              onOpenAdd={() => setIsBudgetModalOpen(true)}
              userTheme={userTheme}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {isTxModalOpen && <AddTransactionModal accounts={accounts} onClose={() => setIsTxModalOpen(false)} onAdd={addTransaction} />}
      {isAccountModalOpen && <AddAccountModal onClose={() => setIsAccountModalOpen(false)} onAdd={addAccount} />}
      {isBudgetModalOpen && <AddBudgetModal onClose={() => setIsBudgetModalOpen(false)} onAdd={addBudget} />}

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-safe z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem icon={<LayoutDashboard />} label="Home" isActive={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
        <MobileNavItem icon={<Building2 />} label="Accounts" isActive={currentView === 'accounts'} onClick={() => setCurrentView('accounts')} />
        <MobileNavItem icon={<ListOrdered />} label="History" isActive={currentView === 'transactions'} onClick={() => setCurrentView('transactions')} />
        <MobileNavItem icon={<Target />} label="Budgets" isActive={currentView === 'budget'} onClick={() => setCurrentView('budget')} />
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS & VIEWS ---

function Dashboard({ totalBalance, income, expenses, transactions, accounts, userTheme }) {
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  
  const [aiInsight, setAiInsight] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateInsight = async () => {
    setIsAnalyzing(true);
    const prompt = `You are a witty, encouraging financial assistant with the personality of ${userTheme.name} from Marvel. 
    The user has a total balance of ₹${totalBalance}, total income of ₹${income}, and total expenses of ₹${expenses}. 
    Recent transactions: ${transactions.slice(0, 5).map(t => `₹${t.amount} on ${t.category}`).join(', ')}. 
    Provide a fun, encouraging, and very short (2 sentences maximum) financial insight or advice based on this data. Do not use markdown bolding or bullet points.`;
    
    const response = await callGemini(prompt);
    setAiInsight(response);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Welcome back! 👋</h1>
        <p className="text-slate-500 mt-2 font-medium">Here's your financial overview for today.</p>
      </header>
      
      {/* AI Insight Section */}
      <div className={`bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl shadow-lg relative overflow-hidden group text-white border border-slate-700`}>
         <div className="flex items-start gap-4">
           <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${userTheme.gradient} flex items-center justify-center shadow-lg shrink-0`}>
             <Bot className="w-6 h-6 text-white" />
           </div>
           <div className="flex-1">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               {userTheme.name} AI Protocol <Sparkles className="w-4 h-4 text-yellow-400" />
             </h3>
             <p className="text-slate-300 text-sm mt-1 mb-3">
               {aiInsight || "System standby. Awaiting command to analyze financial vectors."}
             </p>
             <button 
               onClick={generateInsight}
               disabled={isAnalyzing}
               className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-slate-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/10"
             >
               {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
               {isAnalyzing ? "Analyzing..." : "Generate AI Insight ✨"}
             </button>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-gradient-to-br ${userTheme.gradient} p-8 rounded-3xl shadow-lg relative overflow-hidden group text-white`}>
          <div className="absolute top-0 right-0 p-6 opacity-20 transform group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-32 h-32 -mr-10 -mt-10" />
          </div>
          <p className="text-white/80 text-sm font-semibold mb-2 uppercase tracking-wider">Total Balance</p>
          <p className="text-4xl md:text-5xl font-black drop-shadow-md">{formatCurrency(totalBalance)}</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Income</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{formatCurrency(income)}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Expenses</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{formatCurrency(expenses)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Recent Transactions</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600 group-hover:bg-red-100 group-hover:text-red-600'} transition-colors`}>
                    {tx.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{tx.sourceDest}</p>
                    <p className="text-sm text-slate-500 font-medium">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <div className={`font-black text-lg ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-800'}`}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-semibold">No transactions yet.</p>
                <p className="text-slate-400 text-sm mt-1">Add a transaction to see it here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">My Accounts</h2>
          <div className="space-y-4">
            {accounts.map(acc => {
              const theme = HEROES[acc.themeId] || HEROES.cap;
              return (
                <div key={acc.id} className="p-4 border border-slate-100 rounded-2xl flex items-center gap-4 bg-white hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-xl shadow-sm text-white`}>
                    {theme.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">{acc.name}</p>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{acc.type}</p>
                  </div>
                </div>
              )
            })}
            {accounts.length === 0 && (
              <p className="text-slate-500 font-medium text-center py-6 bg-slate-50 rounded-2xl">No accounts added.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Accounts({ accounts, currentBalances, onOpenAdd }) {
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bank Accounts</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your superhero-themed cards.</p>
        </div>
        <button onClick={onOpenAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-600/30">
          <Plus className="w-5 h-5" /> Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-white shadow-sm">
           <CreditCard className="w-16 h-16 text-slate-300 mb-4" />
           <p className="text-slate-800 font-bold text-xl mb-2">No accounts found</p>
           <p className="text-slate-500 text-center max-w-sm mb-6">You need to add a bank account before you can start tracking your money.</p>
           <button onClick={onOpenAdd} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-colors">
              Add your first account
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => {
            const theme = HEROES[acc.themeId] || HEROES.cap;
            return (
              <div key={acc.id} className={`bg-gradient-to-br ${theme.gradient} p-6 sm:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group text-white h-56 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300`}>
                <div className="absolute top-0 right-0 p-6 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500 text-8xl">
                  {theme.icon}
                </div>
                
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className={`text-sm font-bold uppercase tracking-widest ${theme.accent}`}>{theme.name} Edition</p>
                    <CreditCard className="w-6 h-6 opacity-80" />
                  </div>
                  <h3 className="text-2xl font-black truncate pr-12">{acc.name}</h3>
                  <p className="text-white/70 text-xs font-semibold mt-1">{acc.type}</p>
                </div>
                
                <div>
                  <p className="text-white/70 text-xs font-semibold mb-1 uppercase tracking-widest">Available Balance</p>
                  <p className="text-3xl sm:text-4xl font-black drop-shadow-md">{formatCurrency(currentBalances[acc.id] || 0)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

function Transactions({ transactions, accounts, onOpenAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.sourceDest.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ['Date,Type,Amount,Category,Source/Destination,Account ID'];
    const rows = filteredTxs.map(tx => 
      `${tx.date},${tx.type},${tx.amount},${tx.category},"${tx.sourceDest}",${tx.accountId}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tight">Transactions</h1>
           <p className="text-slate-500 font-medium mt-1">Your complete financial history.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={handleExportCSV} className="flex-1 md:flex-none bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 rounded-2xl flex justify-center items-center gap-2 transition-colors font-bold border border-slate-200 shadow-sm">
            <Download className="w-5 h-5" /> Export CSV
          </button>
          <button 
            onClick={onOpenAdd} 
            disabled={accounts.length === 0}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none text-white px-6 py-3 rounded-2xl flex justify-center items-center gap-2 transition-all font-bold shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" /> Add Transaction
          </button>
        </div>
      </div>

      {accounts.length === 0 && (
         <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center gap-3 font-semibold shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0 text-amber-600" />
            <span>Please add a bank account first before logging transactions.</span>
         </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by store, category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 py-3 pl-12 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium shadow-sm"
          />
        </div>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-slate-200 text-slate-800 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium shadow-sm cursor-pointer"
        >
          <option value="all">All Transactions</option>
          <option value="credit">Income Only</option>
          <option value="debit">Expenses Only</option>
        </select>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 px-6 text-slate-500 font-bold text-sm uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 text-slate-500 font-bold text-sm uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-slate-500 font-bold text-sm uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 text-slate-500 font-bold text-sm uppercase tracking-wider">Account</th>
                <th className="py-4 px-6 text-slate-500 font-bold text-sm uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length > 0 ? filteredTxs.map(tx => {
                const acc = accounts.find(a => a.id === tx.accountId);
                return (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="py-5 px-6 text-slate-500 font-medium">{tx.date}</td>
                    <td className="py-5 px-6 font-bold text-slate-800">{tx.sourceDest}</td>
                    <td className="py-5 px-6">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-sm font-semibold">{tx.category}</span>
                    </td>
                    <td className="py-5 px-6 text-slate-500 font-medium">{acc ? acc.name : 'Unknown Account'}</td>
                    <td className={`py-5 px-6 text-right font-black text-lg ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-800'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-500 font-medium">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Budgets({ budgets, transactions, onOpenAdd, userTheme }) {
  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const spent = {};
  transactions.filter(t => t.type === 'debit').forEach(tx => {
    spent[tx.category] = (spent[tx.category] || 0) + tx.amount;
  });

  const [budgetAdvice, setBudgetAdvice] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getSmartAdvice = async () => {
    setIsAnalyzing(true);
    const prompt = `You are a strict but helpful financial advisor. The user has the following budgets set up: ${JSON.stringify(budgets)}. 
    Their spending in these categories so far this month is: ${JSON.stringify(spent)}. 
    Provide a concise, 2-3 sentence analysis of their budget health. Give one specific tip on where they should cut back or if they are doing well. Do not use markdown.`;
    
    const response = await callGemini(prompt);
    setBudgetAdvice(response);
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Budgets</h1>
          <p className="text-slate-500 font-medium mt-1">Keep your spending in check.</p>
        </div>
        <button 
          onClick={getSmartAdvice}
          disabled={isAnalyzing}
          className={`bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-50 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all font-bold shadow-sm`}
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className={`w-5 h-5 ${userTheme.accent.replace('text-', 'text-')}`} />}
          {isAnalyzing ? "Analyzing Budgets..." : "Smart AI Review ✨"}
        </button>
      </div>

      {budgetAdvice && (
        <div className={`bg-gradient-to-br ${userTheme.gradient} text-white p-6 rounded-3xl shadow-lg flex items-start gap-4`}>
          <Bot className={`w-8 h-8 shrink-0 ${userTheme.accent}`} />
          <div>
            <h3 className="font-bold text-lg mb-1">AI Budget Analysis</h3>
            <p className="text-white/90 font-medium leading-relaxed">{budgetAdvice}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(budgets).map(([category, limit]) => {
          const amountSpent = spent[category] || 0;
          const percentage = Math.min((amountSpent / limit) * 100, 100);
          const isOver = amountSpent > limit;
          const isWarning = percentage >= 80 && !isOver;

          let barColor = userTheme.bg; // Default to hero color
          if (isWarning) barColor = 'bg-amber-400';
          if (isOver) barColor = 'bg-red-500';

          return (
            <div key={category} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
               {isOver && <div className="absolute top-4 right-4 bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Over limit</div>}
              <h3 className="text-xl font-bold text-slate-800 mb-1">{category}</h3>
              <p className="text-sm font-semibold text-slate-500 mb-6">
                {formatCurrency(amountSpent)} / {formatCurrency(limit)}
              </p>
              
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className={isOver ? 'text-red-600' : 'text-slate-700'}>{percentage.toFixed(0)}% Used</span>
                <span className="text-slate-500">{formatCurrency(Math.max(limit - amountSpent, 0))} Left</span>
              </div>
            </div>
          );
        })}
        
        {/* Add Budget Card */}
        <div onClick={onOpenAdd} className="bg-transparent border-2 border-dashed border-slate-300 p-6 rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer min-h-[200px] group">
          <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <Plus className="w-8 h-8" />
          </div>
          <p className="font-bold text-lg">Create New Budget</p>
        </div>
      </div>
    </div>
  );
}


// --- MODALS ---

function AddTransactionModal({ accounts, onClose, onAdd }) {
  const [type, setType] = useState('debit');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sourceDest, setSourceDest] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !sourceDest || !accountId) return;
    onAdd({ type, amount: parseFloat(amount), accountId, category, sourceDest, date });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Add Transaction</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            <button type="button" onClick={() => setType('debit')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${type === 'debit' ? 'bg-white text-slate-900' : 'bg-transparent text-slate-500 shadow-none hover:text-slate-700'}`}>
              Expense
            </button>
            <button type="button" onClick={() => setType('credit')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${type === 'credit' ? 'bg-white text-slate-900' : 'bg-transparent text-slate-500 shadow-none hover:text-slate-700'}`}>
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
              <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 pl-10 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold text-lg transition-all" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">{type === 'debit' ? 'Where did you spend it?' : 'Where did it come from?'}</label>
            <input type="text" required value={sourceDest} onChange={e => setSourceDest(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all" placeholder={type === 'debit' ? 'e.g. Swiggy, Amazon' : 'e.g. Salary, Client payment'} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Account</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex gap-3 mt-8 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors font-bold">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl transition-all font-bold shadow-lg shadow-blue-600/30">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddAccountModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Savings');
  const [initialBalance, setInitialBalance] = useState('');
  const [themeId, setThemeId] = useState('cap');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !initialBalance) return;
    onAdd({ name, type, initialBalance: parseFloat(initialBalance), themeId });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Add Bank Account</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Bank Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all" placeholder="e.g. HDFC, SBI, ICICI" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Account Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all">
                <option value="Savings">Savings</option>
                <option value="Checking">Checking / Current</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Wallet">Digital Wallet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Current Balance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input type="number" step="0.01" required value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 pl-8 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold transition-all" placeholder="0.00" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Card Theme (Avenger)</label>
            <div className="grid grid-cols-4 gap-2">
               {Object.values(HEROES).map(hero => (
                 <div 
                   key={hero.id} 
                   onClick={() => setThemeId(hero.id)}
                   className={`cursor-pointer rounded-xl p-2 flex flex-col items-center justify-center gap-1 border-2 transition-all ${themeId === hero.id ? hero.border + ' bg-slate-50 scale-105 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
                 >
                   <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${hero.gradient} flex items-center justify-center text-lg text-white shadow-sm`}>{hero.icon}</div>
                   <span className="text-[10px] font-bold text-slate-600 text-center truncate w-full">{hero.name}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors font-bold">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl transition-all font-bold shadow-lg shadow-blue-600/30">Add Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddBudgetModal({ onClose, onAdd }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!limit) return;
    onAdd({ category, limit: parseFloat(limit) });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-black text-slate-900 mb-6">Create Budget</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium transition-all">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
              <input type="number" step="0.01" required value={limit} onChange={e => setLimit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 pl-10 pr-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-bold text-lg transition-all" placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-3 mt-8 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors font-bold">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl transition-all font-bold shadow-lg shadow-blue-600/30">Save Budget</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- AUTH & HELPERS ---

function AuthScreen({ onLogin }) {
  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  
  // Registration & Forgot Password Flow States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); 
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [selectedHero, setSelectedHero] = useState('ironman');
  
  // Error handling
  const [errorMsg, setErrorMsg] = useState('');
  const [devMessage, setDevMessage] = useState(''); 

  // Public registry to track accounts globally across sessions
  const [registeredUsers, setRegisteredUsers] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'public_users'), (snap) => {
      const users = [];
      snap.forEach(d => users.push({ id: d.id, ...d.data() }));
      setRegisteredUsers(users);
    });
    return () => unsub();
  }, []);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const sendOtpEmail = async (code, targetEmail) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && templateId && publicKey) {
      try {
        await emailjs.send(
          serviceId, templateId, 
          { to_email: targetEmail, otp_code: code, to_name: targetEmail.split('@')[0] }, 
          { publicKey: publicKey }
        );
        setOtpSent(true);
        setDevMessage(`A verification code was successfully sent to ${targetEmail}!`);
      } catch (error) {
        console.error('EmailJS Error:', error);
        const detailedError = error.text || error.message || "Unknown error";
        setErrorMsg(`EmailJS Error: ${detailedError}`);
      }
    } else {
      setOtpSent(true);
      setDevMessage(`[Prototype Inbox] An email was sent! Your OTP is: ${code}`);
    }
  };

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setDevMessage('');

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (view === 'login') {
      if (!existingUser) return setErrorMsg('Account not found. Please register a new account.');
      if (existingUser.password !== btoa(password)) return setErrorMsg('Incorrect password. Please try again.');
      onLogin({ email: existingUser.email, name: existingUser.name, heroId: existingUser.heroId });
    } 
    
    else if (view === 'register') {
      if (existingUser) return setErrorMsg('User with this email already exists.');
      
      if (!otpSent) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        await sendOtpEmail(code, email);
      } else if (otpSent && !isOtpVerified) {
        if (otp === generatedOtp) {
          setIsOtpVerified(true);
          setDevMessage('');
        } else {
          setErrorMsg('Invalid code. Please enter the exact 6-digit OTP.');
        }
      } else if (isOtpVerified) {
        const newUser = { email: email.toLowerCase(), name: email.split('@')[0], heroId: selectedHero, password: btoa(password) };
        await setDoc(doc(db, 'public_users', newUser.email), newUser);
        onLogin(newUser);
      }
    }

    else if (view === 'forgot') {
      if (!existingUser) return setErrorMsg('No account found with that email address.');

      if (!otpSent) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        await sendOtpEmail(code, email);
      } else if (otpSent && !isOtpVerified) {
        if (otp === generatedOtp) {
          setIsOtpVerified(true);
          setDevMessage('');
        } else {
          setErrorMsg('Invalid code. Please try again.');
        }
      } else if (isOtpVerified) {
        if (password.length < 6) return setErrorMsg('Password must be at least 6 characters.');
        // Update password in Firestore
        await setDoc(doc(db, 'public_users', existingUser.email), { ...existingUser, password: btoa(password) });
        setDevMessage('Password reset successfully! You can now log in.');
        setTimeout(() => resetFlow('login'), 2000);
      }
    }
  };

  const resetFlow = (newView) => {
    setView(newView);
    setOtpSent(false);
    setIsOtpVerified(false);
    setErrorMsg('');
    setDevMessage('');
    setOtp('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-red-400/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl shadow-slate-200/50 relative z-10 border border-slate-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Join the Initiative' : 'Reset Password'}
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-center">
            {view === 'login' ? 'Log in to access your financial dashboard.' 
             : view === 'register' ? 'Securely verify your email to create an account.'
             : 'Verify your email to create a new password.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
          </div>
        )}

        {devMessage && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 text-purple-700 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <MailCheck className="w-5 h-5 shrink-0" /> {devMessage}
          </div>
        )}

        <form onSubmit={handleAuthAction} className="space-y-5">
          
          {/* EMAIL (Always visible unless OTP is sent/verified in register/forgot) */}
          {(!otpSent || view === 'login') && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" 
                placeholder="name@gmail.com" 
              />
            </div>
          )}

          {/* PASSWORD (Login or Initial Register Step) */}
          {((view === 'login') || (view === 'register' && !otpSent)) && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" 
                placeholder="••••••••" 
              />
              {view === 'login' && (
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={() => resetFlow('forgot')} className="text-sm font-bold text-blue-600 hover:text-blue-700">
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* OTP VERIFICATION STEP */}
          {view !== 'login' && otpSent && !isOtpVerified && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-2">Enter Verification Code</label>
              <input 
                type="text" required maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-4 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all tracking-[1em] text-center font-bold text-2xl" 
                placeholder="000000" 
              />
            </div>
          )}

          {/* REGISTER: PROFILE SETUP STEP */}
          {view === 'register' && isOtpVerified && (
            <div className="pt-2 animate-in fade-in zoom-in-95 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-3 text-center">Choose your Avenger Profile</label>
              <div className="flex flex-wrap justify-center gap-3">
                 {Object.values(HEROES).map(hero => (
                   <div 
                     key={hero.id} onClick={() => setSelectedHero(hero.id)} title={hero.name}
                     className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all transform hover:scale-110 ${selectedHero === hero.id ? `bg-gradient-to-br ${hero.gradient} text-white shadow-lg scale-110 ring-4 ring-slate-100` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                   >
                     {hero.icon}
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD: NEW PASSWORD STEP */}
          {view === 'forgot' && isOtpVerified && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <label className="block text-sm font-bold text-slate-700 mb-2">Enter New Password</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 py-3 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium" 
                placeholder="New Password" 
              />
            </div>
          )}

          {/* DYNAMIC BUTTON TEXT */}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl transition-all font-black text-lg shadow-xl shadow-blue-600/20 mt-6 transform hover:-translate-y-1">
            {view === 'login' ? 'Sign In' 
             : (!otpSent ? (view === 'forgot' ? 'Send Reset Link' : 'Verify Email') 
             : (!isOtpVerified ? 'Confirm OTP' 
             : (view === 'forgot' ? 'Save New Password' : 'Complete Registration')))}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-sm font-medium text-slate-600">
            {view === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => resetFlow(view === 'login' ? 'register' : 'login')} type="button" className="text-blue-600 hover:text-blue-700 font-bold transition-colors ml-1">
              {view === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${isActive ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
    >
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}

function MobileNavItem({ icon, label, isActive, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
    >
      {React.cloneElement(icon, { className: 'w-6 h-6' })}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
