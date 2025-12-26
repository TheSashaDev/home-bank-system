import { create } from 'zustand';
import type { User, Transaction } from '../types';
import { api } from '../api/client';

export type Screen =
  | 'scan'
  | 'pin'
  | 'main'
  | 'balance'
  | 'transfer'
  | 'history'
  | 'admin'
  | 'admin-deposit'
  | 'admin-create'
  | 'admin-users'
  | 'admin-transactions'
  | 'admin-credits'
  | 'admin-debts'
  | 'admin-withdrawals'
  | 'credits'
  | 'savings'
  | 'debts'
  | 'withdraw';

interface ScannedCard {
  id: string;
  name: string;
  cardNumber: string;
  balance: number;
  qrData: string;
}

interface AppState {
  // UI state
  currentScreen: Screen;
  loading: boolean;
  error: string | null;

  // Auth state
  user: User | null;
  pendingQrData: string | null;

  // Scanner state
  scannedCard: ScannedCard | null;

  // Cached data
  balance: number | null;
  transactions: Transaction[];
  users: { id: string; name: string; cardNumber: string }[];

  // Actions
  setScreen: (screen: Screen) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Auth actions
  setUser: (user: User | null) => void;
  setPendingQrData: (qrData: string | null) => void;
  logout: () => void;

  // Scanner actions
  setScannedCard: (card: ScannedCard) => void;
  clearScannedCard: () => void;

  // Data actions
  setBalance: (balance: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setUsers: (users: { id: string; name: string; cardNumber: string }[]) => void;

  // Async actions
  fetchBalance: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchUsers: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentScreen: 'scan',
  loading: false,
  error: null,
  user: null,
  pendingQrData: null,
  scannedCard: null,
  balance: null,
  transactions: [],
  users: [],

  // UI actions
  setScreen: (screen) => set({ currentScreen: screen, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Auth actions
  setUser: (user) => set({ user }),
  setPendingQrData: (qrData) => set({ pendingQrData: qrData }),

  // Scanner actions
  setScannedCard: (card) => set({ scannedCard: card }),
  clearScannedCard: () => set({ scannedCard: null }),
  
  logout: () => {
    api.logout();
    set({
      user: null,
      pendingQrData: null,
      scannedCard: null,
      balance: null,
      transactions: [],
      users: [],
      currentScreen: 'scan',
      error: null,
    });
  },

  // Data actions
  setBalance: (balance) => set({ balance }),
  setTransactions: (transactions) => set({ transactions }),
  setUsers: (users) => set({ users }),

  // Async actions
  fetchBalance: async () => {
    set({ loading: true, error: null });
    const res = await api.getBalance();
    if (res.success && res.data) {
      set({ balance: res.data.balance, loading: false });
    } else {
      set({ error: res.error || 'Failed to fetch balance', loading: false });
    }
  },

  fetchHistory: async () => {
    set({ loading: true, error: null });
    const res = await api.getHistory();
    if (res.success && res.data) {
      set({ transactions: res.data, loading: false });
    } else {
      set({ error: res.error || 'Failed to fetch history', loading: false });
    }
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    const res = await api.getUsers();
    if (res.success && res.data) {
      set({ users: res.data, loading: false });
    } else {
      set({ error: res.error || 'Failed to fetch users', loading: false });
    }
  },
}));
