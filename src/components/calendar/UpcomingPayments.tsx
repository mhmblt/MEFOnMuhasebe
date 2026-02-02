/**
 * UpcomingPayments Component - Upcoming Payments List
 * 
 * Senior Developer Note:
 * Önümüzdeki 30 gündeki tekrarlayan ödemeleri/gelirleri listeler.
 * Her öğede "X gün kaldı" sayacı gösterilir.
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Repeat, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { type Transaction, type Currency, formatCurrency, CATEGORY_CONFIG, type TransactionCategory } from '@/stores/useStore';

interface UpcomingPaymentsProps {
    transactions: Transaction[];
    currency: Currency;
}

interface UpcomingItem {
    transaction: Transaction;
    dueDate: Date;
    daysLeft: number;
}

export default function UpcomingPayments({ transactions, currency }: UpcomingPaymentsProps) {
    // Calculate upcoming payments
    const upcomingItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const items: UpcomingItem[] = [];

        // Get recurring transactions
        const recurringTransactions = transactions.filter((t) => t.isRecurring && t.recurringDay);

        recurringTransactions.forEach((t) => {
            const recurringDay = t.recurringDay!;

            // Calculate next occurrence
            let dueDate = new Date(today.getFullYear(), today.getMonth(), recurringDay);

            // If the day has passed this month, move to next month
            if (dueDate < today) {
                dueDate = new Date(today.getFullYear(), today.getMonth() + 1, recurringDay);
            }

            // Handle months with fewer days
            const lastDayOfMonth = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0).getDate();
            if (recurringDay > lastDayOfMonth) {
                dueDate.setDate(lastDayOfMonth);
            }

            // Calculate days left
            const diffTime = dueDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Only include if within 30 days
            if (daysLeft <= 30 && daysLeft >= 0) {
                items.push({
                    transaction: t,
                    dueDate,
                    daysLeft,
                });
            }
        });

        // Also add non-recurring future transactions
        const futureTransactions = transactions.filter((t) => {
            if (t.isRecurring) return false;
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            const diffTime = tDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return daysLeft > 0 && daysLeft <= 30;
        });

        futureTransactions.forEach((t) => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            const diffTime = tDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            items.push({
                transaction: t,
                dueDate: tDate,
                daysLeft,
            });
        });

        // Sort by days left
        return items.sort((a, b) => a.daysLeft - b.daysLeft);
    }, [transactions]);

    // Get urgency color
    const getUrgencyColor = (daysLeft: number): string => {
        if (daysLeft <= 3) return 'text-rose-400';
        if (daysLeft <= 7) return 'text-amber-400';
        return 'text-neutral-400';
    };

    // Get urgency background
    const getUrgencyBg = (daysLeft: number): string => {
        if (daysLeft <= 3) return 'bg-rose-500/10';
        if (daysLeft <= 7) return 'bg-amber-500/10';
        return 'bg-white/5';
    };

    // Format due date
    const formatDueDate = (date: Date): string => {
        return date.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
        });
    };

    // Get days left label
    const getDaysLeftLabel = (daysLeft: number): string => {
        if (daysLeft === 0) return 'Bugün';
        if (daysLeft === 1) return 'Yarın';
        return `${daysLeft} gün`;
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-white">Yaklaşan Ödemeler</h2>
                    <p className="text-sm text-neutral-500">Önümüzdeki 30 gün</p>
                </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
                {upcomingItems.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-neutral-600" />
                        </div>
                        <p className="text-neutral-400 mb-2">Yaklaşan ödeme yok</p>
                        <p className="text-neutral-600 text-sm">
                            Tekrarlayan işlem ekleyerek takip edebilirsiniz
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className="divide-y divide-white/5"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {upcomingItems.map((item, index) => {
                            const config = CATEGORY_CONFIG[item.transaction.category as TransactionCategory];
                            const isIncome = item.transaction.type === 'income';

                            return (
                                <motion.div
                                    key={`${item.transaction.id}-${index}`}
                                    className={`p-3 md:p-4 flex items-center gap-3 md:gap-4 
                                               ${getUrgencyBg(item.daysLeft)}
                                               hover:bg-white/5 transition-colors`}
                                    variants={itemVariants}
                                >
                                    {/* Type indicator */}
                                    <div
                                        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center
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
                                            <p className="font-medium text-white text-sm md:text-base truncate">
                                                {item.transaction.title}
                                            </p>
                                            {item.transaction.isRecurring && (
                                                <Repeat className="w-3 h-3 text-neutral-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs md:text-sm text-neutral-500 truncate">
                                            {config?.emoji} {config?.label || item.transaction.category} • {formatDueDate(item.dueDate)}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right flex-shrink-0">
                                        <p className={`font-semibold text-sm md:text-base ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isIncome ? '+' : '-'}{formatCurrency(item.transaction.amount, currency)}
                                        </p>
                                        <p className={`text-xs font-medium ${getUrgencyColor(item.daysLeft)}`}>
                                            {getDaysLeftLabel(item.daysLeft)}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Summary Footer */}
            {upcomingItems.length > 0 && (
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-neutral-500">30 Gün İçinde</p>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-emerald-400">
                                    +{formatCurrency(
                                        upcomingItems
                                            .filter((i) => i.transaction.type === 'income')
                                            .reduce((sum, i) => sum + i.transaction.amount, 0),
                                        currency
                                    )}
                                </span>
                                <span className="text-sm text-rose-400">
                                    -{formatCurrency(
                                        upcomingItems
                                            .filter((i) => i.transaction.type === 'expense')
                                            .reduce((sum, i) => sum + i.transaction.amount, 0),
                                        currency
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-neutral-500">Toplam İşlem</p>
                            <p className="text-lg font-bold text-white">{upcomingItems.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
