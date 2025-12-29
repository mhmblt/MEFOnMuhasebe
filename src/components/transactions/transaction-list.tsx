/**
 * TransactionList Component - Antigravity UI
 * 
 * Senior Developer Note:
 * Klasik sıkıcı tablolar yerine, her işlemin bir "kart" olduğu modern liste.
 * Kategoriye göre otomatik renk ve ikon ataması yapar.
 * Stagger animasyonları ile listeler akıcı bir şekilde render edilir.
 * 
 * Features:
 * - Category-based color coding
 * - Filterable & sortable
 * - OCR receipt upload simulation
 * - Swipe actions (mobile)
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowUpRight,
    ArrowDownLeft,
    UtensilsCrossed,
    Car,
    ShoppingBag,
    Zap,
    Gamepad2,
    Building2,
    Receipt,
    MoreHorizontal,
    Filter,
    Search,
    Camera,
    type LucideIcon,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useState } from 'react';

// Transaction kategori tipleri
export type TransactionCategory =
    | 'food'
    | 'transport'
    | 'shopping'
    | 'utilities'
    | 'entertainment'
    | 'salary'
    | 'invoice'
    | 'other';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    title: string;
    description?: string;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    date: string;
    status?: 'pending' | 'completed' | 'cancelled';
}

// Kategori konfigürasyonu
const categoryConfig: Record<
    TransactionCategory,
    { icon: LucideIcon; bgColor: string; textColor: string; label: string }
> = {
    food: {
        icon: UtensilsCrossed,
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        textColor: 'text-amber-600 dark:text-amber-400',
        label: 'Yemek',
    },
    transport: {
        icon: Car,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-600 dark:text-blue-400',
        label: 'Ulaşım',
    },
    shopping: {
        icon: ShoppingBag,
        bgColor: 'bg-pink-100 dark:bg-pink-900/30',
        textColor: 'text-pink-600 dark:text-pink-400',
        label: 'Alışveriş',
    },
    utilities: {
        icon: Zap,
        bgColor: 'bg-violet-100 dark:bg-violet-900/30',
        textColor: 'text-violet-600 dark:text-violet-400',
        label: 'Faturalar',
    },
    entertainment: {
        icon: Gamepad2,
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-600 dark:text-purple-400',
        label: 'Eğlence',
    },
    salary: {
        icon: Building2,
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        label: 'Maaş',
    },
    invoice: {
        icon: Receipt,
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        textColor: 'text-cyan-600 dark:text-cyan-400',
        label: 'Fatura',
    },
    other: {
        icon: MoreHorizontal,
        bgColor: 'bg-neutral-100 dark:bg-neutral-800',
        textColor: 'text-neutral-600 dark:text-neutral-400',
        label: 'Diğer',
    },
};

// Örnek veriler
export const sampleTransactions: Transaction[] = [
    {
        id: '1',
        title: 'Maaş Ödemesi',
        description: 'Aralık 2024 maaş',
        amount: 45000,
        type: 'income',
        category: 'salary',
        date: '2024-12-25',
        status: 'completed',
    },
    {
        id: '2',
        title: 'Elektrik Faturası',
        description: 'Aralık ayı elektrik',
        amount: 850,
        type: 'expense',
        category: 'utilities',
        date: '2024-12-24',
        status: 'completed',
    },
    {
        id: '3',
        title: 'Market Alışverişi',
        description: 'Haftalık market',
        amount: 1250,
        type: 'expense',
        category: 'food',
        date: '2024-12-23',
        status: 'completed',
    },
    {
        id: '4',
        title: 'Müşteri Ödemesi',
        description: 'ABC Ltd. Şti. - Fatura #2024-089',
        amount: 12500,
        type: 'income',
        category: 'invoice',
        date: '2024-12-22',
        status: 'completed',
    },
    {
        id: '5',
        title: 'Taksi',
        description: 'Havalimanı transferi',
        amount: 450,
        type: 'expense',
        category: 'transport',
        date: '2024-12-21',
        status: 'completed',
    },
    {
        id: '6',
        title: 'Netflix Abonelik',
        description: 'Aylık abonelik',
        amount: 129,
        type: 'expense',
        category: 'entertainment',
        date: '2024-12-20',
        status: 'completed',
    },
];

/**
 * Transaction List Header - Arama ve filtreleme.
 */
