/**
 * Transaction Store - Zustand State Management
 * 
 * Senior Developer Note:
 * Zustand, Redux'a göre çok daha az boilerplate gerektiren modern bir
 * state management çözümüdür. Bu store, transaction CRUD operasyonlarını
 * ve filtreleme/sıralama state'ini yönetir.
 * 
 * Persist middleware ile localStorage senkronizasyonu yapılabilir.
 */

import { create } from 'zustand';
import type { Transaction, TransactionCategory, TransactionType } from '@/components/transactions/transaction-list';

interface TransactionFilters {
    search: string;
    type: TransactionType | 'all';
    category: TransactionCategory | 'all';
    dateRange: {
        start: string | null;
        end: string | null;
    };
}

interface TransactionStore {
    // State
    transactions: Transaction[];
    filters: TransactionFilters;
    isLoading: boolean;

    // Actions
    setTransactions: (transactions: Transaction[]) => void;
    addTransaction: (transaction: Transaction) => void;
    updateTransaction: (id: string, data: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;

    // Filters
    setSearchQuery: (query: string) => void;
    setTypeFilter: (type: TransactionType | 'all') => void;
    setCategoryFilter: (category: TransactionCategory | 'all') => void;
    setDateRange: (start: string | null, end: string | null) => void;
    resetFilters: () => void;

    // Computed
    getFilteredTransactions: () => Transaction[];
    getTotalBalance: () => number;
    getTotalIncome: () => number;
    getTotalExpense: () => number;
}

const defaultFilters: TransactionFilters = {
    search: '',
    type: 'all',
    category: 'all',
    dateRange: {
        start: null,
        end: null,
    },
};

/**
 * Transaction Store instance.
 */
export const useTransactionStore = create<TransactionStore>((set, get) => ({
    // Initial State
    transactions: [],
    filters: defaultFilters,
    isLoading: false,

    // CRUD Actions
    setTransactions: (transactions) => set({ transactions }),

    addTransaction: (transaction) =>
        set((state) => ({
            transactions: [transaction, ...state.transactions],
        })),

    updateTransaction: (id, data) =>
        set((state) => ({
            transactions: state.transactions.map((t) =>
                t.id === id ? { ...t, ...data } : t
            ),
        })),

    deleteTransaction: (id) =>
        set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
        })),

    // Filter Actions
    setSearchQuery: (query) =>
        set((state) => ({
            filters: { ...state.filters, search: query },
        })),

    setTypeFilter: (type) =>
        set((state) => ({
            filters: { ...state.filters, type },
        })),

    setCategoryFilter: (category) =>
        set((state) => ({
            filters: { ...state.filters, category },
        })),

    setDateRange: (start, end) =>
        set((state) => ({
            filters: {
                ...state.filters,
                dateRange: { start, end },
            },
        })),

    resetFilters: () => set({ filters: defaultFilters }),

    // Computed Values - Filtered Transactions
    getFilteredTransactions: () => {
        const { transactions, filters } = get();

        return transactions.filter((t) => {
            // Search filter
            if (
                filters.search &&
                !t.title.toLowerCase().includes(filters.search.toLowerCase()) &&
                !t.description?.toLowerCase().includes(filters.search.toLowerCase())
            ) {
                return false;
            }

            // Type filter
            if (filters.type !== 'all' && t.type !== filters.type) {
                return false;
            }

            // Category filter
            if (filters.category !== 'all' && t.category !== filters.category) {
                return false;
            }

            // Date range filter
            if (filters.dateRange.start) {
                const transactionDate = new Date(t.date);
                const startDate = new Date(filters.dateRange.start);
                if (transactionDate < startDate) return false;
            }

            if (filters.dateRange.end) {
                const transactionDate = new Date(t.date);
                const endDate = new Date(filters.dateRange.end);
                if (transactionDate > endDate) return false;
            }

            return true;
        });
    },

    // Financial Summaries
    getTotalBalance: () => {
        const { transactions } = get();
        return transactions.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
    },

    getTotalIncome: () => {
        const { transactions } = get();
        return transactions
            .filter((t) => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
    },

    getTotalExpense: () => {
        const { transactions } = get();
        return transactions
            .filter((t) => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
    },
}));

/**
 * UI State Store - Modal, sidebar, theme vb.
 */
interface UIStore {
    isSidebarCollapsed: boolean;
    isAIChatOpen: boolean;
    isFABMenuOpen: boolean;
    activeModal: string | null;

    toggleSidebar: () => void;
    toggleAIChat: () => void;
    toggleFABMenu: () => void;
    openModal: (modalId: string) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isSidebarCollapsed: false,
    isAIChatOpen: false,
    isFABMenuOpen: false,
    activeModal: null,

    toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    toggleAIChat: () =>
        set((state) => ({ isAIChatOpen: !state.isAIChatOpen })),

    toggleFABMenu: () =>
        set((state) => ({ isFABMenuOpen: !state.isFABMenuOpen })),

    openModal: (modalId) => set({ activeModal: modalId }),
    closeModal: () => set({ activeModal: null }),
}));
