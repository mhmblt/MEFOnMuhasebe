/**
 * Calendar Page - Payment Calendar & Upcoming Payments
 * 
 * Senior Developer Note:
 * Ödeme takvimi sayfası. Aylık takvim görünümü ve yaklaşan ödemeler listesi içerir.
 * Tekrarlayan işlemlerin takibi için kullanılır.
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import { useStore, formatCurrency, CATEGORY_CONFIG, type TransactionCategory, type Transaction } from '@/stores/useStore';
import CalendarView from '@/components/calendar/CalendarView';
import UpcomingPayments from '@/components/calendar/UpcomingPayments';

export default function CalendarPage() {
    const { activeProfileId, getActiveProfile, getProfileTransactions } = useStore();
    const [selectedDay, setSelectedDay] = useState<{ date: Date; transactions: Transaction[] } | null>(null);

    const profile = getActiveProfile();
    const transactions = getProfileTransactions(activeProfileId || '');

    // Handle day click
    const handleDayClick = (date: Date, dayTransactions: Transaction[]) => {
        setSelectedDay({ date, transactions: dayTransactions });
    };

    // Close modal
    const handleCloseModal = () => {
        setSelectedDay(null);
    };

    // Format date for modal
    const formatModalDate = (date: Date): string => {
        return date.toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

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
        visible: { opacity: 1, y: 0 },
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-neutral-500">Profil bulunamadı</p>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
        >
            {/* Page Header */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Ödeme Takvimi</h1>
                    <p className="text-neutral-500">Gelir ve giderlerinizi takvimde takip edin</p>
                </div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar - Takes 2 columns on large screens */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <CalendarView
                        transactions={transactions}
                        currency={profile.currency}
                        onDayClick={handleDayClick}
                    />
                </motion.div>

                {/* Upcoming Payments Sidebar */}
                <motion.div variants={itemVariants}>
                    <UpcomingPayments
                        transactions={transactions}
                        currency={profile.currency}
                    />
                </motion.div>
            </div>

            {/* Day Detail Modal */}
            <AnimatePresence>
                {selectedDay && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                className="w-full max-w-md"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-gradient-to-b from-neutral-900/95 to-neutral-950/95 
                                                backdrop-blur-xl rounded-3xl border border-white/10
                                                shadow-2xl shadow-black/50 overflow-hidden">

                                    {/* Header */}
                                    <div className="p-6 border-b border-white/10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {formatModalDate(selectedDay.date)}
                                                </h3>
                                                <p className="text-sm text-neutral-500 mt-1">
                                                    {selectedDay.transactions.length} işlem
                                                </p>
                                            </div>
                                            <motion.button
                                                className="w-10 h-10 rounded-xl flex items-center justify-center
                                                           bg-white/5 text-neutral-400 
                                                           hover:bg-white/10 hover:text-white
                                                           transition-colors"
                                                onClick={handleCloseModal}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <X className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        <div className="divide-y divide-white/5">
                                            {selectedDay.transactions.map((transaction) => {
                                                const config = CATEGORY_CONFIG[transaction.category as TransactionCategory];
                                                const isIncome = transaction.type === 'income';

                                                return (
                                                    <div
                                                        key={transaction.id}
                                                        className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
                                                    >
                                                        {/* Icon */}
                                                        <div
                                                            className={`w-12 h-12 rounded-xl flex items-center justify-center
                                                                       ${isIncome ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}
                                                        >
                                                            {isIncome ? (
                                                                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                                                            ) : (
                                                                <ArrowUpRight className="w-5 h-5 text-rose-400" />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-white truncate">
                                                                    {transaction.title}
                                                                </p>
                                                                {transaction.isRecurring && (
                                                                    <Repeat className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-neutral-500">
                                                                {config?.emoji} {config?.label || transaction.category}
                                                            </p>
                                                        </div>

                                                        {/* Amount */}
                                                        <p className={`font-semibold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, profile.currency)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="p-4 border-t border-white/10 bg-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-neutral-400">Günlük Net</span>
                                            <span
                                                className={`font-bold text-lg ${selectedDay.transactions.reduce(
                                                    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                                                    0
                                                ) >= 0
                                                        ? 'text-emerald-400'
                                                        : 'text-rose-400'
                                                    }`}
                                            >
                                                {formatCurrency(
                                                    selectedDay.transactions.reduce(
                                                        (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
                                                        0
                                                    ),
                                                    profile.currency
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
