/**
 * Reports Page - Financial Analytics
 * 
 * Senior Developer Note:
 * Aylık gelir/gider analizi, kategorilere göre dağılım ve bilanço.
 * Pasta grafikleri ile görsel analiz.
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    PieChart as PieChartIcon,
    BarChart3,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
} from 'lucide-react';
import {
    useStore,
    formatCurrency,
    CATEGORY_CONFIG,
    type TransactionCategory,
} from '@/stores/useStore';

// Color palette for pie charts
const INCOME_COLORS = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'];
const EXPENSE_COLORS = ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#fca5a5', '#fecaca'];

export default function ReportsPage() {
    const { activeProfileId, getActiveProfile, getProfileTransactions } = useStore();
    const profile = getActiveProfile();
    const transactions = getProfileTransactions(activeProfileId || '');

    // Get current month data
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyData = useMemo(() => {
        const monthTransactions = transactions.filter((t) => {
            const date = new Date(t.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // Calculate totals
        const totalIncome = monthTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = monthTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Group income by category (keep as is)
        const incomeByCategory: { [key: string]: number } = {};

        // Group expense by title (show individual transactions)
        const expenseByTitle: { [key: string]: { amount: number; category: string } } = {};

        monthTransactions.forEach((t) => {
            if (t.type === 'income') {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else {
                // Group by title for expenses
                if (expenseByTitle[t.title]) {
                    expenseByTitle[t.title].amount += t.amount;
                } else {
                    expenseByTitle[t.title] = { amount: t.amount, category: t.category };
                }
            }
        });

        // Convert to chart data
        const incomeChartData = Object.entries(incomeByCategory).map(([category, amount]) => ({
            name: CATEGORY_CONFIG[category as TransactionCategory]?.label || category,
            value: amount,
            emoji: CATEGORY_CONFIG[category as TransactionCategory]?.emoji || '📊',
        }));

        // Use title for expense chart data
        const expenseChartData = Object.entries(expenseByTitle).map(([title, data]) => ({
            name: title, // İşlem başlığı (örn: "Kira", "Market")
            value: data.amount,
            emoji: CATEGORY_CONFIG[data.category as TransactionCategory]?.emoji || '📊',
            category: CATEGORY_CONFIG[data.category as TransactionCategory]?.label || data.category,
        }));

        return {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            incomeChartData,
            expenseChartData,
            transactionCount: monthTransactions.length,
        };
    }, [transactions, currentMonth, currentYear]);

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

    // Custom tooltip for pie charts
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
                    <p className="text-white font-medium flex items-center gap-2">
                        <span>{data.emoji}</span>
                        {data.name}
                    </p>
                    <p className="text-neutral-400 text-sm mt-1">
                        {formatCurrency(data.value, profile?.currency || 'TRY')}
                    </p>
                </div>
            );
        }
        return null;
    };

    // Get month name in Turkish
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

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
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-violet-400" />
                        </div>
                        Finansal Raporlar
                    </h1>
                    <p className="text-neutral-500 mt-1">
                        {monthNames[currentMonth]} {currentYear} analizi
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-300">{monthNames[currentMonth]} {currentYear}</span>
                </div>
            </motion.div>

            {/* Monthly Balance Summary */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Income */}
                <div className="glass-card p-6 gradient-card-income">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 text-sm">Aylık Gelir</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">
                        {formatCurrency(monthlyData.totalIncome, profile.currency)}
                    </p>
                </div>

                {/* Total Expense */}
                <div className="glass-card p-6 gradient-card-expense">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 text-sm">Aylık Gider</span>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-rose-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-rose-400">
                        {formatCurrency(monthlyData.totalExpense, profile.currency)}
                    </p>
                </div>

                {/* Balance */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 text-sm">Aylık Bilanço</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${monthlyData.balance >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                            }`}>
                            <Wallet className={`w-5 h-5 ${monthlyData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`} />
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${monthlyData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                        {monthlyData.balance >= 0 ? '+' : ''}{formatCurrency(monthlyData.balance, profile.currency)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                        {monthlyData.balance >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                        )}
                        <span className={`text-sm ${monthlyData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {monthlyData.transactionCount} işlem
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Pie Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income by Category */}
                <motion.div variants={itemVariants}>
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Gelir Dağılımı</h2>
                                <p className="text-sm text-neutral-500">Kategorilere göre</p>
                            </div>
                        </div>

                        {monthlyData.incomeChartData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={monthlyData.incomeChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {monthlyData.incomeChartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={INCOME_COLORS[index % INCOME_COLORS.length]}
                                                    stroke="transparent"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-neutral-500">Bu ay henüz gelir kaydı yok</p>
                            </div>
                        )}

                        {/* Legend */}
                        {monthlyData.incomeChartData.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {monthlyData.incomeChartData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length] }}
                                            />
                                            <span className="text-sm text-neutral-400">{item.emoji} {item.name}</span>
                                        </div>
                                        <span className="text-sm text-white font-medium">
                                            {formatCurrency(item.value, profile.currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Expense by Category */}
                <motion.div variants={itemVariants}>
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                <PieChartIcon className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Gider Dağılımı</h2>
                                <p className="text-sm text-neutral-500">Kategorilere göre</p>
                            </div>
                        </div>

                        {monthlyData.expenseChartData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={monthlyData.expenseChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {monthlyData.expenseChartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                                                    stroke="transparent"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-neutral-500">Bu ay henüz gider kaydı yok</p>
                            </div>
                        )}

                        {/* Legend */}
                        {monthlyData.expenseChartData.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {monthlyData.expenseChartData.map((item, index) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                                            />
                                            <span className="text-sm text-neutral-400">{item.emoji} {item.name}</span>
                                        </div>
                                        <span className="text-sm text-white font-medium">
                                            {formatCurrency(item.value, profile.currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Category Breakdown Table */}
            <motion.div variants={itemVariants}>
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Kategori Detayları</h2>
                        <p className="text-sm text-neutral-500 mt-1">Tüm kategorilerin aylık özeti</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-4 px-6 text-sm font-medium text-neutral-400">Kategori</th>
                                    <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">Gelir</th>
                                    <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">Gider</th>
                                    <th className="text-right py-4 px-6 text-sm font-medium text-neutral-400">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Combine all categories */}
                                {(() => {
                                    const allCategories = new Set([
                                        ...monthlyData.incomeChartData.map(i => i.name),
                                        ...monthlyData.expenseChartData.map(e => e.name),
                                    ]);

                                    if (allCategories.size === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-neutral-500">
                                                    Bu ay henüz işlem yok
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return Array.from(allCategories).map((catName) => {
                                        const income = monthlyData.incomeChartData.find(i => i.name === catName);
                                        const expense = monthlyData.expenseChartData.find(e => e.name === catName);
                                        const incomeVal = income?.value || 0;
                                        const expenseVal = expense?.value || 0;
                                        const net = incomeVal - expenseVal;
                                        const emoji = income?.emoji || expense?.emoji || '📊';

                                        return (
                                            <tr key={catName} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 px-6">
                                                    <span className="flex items-center gap-2 text-white">
                                                        <span>{emoji}</span>
                                                        {catName}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right text-emerald-400">
                                                    {incomeVal > 0 ? formatCurrency(incomeVal, profile.currency) : '-'}
                                                </td>
                                                <td className="py-4 px-6 text-right text-rose-400">
                                                    {expenseVal > 0 ? formatCurrency(expenseVal, profile.currency) : '-'}
                                                </td>
                                                <td className={`py-4 px-6 text-right font-medium ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                    {net >= 0 ? '+' : ''}{formatCurrency(net, profile.currency)}
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                            <tfoot>
                                <tr className="bg-white/5">
                                    <td className="py-4 px-6 font-semibold text-white">Toplam</td>
                                    <td className="py-4 px-6 text-right font-bold text-emerald-400">
                                        {formatCurrency(monthlyData.totalIncome, profile.currency)}
                                    </td>
                                    <td className="py-4 px-6 text-right font-bold text-rose-400">
                                        {formatCurrency(monthlyData.totalExpense, profile.currency)}
                                    </td>
                                    <td className={`py-4 px-6 text-right font-bold ${monthlyData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                        }`}>
                                        {monthlyData.balance >= 0 ? '+' : ''}{formatCurrency(monthlyData.balance, profile.currency)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