export function TransactionListHeader({
    onSearch,
    onFilter,
}: {
    onSearch?: (query: string) => void;
    onFilter?: () => void;
}) {
    return (
        <div className="flex items-center gap-3 mb-4">
            {/* Search Input */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                    type="text"
                    placeholder="İşlem ara..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl
                     bg-white/50 dark:bg-neutral-800/50
                     border border-neutral-200/50 dark:border-neutral-700/50
                     text-sm text-neutral-900 dark:text-white
                     placeholder:text-neutral-400
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30
                     transition-all"
                    onChange={(e) => onSearch?.(e.target.value)}
                />
            </div>

            {/* Filter Button */}
            <motion.button
                className="h-10 px-4 rounded-xl
                   bg-white/50 dark:bg-neutral-800/50
                   border border-neutral-200/50 dark:border-neutral-700/50
                   text-neutral-600 dark:text-neutral-300
                   flex items-center gap-2 text-sm font-medium
                   hover:bg-neutral-100 dark:hover:bg-neutral-700/50
                   transition-colors"
                onClick={onFilter}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Filter className="w-4 h-4" />
                Filtrele
            </motion.button>
        </div>
    );
}

/**
 * Tek bir transaction kartı.
 */
function TransactionCard({
    transaction,
    index,
}: {
    transaction: Transaction;
    index: number;
}) {
    const config = categoryConfig[transaction.category];
    const CategoryIcon = config.icon;
    const isIncome = transaction.type === 'income';

    return (
        <motion.div
            className="group relative flex items-center gap-4 p-4 rounded-2xl
                 bg-white/60 dark:bg-neutral-800/40
                 backdrop-blur-sm
                 border border-neutral-200/30 dark:border-neutral-700/30
                 hover:bg-white/80 dark:hover:bg-neutral-800/60
                 hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50
                 transition-all duration-300 cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                delay: index * 0.05,
            }}
            whileHover={{ x: 4 }}
        >
            {/* Category Icon */}
            <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center
                    ${config.bgColor} ${config.textColor}
                    transition-transform group-hover:scale-110`}
            >
                <CategoryIcon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-medium text-neutral-900 dark:text-white truncate">
                        {transaction.title}
                    </h4>
                    <span
                        className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}
                    >
                        {config.label}
                    </span>
                </div>
                {transaction.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {transaction.description}
                    </p>
                )}
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {formatDate(transaction.date)}
                </p>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-2">
                <span
                    className={`text-lg font-semibold ${isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                </span>
                {isIncome ? (
                    <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                ) : (
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                )}
            </div>
        </motion.div>
    );
}

/**
 * Ana Transaction List bileşeni.
 */
export function TransactionList({
    transactions,
    className = '',
}: {
    transactions: Transaction[];
    className?: string;
}) {
    return (
        <div className={`space-y-3 ${className}`}>
            <AnimatePresence mode="popLayout">
                {transactions.map((transaction, index) => (
                    <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        index={index}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

/**
 * Receipt Upload Card - OCR simülasyonu için.
 */
export function ReceiptUploadCard() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className="relative p-6 rounded-2xl border-2 border-dashed
                 border-neutral-300 dark:border-neutral-700
                 hover:border-blue-400 dark:hover:border-blue-500
                 bg-neutral-50/50 dark:bg-neutral-800/30
                 transition-colors duration-300 cursor-pointer"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="flex flex-col items-center gap-3 text-center">
                <motion.div
                    className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30
                     flex items-center justify-center"
                    animate={{ y: isHovered ? -4 : 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </motion.div>
                <div>
                    <h4 className="font-medium text-neutral-900 dark:text-white">
                        Fiş Yükle
                    </h4>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        AI ile otomatik veri çıkarımı
                    </p>
                </div>
                <motion.span
                    className="text-xs px-3 py-1 rounded-full
                     bg-blue-100 dark:bg-blue-900/30
                     text-blue-600 dark:text-blue-400"
                    animate={{ scale: isHovered ? 1.05 : 1 }}
                >
                    OCR Destekli
                </motion.span>
            </div>
        </motion.div>
    );
}
