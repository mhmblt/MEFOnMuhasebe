/**
 * Dashboard Page - Financial Overview
 * 
 * Senior Developer Note:
 * Seçili profilin finansal durumunu özetleyen ana dashboard sayfası.
 * Glass card'lar, işlem listesi ve işlem ekleme modal'ı içerir.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    X,
    Calendar,
    Tag,
    DollarSign,
    FileText,
    Trash2,
    Repeat,
} from 'lucide-react';
import {
    useStore,
    formatCurrency,
    CATEGORY_CONFIG,
    type TransactionType,
    type TransactionCategory,
} from '@/stores/useStore';

// Form validation schema
const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive('Tutar pozitif olmalı'),
    category: z.string().min(1, 'Kategori seçiniz'),
    title: z.string().min(1, 'Başlık gerekli').max(50, 'Başlık çok uzun'),
    description: z.string().optional(),
    date: z.string().min(1, 'Tarih gerekli'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

/**
 * Dashboard Ana Sayfası
 */
export default function DashboardPage() {
    const { activeProfileId, getActiveProfile, getSummary, getProfileTransactions, addTransaction, deleteTransaction } = useStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !activeProfileId) return null;

    const profile = getActiveProfile();
    if (!profile) return null;

    const summary = getSummary(activeProfileId);
    const transactions = getProfileTransactions(activeProfileId);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
    };

    return (
        <div className="max-w-6xl mx-auto">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-6 md:mb-8">
                    <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">
                        Hoş Geldin, {profile.name} 👋
                    </h1>
                    <p className="text-sm md:text-base text-neutral-400">
                        İşte finansal durumunun özeti
                    </p>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    {/* Total Balance */}
                    <motion.div variants={itemVariants}>
                        <div className="glass-card p-4 md:p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-2xl" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3 md:mb-4">
                                    <span className="text-neutral-400 text-xs md:text-sm">Toplam Bakiye</span>
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                        <Wallet className="w-4 h-4 md:w-5 md:h-5 text-violet-400" />
                                    </div>
                                </div>
                                <p className={`text-2xl md:text-3xl font-bold ${summary.totalBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                    {formatCurrency(summary.totalBalance, profile.currency)}
                                </p>
                                <p className="text-neutral-500 text-xs md:text-sm mt-2">
                                    {summary.transactionCount} işlem
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Total Income */}
                    <motion.div variants={itemVariants}>
                        <div className="glass-card p-4 md:p-6 gradient-card-income relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-transparent rounded-full blur-2xl" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3 md:mb-4">
                                    <span className="text-neutral-400 text-xs md:text-sm">Toplam Gelir</span>
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                        <ArrowDownLeft className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                                    </div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-cyan-400">
                                    {formatCurrency(summary.totalIncome, profile.currency)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
                                    <span className="text-cyan-400 text-xs md:text-sm">Gelen</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Total Expense */}
                    <motion.div variants={itemVariants}>
                        <div className="glass-card p-4 md:p-6 gradient-card-expense relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full blur-2xl" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3 md:mb-4">
                                    <span className="text-neutral-400 text-xs md:text-sm">Toplam Gider</span>
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                                        <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                                    </div>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-pink-400">
                                    {formatCurrency(summary.totalExpense, profile.currency)}
                                </p>
                                <div className="flex items-center gap-1 mt-2">
                                    <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-pink-400" />
                                    <span className="text-pink-400 text-xs md:text-sm">Giden</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Daily Income/Expense Chart */}
                <motion.div variants={itemVariants}>
                    <div className="glass-card p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
                            <h2 className="text-base md:text-xl font-semibold text-white">Günlük Gelir & Gider</h2>
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400" />
                                    <span className="text-xs md:text-sm text-neutral-400">Gelir</span>
                                </div>
                                <div className="flex items-center gap-1.5 md:gap-2">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-400" />
                                    <span className="text-xs md:text-sm text-neutral-400">Gider</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-48 md:h-64">
                            <DailyChart transactions={transactions} />
                        </div>
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div variants={itemVariants}>
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-base md:text-xl font-semibold text-white">Son İşlemler</h2>
                            {transactions.length > 0 && (
                                <span className="text-xs md:text-sm text-neutral-500">
                                    {transactions.length} işlem
                                </span>
                            )}
                        </div>

                        <div className="max-h-[350px] md:max-h-[400px] overflow-y-auto">
                            {transactions.length === 0 ? (
                                <div className="p-8 md:p-12 text-center">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-6 h-6 md:w-8 md:h-8 text-neutral-600" />
                                    </div>
                                    <p className="text-neutral-400 text-sm md:text-base mb-2">Henüz işlem yok</p>
                                    <p className="text-neutral-600 text-xs md:text-sm">
                                        İlk işlemini eklemek için + butonuna tıkla
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {transactions.slice(0, 10).map((transaction, index) => {
                                        const config = CATEGORY_CONFIG[transaction.category];
                                        const isIncome = transaction.type === 'income';

                                        return (
                                            <motion.div
                                                key={transaction.id}
                                                className="p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:bg-white/5 transition-colors group"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                {/* Category Icon */}
                                                <div
                                                    className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl flex-shrink-0"
                                                    style={{ backgroundColor: `${config.color}20` }}
                                                >
                                                    {config.emoji}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-white text-sm md:text-base truncate">
                                                        {transaction.title}
                                                    </p>
                                                    <p className="text-xs md:text-sm text-neutral-500 truncate">
                                                        {config.label} • {new Date(transaction.date).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>

                                                {/* Amount */}
                                                <div className="text-right flex-shrink-0">
                                                    <p className={`font-semibold text-sm md:text-base ${isIncome ? 'text-cyan-400' : 'text-pink-400'}`}>
                                                        {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, profile.currency)}
                                                    </p>
                                                </div>

                                                {/* Delete Button - always visible on mobile */}
                                                <button
                                                    className="md:opacity-0 md:group-hover:opacity-100 w-8 h-8 rounded-lg
                                     flex items-center justify-center text-neutral-500
                                     hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
                                                    onClick={() => deleteTransaction(transaction.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Floating Action Button */}
            <motion.button
                className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl
                   bg-gradient-to-br from-cyan-500 to-pink-500
                   text-white flex items-center justify-center
                   shadow-lg shadow-cyan-500/30
                   z-50"
                onClick={() => setModalOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
            >
                <Plus className="w-6 h-6" />
            </motion.button>

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <AddTransactionModal
                        profileId={activeProfileId}
                        currency={profile.currency}
                        onClose={() => setModalOpen(false)}
                        onAdd={(type, amount, category, title, description, date, isRecurring, recurringDay) => {
                            addTransaction(activeProfileId, type, amount, category as TransactionCategory, title, description, date, isRecurring, recurringDay);
                            setModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Add Transaction Modal Component - Redesigned
 * Modern, centered modal with improved aesthetics
 */
function AddTransactionModal({
    profileId,
    currency,
    onClose,
    onAdd,
}: {
    profileId: string;
    currency: 'TRY' | 'USD' | 'EUR';
    onClose: () => void;
    onAdd: (
        type: TransactionType,
        amount: number,
        category: string,
        title: string,
        description?: string,
        date?: string,
        isRecurring?: boolean,
        recurringDay?: number
    ) => void;
}) {
    const [transactionType, setTransactionType] = useState<TransactionType>('expense');
    const [isRecurring, setIsRecurring] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
        },
        mode: 'onChange',
    });

    const selectedCategory = watch('category');

    const incomeCategories = ['salary', 'freelance', 'investment', 'gift', 'other'];
    const expenseCategories = ['food', 'transport', 'shopping', 'utilities', 'entertainment', 'health', 'education', 'other'];
    const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

    const onSubmit = (data: TransactionFormData) => {
        const selectedDate = new Date(data.date);
        const dayOfMonth = selectedDate.getDate();

        onAdd(
            transactionType,
            data.amount,
            data.category,
            data.title,
            data.description,
            data.date,
            isRecurring,
            isRecurring ? dayOfMonth : undefined
        );
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />

            {/* Modal Container - Proper Centering */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Card */}
                    <div className="relative bg-gradient-to-b from-neutral-900/95 to-neutral-950/95 
                                    backdrop-blur-xl rounded-3xl border border-white/10
                                    shadow-2xl shadow-black/50 overflow-hidden">

                        {/* Decorative Gradient Top Line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${transactionType === 'income'
                            ? 'from-cyan-500 via-cyan-400 to-teal-500'
                            : 'from-pink-500 via-rose-500 to-orange-500'
                            }`} />

                        {/* Header */}
                        <div className="p-6 pb-4">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transactionType === 'income'
                                        ? 'bg-cyan-500/20'
                                        : 'bg-pink-500/20'
                                        }`}>
                                        {transactionType === 'income'
                                            ? <ArrowDownLeft className="w-5 h-5 text-cyan-400" />
                                            : <ArrowUpRight className="w-5 h-5 text-pink-400" />
                                        }
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Yeni İşlem</h2>
                                        <p className="text-sm text-neutral-500">
                                            {transactionType === 'income' ? 'Gelir ekle' : 'Gider ekle'}
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    className="w-10 h-10 rounded-xl flex items-center justify-center
                                               bg-white/5 text-neutral-400 
                                               hover:bg-white/10 hover:text-white
                                               transition-colors"
                                    onClick={onClose}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Type Toggle - Improved */}
                            <div className="flex gap-3 p-1.5 bg-white/5 rounded-2xl">
                                <motion.button
                                    type="button"
                                    className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${transactionType === 'income'
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                                        : 'text-neutral-400 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        setTransactionType('income');
                                        setValue('type', 'income');
                                        setValue('category', '');
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ArrowDownLeft className="w-4 h-4" />
                                    Gelir
                                </motion.button>
                                <motion.button
                                    type="button"
                                    className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${transactionType === 'expense'
                                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                                        : 'text-neutral-400 hover:text-white'
                                        }`}
                                    onClick={() => {
                                        setTransactionType('expense');
                                        setValue('type', 'expense');
                                        setValue('category', '');
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    Gider
                                </motion.button>
                            </div>
                        </div>

                        {/* Scrollable Form Area */}
                        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {/* Amount - Hero Style */}
                                <div className="text-center py-4">
                                    <label className="block text-sm font-medium text-neutral-500 mb-3">
                                        Tutar
                                    </label>
                                    <div className="relative inline-flex items-center justify-center">
                                        <span className={`text-3xl font-bold mr-2 ${transactionType === 'income' ? 'text-cyan-400' : 'text-pink-400'
                                            }`}>
                                            {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€'}
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-40 bg-transparent border-none text-center
                                                       text-4xl font-bold text-white
                                                       placeholder:text-neutral-600
                                                       focus:outline-none"
                                            {...register('amount', { valueAsNumber: true })}
                                        />
                                    </div>
                                    {errors.amount && (
                                        <p className="text-rose-400 text-sm mt-2">{errors.amount.message}</p>
                                    )}
                                </div>

                                {/* Category Grid */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-3">
                                        <Tag className="w-4 h-4" />
                                        Kategori
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {categories.map((cat) => {
                                            const config = CATEGORY_CONFIG[cat as TransactionCategory];
                                            const isSelected = selectedCategory === cat;

                                            return (
                                                <motion.button
                                                    key={cat}
                                                    type="button"
                                                    className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all border ${isSelected
                                                        ? transactionType === 'income'
                                                            ? 'bg-cyan-500/20 border-cyan-500/50 ring-1 ring-cyan-500/30'
                                                            : 'bg-pink-500/20 border-pink-500/50 ring-1 ring-pink-500/30'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                        }`}
                                                    onClick={() => setValue('category', cat)}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <span className="text-2xl">{config.emoji}</span>
                                                    <span className={`text-xs ${isSelected ? 'text-white' : 'text-neutral-500'}`}>
                                                        {config.label}
                                                    </span>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    {errors.category && (
                                        <p className="text-rose-400 text-sm mt-2">{errors.category.message}</p>
                                    )}
                                </div>

                                {/* Title Input */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-2">
                                        <FileText className="w-4 h-4" />
                                        Başlık
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Market alışverişi"
                                        className="w-full px-4 py-3.5 rounded-xl
                                                   bg-white/5 border border-white/10
                                                   text-white placeholder:text-neutral-600
                                                   focus:outline-none focus:border-white/20 focus:bg-white/10
                                                   transition-all"
                                        {...register('title')}
                                    />
                                    {errors.title && (
                                        <p className="text-rose-400 text-sm mt-1">{errors.title.message}</p>
                                    )}
                                </div>

                                {/* Date Input - Modern */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        Tarih
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3.5 rounded-xl
                                                   bg-white/5 border border-white/10
                                                   text-white
                                                   focus:outline-none focus:border-white/20 focus:bg-white/10
                                                   transition-all
                                                   [color-scheme:dark]"
                                    />
                                </div>

                                {/* Recurring Toggle */}
                                <motion.div
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isRecurring
                                        ? transactionType === 'income'
                                            ? 'bg-cyan-500/10 border-cyan-500/30'
                                            : 'bg-pink-500/10 border-pink-500/30'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                    onClick={() => setIsRecurring(!isRecurring)}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isRecurring
                                            ? transactionType === 'income'
                                                ? 'bg-cyan-500/20'
                                                : 'bg-pink-500/20'
                                            : 'bg-white/10'
                                            }`}>
                                            <Repeat className={`w-5 h-5 ${isRecurring
                                                ? transactionType === 'income'
                                                    ? 'text-cyan-400'
                                                    : 'text-pink-400'
                                                : 'text-neutral-500'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isRecurring ? 'text-white' : 'text-neutral-400'}`}>
                                                Düzenli İşlem
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                Her ay otomatik tekrarlanır
                                            </p>
                                        </div>
                                    </div>

                                    {/* Toggle Switch */}
                                    <div className={`relative w-12 h-7 rounded-full transition-all ${isRecurring
                                        ? transactionType === 'income'
                                            ? 'bg-cyan-500'
                                            : 'bg-pink-500'
                                        : 'bg-white/20'
                                        }`}>
                                        <motion.div
                                            className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                                            animate={{ left: isRecurring ? '26px' : '4px' }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Recurring Info */}
                                <AnimatePresence>
                                    {isRecurring && (
                                        <motion.div
                                            className={`p-3 rounded-xl text-sm ${transactionType === 'income'
                                                ? 'bg-cyan-500/10 text-cyan-300'
                                                : 'bg-pink-500/10 text-pink-300'
                                                }`}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <p className="flex items-center gap-2">
                                                <Repeat className="w-4 h-4" />
                                                Bu işlem her ayın aynı gününde otomatik olarak eklenecek
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Description */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-400 mb-2">
                                        Not (Opsiyonel)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ek detaylar..."
                                        className="w-full px-4 py-3 rounded-xl
                                                   bg-white/5 border border-white/10
                                                   text-white placeholder:text-neutral-600
                                                   focus:outline-none focus:border-white/20 focus:bg-white/10
                                                   transition-all resize-none"
                                        {...register('description')}
                                    />
                                </div>

                                {/* Submit Button */}
                                <motion.button
                                    type="submit"
                                    className={`w-full py-4 rounded-xl font-semibold text-lg
                                               flex items-center justify-center gap-2
                                               transition-all ${transactionType === 'income'
                                            ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30'
                                            : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                                        }`}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Plus className="w-5 h-5" />
                                    {transactionType === 'income' ? 'Gelir Ekle' : 'Gider Ekle'}
                                </motion.button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
}

/**
 * Daily Chart Component
 * Shows income and expense trends by day
 */
function DailyChart({ transactions }: {
    transactions: Array<{
        id: string;
        type: 'income' | 'expense';
        amount: number;
        date: string;
    }>
}) {
    const chartData = useMemo(() => {
        // Get last 14 days
        const days: { [key: string]: { income: number; expense: number } } = {};
        const today = new Date();

        for (let i = 13; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            days[dateStr] = { income: 0, expense: 0 };
        }

        // Sum transactions by day
        transactions.forEach((t) => {
            if (days[t.date]) {
                if (t.type === 'income') {
                    days[t.date].income += t.amount;
                } else {
                    days[t.date].expense += t.amount;
                }
            }
        });

        // Convert to array for chart
        return Object.entries(days).map(([date, data]) => {
            const d = new Date(date);
            return {
                name: `${d.getDate()}/${d.getMonth() + 1}`,
                Gelir: data.income,
                Gider: data.expense,
            };
        });
    }, [transactions]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
                    <p className="text-neutral-400 text-sm mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: ₺{entry.value.toLocaleString('tr-TR')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="name"
                    stroke="#737373"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#737373"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                    type="monotone"
                    dataKey="Gelir"
                    stroke="#4ade80"
                    strokeWidth={2.5}
                    dot={{ fill: '#4ade80', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#4ade80', stroke: '#1a1a1a', strokeWidth: 2 }}
                />
                <Line
                    type="monotone"
                    dataKey="Gider"
                    stroke="#f87171"
                    strokeWidth={2.5}
                    dot={{ fill: '#f87171', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#f87171', stroke: '#1a1a1a', strokeWidth: 2 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
