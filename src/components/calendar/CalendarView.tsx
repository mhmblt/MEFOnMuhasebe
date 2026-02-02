/**
 * CalendarView Component - Monthly Calendar Grid
 * 
 * Senior Developer Note:
 * Aylık takvim görünümü. Her günde gelir/gider tutarları gösterilir.
 * Tekrarlayan işlemler için recurringDay kullanılarak ileriki aylar da hesaplanır.
 */

'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Transaction, type Currency, formatCurrency } from '@/stores/useStore';

interface CalendarViewProps {
    transactions: Transaction[];
    currency: Currency;
    onDayClick: (date: Date, dayTransactions: Transaction[]) => void;
}

interface DayData {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    income: number;
    expense: number;
    transactions: Transaction[];
}

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export default function CalendarView({ transactions, currency, onDayClick }: CalendarViewProps) {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());

    // Calculate calendar data
    const calendarData = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Get the starting day (Monday = 0, Sunday = 6)
        let startDay = firstDayOfMonth.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const daysInMonth = lastDayOfMonth.getDate();
        const days: DayData[] = [];

        // Previous month days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            days.push({
                date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
                isCurrentMonth: false,
                isToday: false,
                income: 0,
                expense: 0,
                transactions: [],
            });
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();

            // Find transactions for this day
            const dayTransactions: Transaction[] = [];
            let income = 0;
            let expense = 0;

            transactions.forEach((t) => {
                const tDate = new Date(t.date);
                const isMatch =
                    tDate.getDate() === day &&
                    tDate.getMonth() === currentMonth &&
                    tDate.getFullYear() === currentYear;

                // Also check recurring transactions
                const isRecurringMatch =
                    t.isRecurring &&
                    t.recurringDay === day &&
                    (currentYear > tDate.getFullYear() ||
                        (currentYear === tDate.getFullYear() && currentMonth >= tDate.getMonth()));

                if (isMatch || isRecurringMatch) {
                    dayTransactions.push(t);
                    if (t.type === 'income') {
                        income += t.amount;
                    } else {
                        expense += t.amount;
                    }
                }
            });

            days.push({
                date,
                isCurrentMonth: true,
                isToday,
                income,
                expense,
                transactions: dayTransactions,
            });
        }

        // Next month days to fill the grid
        const remainingDays = 42 - days.length; // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: new Date(currentYear, currentMonth + 1, i),
                isCurrentMonth: false,
                isToday: false,
                income: 0,
                expense: 0,
                transactions: [],
            });
        }

        return days;
    }, [transactions, currentYear, currentMonth, today]);

    // Navigation handlers
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
    };

    return (
        <div className="glass-card p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white">
                        {MONTHS[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium
                                   bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10
                                   transition-colors"
                    >
                        Bugün
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <motion.button
                        className="w-8 h-8 rounded-lg flex items-center justify-center
                                   bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10
                                   transition-colors"
                        onClick={goToPreviousMonth}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        className="w-8 h-8 rounded-lg flex items-center justify-center
                                   bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10
                                   transition-colors"
                        onClick={goToNextMonth}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-neutral-500 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarData.map((day, index) => {
                    const hasTransactions = day.income > 0 || day.expense > 0;

                    return (
                        <motion.button
                            key={index}
                            className={`
                                relative min-h-[70px] md:min-h-[90px] p-1.5 md:p-2 rounded-lg
                                flex flex-col items-start
                                transition-all
                                ${day.isCurrentMonth
                                    ? 'bg-white/5 hover:bg-white/10'
                                    : 'bg-transparent opacity-40'
                                }
                                ${day.isToday ? 'ring-2 ring-cyan-500/50' : ''}
                                ${hasTransactions ? 'cursor-pointer' : 'cursor-default'}
                            `}
                            onClick={() => hasTransactions && onDayClick(day.date, day.transactions)}
                            whileHover={hasTransactions ? { scale: 1.02 } : {}}
                            whileTap={hasTransactions ? { scale: 0.98 } : {}}
                        >
                            {/* Date number */}
                            <span
                                className={`
                                    text-xs md:text-sm font-medium
                                    ${day.isToday
                                        ? 'w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center'
                                        : day.isCurrentMonth
                                            ? 'text-neutral-300'
                                            : 'text-neutral-600'
                                    }
                                `}
                            >
                                {day.date.getDate()}
                            </span>

                            {/* Amounts */}
                            {day.isCurrentMonth && (
                                <div className="flex-1 w-full mt-1 space-y-0.5">
                                    {day.income > 0 && (
                                        <div className="text-[10px] md:text-xs text-emerald-400 font-medium truncate">
                                            +{formatCurrency(day.income, currency).replace(/[₺$€]/g, '')}
                                        </div>
                                    )}
                                    {day.expense > 0 && (
                                        <div className="text-[10px] md:text-xs text-rose-400 font-medium truncate">
                                            -{formatCurrency(day.expense, currency).replace(/[₺$€]/g, '')}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Transaction indicator dots */}
                            {day.isCurrentMonth && hasTransactions && (
                                <div className="absolute bottom-1 right-1 flex gap-0.5">
                                    {day.income > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    )}
                                    {day.expense > 0 && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    )}
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs text-neutral-400">Gelir</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <span className="text-xs text-neutral-400">Gider</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-xs text-neutral-400">Bugün</span>
                </div>
            </div>
        </div>
    );
}
