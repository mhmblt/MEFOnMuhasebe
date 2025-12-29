/**
 * AreaChart Component - Antigravity UI
 * 
 * Senior Developer Note:
 * Financial data görselleştirmesi için Recharts tabanlı Area Chart.
 * Gelir/Gider akışını smooth gradient fill'ler ve animasyonlu
 * geçişlerle gösterir.
 * 
 * Responsive tasarım: Container query ile otomatik boyutlandırma.
 * Tooltip: Hover'da detaylı veri gösterimi.
 */

'use client';

import { motion } from 'framer-motion';
import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    TooltipProps,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface ChartDataPoint {
    month: string;
    income: number;
    expense: number;
}

interface AreaChartProps {
    data: ChartDataPoint[];
    className?: string;
}

// Dummy data for demonstration
export const sampleChartData: ChartDataPoint[] = [
    { month: 'Tem', income: 45000, expense: 32000 },
    { month: 'Ağu', income: 52000, expense: 28000 },
    { month: 'Eyl', income: 48000, expense: 35000 },
    { month: 'Eki', income: 61000, expense: 41000 },
    { month: 'Kas', income: 55000, expense: 38000 },
    { month: 'Ara', income: 67000, expense: 45000 },
];

/**
 * Custom Tooltip - Glassmorphism stili.
 */
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl 
                 rounded-xl p-3 shadow-xl border border-neutral-200/50 dark:border-neutral-700/50"
        >
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                {label}
            </p>
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                    <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-neutral-500 dark:text-neutral-400">
                        {entry.name === 'income' ? 'Gelir' : 'Gider'}:
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(entry.value as number)}
                    </span>
                </div>
            ))}
        </motion.div>
    );
}

/**
 * Ana Area Chart bileşeni.
 */
export function FinancialAreaChart({ data, className = '' }: AreaChartProps) {
    return (
        <motion.div
            className={`w-full h-[300px] ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <ResponsiveContainer width="100%" height="100%">
                <RechartsAreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    {/* Gradient Definitions */}
                    <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="text-neutral-200 dark:text-neutral-800"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        className="text-neutral-500"
                        dy={10}
                    />

                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        className="text-neutral-500"
                        tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
                        dx={-10}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* Income Area */}
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#incomeGradient)"
                        animationDuration={1000}
                        animationEasing="ease-out"
                    />

                    {/* Expense Area */}
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#F43F5E"
                        strokeWidth={2.5}
                        fill="url(#expenseGradient)"
                        animationDuration={1000}
                        animationEasing="ease-out"
                    />
                </RechartsAreaChart>
            </ResponsiveContainer>
        </motion.div>
    );
}

/**
 * Chart Legend - Grafik altı açıklama.
 */
export function ChartLegend() {
    return (
        <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Gelir</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Gider</span>
            </div>
        </div>
    );
}
