/**
 * NovaFlow Store - Zustand with Persist Middleware
 * 
 * Senior Developer Note:
 * Bu store, tüm uygulama state'ini yönetir ve localStorage'a persist eder.
 * Page refresh sonrası bile veriler korunur.
 * 
 * Core Entities:
 * - Profiles: Netflix tarzı kullanıcı profilleri
 * - Transactions: Gelir/Gider işlemleri
 * - ActiveProfile: Seçili kullanıcı
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type Currency = 'TRY' | 'USD' | 'EUR';
export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
    | 'salary'
    | 'freelance'
    | 'investment'
    | 'gift'
    | 'food'
    | 'transport'
    | 'shopping'
    | 'utilities'
    | 'entertainment'
    | 'health'
    | 'education'
    | 'other';

export interface Profile {
    id: string;
    name: string;
    avatarColor: string;
    currency: Currency;
    createdAt: string;
}

export interface Transaction {
    id: string;
    profileId: string;
    type: TransactionType;
    amount: number;
    category: TransactionCategory;
    title: string;
    description?: string;
    date: string;
    createdAt: string;
    isRecurring?: boolean;
    recurringDay?: number; // Day of month (1-31)
}

export interface FinancialSummary {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
}

// ============================================
// STORE INTERFACE
// ============================================

interface NovaFlowStore {
    // State
    profiles: Profile[];
    transactions: Transaction[];
    activeProfileId: string | null;

    // Profile Actions
    addProfile: (name: string, avatarColor: string, currency: Currency) => void;
    updateProfile: (id: string, data: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void;
    deleteProfile: (id: string) => void;
    selectProfile: (id: string | null) => void;
    getActiveProfile: () => Profile | null;

    // Transaction Actions
    addTransaction: (
        profileId: string,
        type: TransactionType,
        amount: number,
        category: TransactionCategory,
        title: string,
        description?: string,
        date?: string,
        isRecurring?: boolean,
        recurringDay?: number
    ) => void;
    updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'profileId' | 'createdAt'>>) => void;
    deleteTransaction: (id: string) => void;
    getProfileTransactions: (profileId: string) => Transaction[];

    // Monthly Cleanup
    lastCleanupMonth: string | null; // Format: "YYYY-MM"
    cleanupNonRecurringTransactions: () => void;
    checkAndPerformMonthlyCleanup: () => void;

    // Summary
    getSummary: (profileId: string) => FinancialSummary;
}

// ============================================
// AVATAR COLORS - Neon palette
// ============================================

export const AVATAR_COLORS = [
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#f97316', // Orange
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

const generateId = () => crypto.randomUUID();

const getCurrentDate = () => new Date().toISOString();

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useStore = create<NovaFlowStore>()(
    persist(
        (set, get) => ({
            // Initial State
            profiles: [],
            transactions: [],
            activeProfileId: null,
            lastCleanupMonth: null,

            // ===================
            // PROFILE ACTIONS
            // ===================

            addProfile: (name, avatarColor, currency) => {
                const newProfile: Profile = {
                    id: generateId(),
                    name,
                    avatarColor,
                    currency,
                    createdAt: getCurrentDate(),
                };

                set((state) => ({
                    profiles: [...state.profiles, newProfile],
                }));
            },

            updateProfile: (id, data) => {
                set((state) => ({
                    profiles: state.profiles.map((profile) =>
                        profile.id === id ? { ...profile, ...data } : profile
                    ),
                }));
            },

            deleteProfile: (id) => {
                set((state) => ({
                    profiles: state.profiles.filter((p) => p.id !== id),
                    transactions: state.transactions.filter((t) => t.profileId !== id),
                    activeProfileId: state.activeProfileId === id ? null : state.activeProfileId,
                }));
            },

            selectProfile: (id) => {
                set({ activeProfileId: id });
            },

            getActiveProfile: () => {
                const { profiles, activeProfileId } = get();
                return profiles.find((p) => p.id === activeProfileId) || null;
            },

            // ===================
            // TRANSACTION ACTIONS
            // ===================

            addTransaction: (profileId, type, amount, category, title, description, date, isRecurring, recurringDay) => {
                const newTransaction: Transaction = {
                    id: generateId(),
                    profileId,
                    type,
                    amount,
                    category,
                    title,
                    description,
                    date: date || getCurrentDate().split('T')[0],
                    createdAt: getCurrentDate(),
                    isRecurring: isRecurring || false,
                    recurringDay: isRecurring ? recurringDay : undefined,
                };

                set((state) => ({
                    transactions: [newTransaction, ...state.transactions],
                }));
            },

            updateTransaction: (id, data) => {
                set((state) => ({
                    transactions: state.transactions.map((t) =>
                        t.id === id ? { ...t, ...data } : t
                    ),
                }));
            },

            deleteTransaction: (id) => {
                set((state) => ({
                    transactions: state.transactions.filter((t) => t.id !== id),
                }));
            },

            getProfileTransactions: (profileId) => {
                const { transactions } = get();
                return transactions
                    .filter((t) => t.profileId === profileId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            },

            // ===================
            // SUMMARY
            // ===================

            getSummary: (profileId) => {
                const transactions = get().getProfileTransactions(profileId);

                const totalIncome = transactions
                    .filter((t) => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                const totalExpense = transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    totalBalance: totalIncome - totalExpense,
                    totalIncome,
                    totalExpense,
                    transactionCount: transactions.length,
                };
            },

            // ===================
            // MONTHLY CLEANUP
            // ===================

            cleanupNonRecurringTransactions: () => {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                set((state) => ({
                    transactions: state.transactions.filter((t) => {
                        // Keep all recurring transactions
                        if (t.isRecurring) return true;

                        // Keep transactions from the current month
                        const transactionDate = new Date(t.date);
                        const isCurrentMonth =
                            transactionDate.getMonth() === currentMonth &&
                            transactionDate.getFullYear() === currentYear;

                        return isCurrentMonth;
                    }),
                }));
            },

            checkAndPerformMonthlyCleanup: () => {
                const now = new Date();
                const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                const lastCleanup = get().lastCleanupMonth;

                // If we haven't cleaned up this month yet
                if (lastCleanup !== currentMonthKey) {
                    // Perform cleanup
                    get().cleanupNonRecurringTransactions();

                    // Update the last cleanup month
                    set({ lastCleanupMonth: currentMonthKey });

                    console.log(`[MEF Ön Muhasebe] Aylık temizlik yapıldı: ${currentMonthKey}`);
                }
            },
        }),
        {
            name: 'novaflow-storage', // localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ============================================
// CATEGORY CONFIG - Icons & Colors
// ============================================

export const CATEGORY_CONFIG: Record<
    TransactionCategory,
    { label: string; emoji: string; color: string }
> = {
    salary: { label: 'Maaş', emoji: '💼', color: '#10b981' },
    freelance: { label: 'Serbest', emoji: '💻', color: '#06b6d4' },
    investment: { label: 'Yatırım', emoji: '📈', color: '#8b5cf6' },
    gift: { label: 'Hediye', emoji: '🎁', color: '#f59e0b' },
    food: { label: 'Yemek', emoji: '🍔', color: '#ef4444' },
    transport: { label: 'Ulaşım', emoji: '🚗', color: '#3b82f6' },
    shopping: { label: 'Alışveriş', emoji: '🛍️', color: '#ec4899' },
    utilities: { label: 'Faturalar', emoji: '💡', color: '#f97316' },
    entertainment: { label: 'Eğlence', emoji: '🎮', color: '#a855f7' },
    health: { label: 'Sağlık', emoji: '🏥', color: '#14b8a6' },
    education: { label: 'Eğitim', emoji: '📚', color: '#6366f1' },
    other: { label: 'Diğer', emoji: '📦', color: '#64748b' },
};

// ============================================
// CURRENCY FORMATTERS
// ============================================

export const formatCurrency = (amount: number, currency: Currency = 'TRY'): string => {
    const config: Record<Currency, { locale: string; currency: string }> = {
        TRY: { locale: 'tr-TR', currency: 'TRY' },
        USD: { locale: 'en-US', currency: 'USD' },
        EUR: { locale: 'de-DE', currency: 'EUR' },
    };

    const { locale, currency: curr } = config[currency];

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: curr,
        minimumFractionDigits: 2,
    }).format(amount);
};
