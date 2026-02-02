/**
 * Reports Page - Advanced Financial Analytics
 * 
 * Senior Developer Note:
 * Kapsamlı finansal raporlama sayfası.
 * - PDF/Excel export
 * - Dönem seçici (Aylık/3 Aylık/6 Aylık/Yıllık)
 * - Bar chart (12 aylık trend)
 * - Area chart (gelir vs gider)
 * - Pie charts (kategorilere göre)
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    AreaChart,
    Area,
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
    Download,
    FileText,
    FileSpreadsheet,
    ChevronDown,
} from 'lucide-react';
import {
    useStore,
    formatCurrency,
    CATEGORY_CONFIG,
    type TransactionCategory,
} from '@/stores/useStore';
import { generatePDF, generateExcel, calculatePeriodData } from '@/lib/export-service';

// Color palettes
const INCOME_COLORS = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'];
const EXPENSE_COLORS = ['#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#fca5a5', '#fecaca'];
const MONTH_NAMES = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const MONTH_NAMES_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

type PeriodType = 'month' | 'quarter' | 'half' | 'year';

interface PeriodOption {
    value: PeriodType;
    label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
    { value: 'month', label: 'Bu Ay' },
    { value: 'quarter', label: '3 Aylık' },
    { value: 'half', label: '6 Aylık' },
    { value: 'year', label: 'Yıllık' },
];

export default function ReportsPage() {
    const { activeProfileId, getActiveProfile, getProfileTransactions } = useStore();
    const profile = getActiveProfile();
    const transactions = getProfileTransactions(activeProfileId || '');

    // State
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
    const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Calculate period data
    const periodData = useMemo(() => {
        let startDate: Date;
        let endDate: Date;
        let periodLabel: string;

        switch (selectedPeriod) {
            case 'month':
                startDate = new Date(currentYear, currentMonth, 1);
                endDate = new Date(currentYear, currentMonth + 1, 0);
                periodLabel = `${MONTH_NAMES_FULL[currentMonth]} ${currentYear}`;
                break;
            case 'quarter':
                const quarter = Math.floor(currentMonth / 3);
                startDate = new Date(currentYear, quarter * 3, 1);
                endDate = new Date(currentYear, (quarter + 1) * 3, 0);
                periodLabel = `${quarter + 1}. Çeyrek ${currentYear}`;
                break;
            case 'half':
                const half = currentMonth < 6 ? 0 : 1;
                startDate = new Date(currentYear, half * 6, 1);
                endDate = new Date(currentYear, (half + 1) * 6, 0);
                periodLabel = half === 0 ? `İlk Yarı ${currentYear}` : `İkinci Yarı ${currentYear}`;
                break;
            case 'year':
                startDate = new Date(currentYear, 0, 1);
                endDate = new Date(currentYear, 11, 31);
                periodLabel = `${currentYear} Yılı`;
                break;
        }

        // Filter transactions
        const filteredTransactions = transactions.filter((t) => {
            const date = new Date(t.date);
            return date >= startDate && date <= endDate;
        });

        // Calculate totals
        const totalIncome = filteredTransactions
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = filteredTransactions
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Group income by category
        const incomeByCategory: { [key: string]: number } = {};
        const expenseByTitle: { [key: string]: { amount: number; category: string } } = {};

        filteredTransactions.forEach((t) => {
            if (t.type === 'income') {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            } else {
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

        const expenseChartData = Object.entries(expenseByTitle).map(([title, data]) => ({
            name: title,
            value: data.amount,
            emoji: CATEGORY_CONFIG[data.category as TransactionCategory]?.emoji || '📊',
            category: CATEGORY_CONFIG[data.category as TransactionCategory]?.label || data.category,
        }));

        return {
            transactions: filteredTransactions,
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            incomeChartData,
            expenseChartData,
            transactionCount: filteredTransactions.length,
            periodLabel,
        };
    }, [transactions, selectedPeriod, currentYear, currentMonth]);

    // 12-month trend data (for bar chart)
    const yearlyTrendData = useMemo(() => {
        const data = [];

        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(currentYear, currentMonth - i, 1);
            const year = monthDate.getFullYear();
            const month = monthDate.getMonth();

            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);

            const monthTransactions = transactions.filter((t) => {
                const date = new Date(t.date);
                return date >= monthStart && date <= monthEnd;
            });

            const income = monthTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

            const expense = monthTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            data.push({
                name: `${MONTH_NAMES[month]}`,
                Gelir: income,
                Gider: expense,
                Net: income - expense,
            });
        }

        return data;
    }, [transactions, currentYear, currentMonth]);

    // Handle PDF export
    const handlePDFExport = () => {
        if (!profile) return;

        const data = calculatePeriodData(
            transactions,
            profile.name,
            profile.currency,
            selectedPeriod,
            currentYear,
            currentMonth
        );

        generatePDF(data);
        setExportMenuOpen(false);
    };

    // Handle Excel export
    const handleExcelExport = () => {
        if (!profile) return;

        const data = calculatePeriodData(
            transactions,
            profile.name,
            profile.currency,
            selectedPeriod,
            currentYear,
            currentMonth
        );

        generateExcel(data);
        setExportMenuOpen(false);
    };

    // Custom tooltip
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

    // Bar chart tooltip
    const BarChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
                    <p className="text-white font-medium mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {formatCurrency(entry.value, profile?.currency || 'TRY')}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
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
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Finansal Raporlar</h1>
                        <p className="text-neutral-500">{periodData.periodLabel}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Period Selector */}
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                       bg-white/5 border border-white/10 text-neutral-300
                                       hover:bg-white/10 transition-colors"
                            onClick={() => setPeriodDropdownOpen(!periodDropdownOpen)}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>{PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${periodDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {periodDropdownOpen && (
                                <motion.div
                                    className="absolute top-full left-0 mt-2 w-full min-w-[140px]
                                               bg-neutral-900/95 backdrop-blur-xl border border-white/10
                                               rounded-xl shadow-xl overflow-hidden z-20"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    {PERIOD_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`w-full px-4 py-2.5 text-left text-sm
                                                       hover:bg-white/10 transition-colors
                                                       ${selectedPeriod === option.value
                                                    ? 'text-cyan-400 bg-cyan-500/10'
                                                    : 'text-neutral-300'
                                                }`}
                                            onClick={() => {
                                                setSelectedPeriod(option.value);
                                                setPeriodDropdownOpen(false);
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Export Button */}
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                       bg-gradient-to-r from-cyan-500 to-violet-500
                                       text-white font-medium
                                       hover:opacity-90 transition-opacity"
                            onClick={() => setExportMenuOpen(!exportMenuOpen)}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Dışa Aktar</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {exportMenuOpen && (
                                <motion.div
                                    className="absolute top-full right-0 mt-2 w-48
                                               bg-neutral-900/95 backdrop-blur-xl border border-white/10
                                               rounded-xl shadow-xl overflow-hidden z-20"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <button
                                        className="w-full px-4 py-3 text-left text-sm text-neutral-300
                                                   hover:bg-white/10 transition-colors
                                                   flex items-center gap-3"
                                        onClick={handlePDFExport}
                                    >
                                        <FileText className="w-4 h-4 text-rose-400" />
                                        PDF İndir
                                    </button>
                                    <button
                                        className="w-full px-4 py-3 text-left text-sm text-neutral-300
                                                   hover:bg-white/10 transition-colors
                                                   flex items-center gap-3"
                                        onClick={handleExcelExport}
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                                        Excel İndir
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Income */}
                <div className="glass-card p-6 gradient-card-income">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 text-sm">Toplam Gelir</span>
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-emerald-400">
                        {formatCurrency(periodData.totalIncome, profile.currency)}
                    </p>
                </div>

                {/* Total Expense */}
                <div className="glass-card p-6 gradient-card-expense">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 text-sm">Toplam Gider</span>
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-rose-400" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-rose-400">
                        {formatCurrency(periodData.totalExpense, profile.currency)}
                    </p>
                </div>

                {/* Balance */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-neutral-400 text-sm">Net Bakiye</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                        ${periodData.balance >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                            <Wallet className={`w-5 h-5 ${periodData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${periodData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {periodData.balance >= 0 ? '+' : ''}{formatCurrency(periodData.balance, profile.currency)}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                        {periodData.balance >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-rose-400" />
                        )}
                        <span className={`text-sm ${periodData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {periodData.transactionCount} işlem
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* 12-Month Trend Chart (Bar Chart) */}
            <motion.div variants={itemVariants}>
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">12 Aylık Trend</h2>
                            <p className="text-sm text-neutral-500">Gelir ve gider karşılaştırması</p>
                        </div>
                    </div>

                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#737373"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#737373"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<BarChartTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                />
                                <Bar dataKey="Gelir" fill="#4ade80" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Gider" fill="#f87171" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            {/* Area Chart - Income vs Expense Over Time */}
            <motion.div variants={itemVariants}>
                <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Gelir/Gider Trendi</h2>
                            <p className="text-sm text-neutral-500">Aylık akış grafiği</p>
                        </div>
                    </div>

                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={yearlyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#737373"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#737373"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<BarChartTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="Gelir"
                                    stroke="#4ade80"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Gider"
                                    stroke="#f87171"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            {/* Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Distribution */}
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

                        {periodData.incomeChartData.length > 0 ? (
                            <>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={periodData.incomeChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {periodData.incomeChartData.map((entry, index) => (
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

                                {/* Legend */}
                                <div className="mt-4 space-y-2">
                                    {periodData.incomeChartData.map((item, index) => (
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
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-neutral-500">Bu dönemde gelir kaydı yok</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Expense Distribution */}
                <motion.div variants={itemVariants}>
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                                <PieChartIcon className="w-5 h-5 text-rose-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Gider Dağılımı</h2>
                                <p className="text-sm text-neutral-500">İşlem başlıklarına göre</p>
                            </div>
                        </div>

                        {periodData.expenseChartData.length > 0 ? (
                            <>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={periodData.expenseChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {periodData.expenseChartData.map((entry, index) => (
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

                                {/* Legend */}
                                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                                    {periodData.expenseChartData.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }}
                                                />
                                                <span className="text-sm text-neutral-400 truncate">{item.emoji} {item.name}</span>
                                            </div>
                                            <span className="text-sm text-white font-medium flex-shrink-0">
                                                {formatCurrency(item.value, profile.currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <p className="text-neutral-500">Bu dönemde gider kaydı yok</p>
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
                        <p className="text-sm text-neutral-500 mt-1">{periodData.periodLabel} özeti</p>
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
                                {(() => {
                                    const allCategories = new Set([
                                        ...periodData.incomeChartData.map(i => i.name),
                                        ...periodData.expenseChartData.map(e => e.name),
                                    ]);

                                    if (allCategories.size === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-neutral-500">
                                                    Bu dönemde işlem yok
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return Array.from(allCategories).map((catName) => {
                                        const income = periodData.incomeChartData.find(i => i.name === catName);
                                        const expense = periodData.expenseChartData.find(e => e.name === catName);
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
                                                <td className={`py-4 px-6 text-right font-medium ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                                        {formatCurrency(periodData.totalIncome, profile.currency)}
                                    </td>
                                    <td className="py-4 px-6 text-right font-bold text-rose-400">
                                        {formatCurrency(periodData.totalExpense, profile.currency)}
                                    </td>
                                    <td className={`py-4 px-6 text-right font-bold ${periodData.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {periodData.balance >= 0 ? '+' : ''}{formatCurrency(periodData.balance, profile.currency)}
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
